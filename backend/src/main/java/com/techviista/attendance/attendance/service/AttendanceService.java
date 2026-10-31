package com.techviista.attendance.attendance.service;

import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.events.AttendanceEvent;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import com.techviista.attendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final BreakSessionRepository breakSessionRepository;
    private final EmployeeRepository employeeRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public AttendanceResponse checkIn(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        if (!employee.isActive()) {
            throw new IllegalStateException("Your employee account is inactive. Please contact your manager.");
        }

        LocalDate today = LocalDate.now(); // We will make this timezone-aware later

        // PRD Rule: Reject duplicate check-ins
        if (attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, today).isPresent()) {
            throw new IllegalStateException("You are already checked in for today.");
        }

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .workDate(today)
                .checkInAt(OffsetDateTime.now())
                .status(AttendanceStatus.WORKING)
                .build();

        attendanceRepository.save(attendance);

        if (kafkaTemplate != null) {
            AttendanceEvent event = new AttendanceEvent(
                    employee.getId(),
                    "CHECK_IN",
                    attendance.getCheckInAt().toString()
            );
            // Send to a topic named "attendance-events"
            kafkaTemplate.send("attendance-events", event);
        }

        return mapToResponse(attendance);
    }

    @Transactional
    public AttendanceResponse startBreak(UUID employeeId) {
        Attendance attendance = getTodayActiveAttendance(employeeId);

        if (attendance.getStatus() != AttendanceStatus.WORKING) {
            throw new IllegalStateException("Can only start a break while working.");
        }

        if (breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendance.getId()).isPresent()) {
            throw new IllegalStateException("A break is already active.");
        }

        BreakSession breakSession = BreakSession.builder()
                .attendance(attendance)
                .startedAt(OffsetDateTime.now())
                .build();

        breakSessionRepository.save(breakSession);
        attendance.setStatus(AttendanceStatus.ON_BREAK);
        attendanceRepository.save(attendance);

        return mapToResponse(attendance);
    }

    @Transactional
    public AttendanceResponse endBreak(UUID employeeId) {
        Attendance attendance = getTodayActiveAttendance(employeeId);

        // PRD Rule: End break allowed only when a break is active
        if (attendance.getStatus() != AttendanceStatus.ON_BREAK) {
            throw new IllegalStateException("You are not currently on a break.");
        }

        BreakSession activeBreak = breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendance.getId())
                .orElseThrow(() -> new IllegalStateException("No active break found to end."));

        activeBreak.setEndedAt(OffsetDateTime.now());
        breakSessionRepository.save(activeBreak);

        attendance.setStatus(AttendanceStatus.WORKING);
        attendanceRepository.save(attendance);

        return mapToResponse(attendance);
    }

    @Transactional
    public AttendanceResponse checkOut(UUID employeeId) {
        Attendance attendance = getTodayActiveAttendance(employeeId);

        if (attendance.getStatus() == AttendanceStatus.COMPLETED) {
            throw new IllegalStateException("You have already checked out today.");
        }

        // PRD Rule: No open break may remain when checking out
        if (breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendance.getId()).isPresent()) {
            throw new IllegalStateException("Cannot check out while a break is active. Please end your break first.");
        }

        attendance.setCheckOutAt(OffsetDateTime.now());
        attendance.setStatus(AttendanceStatus.COMPLETED);
        attendanceRepository.save(attendance);

        return mapToResponse(attendance);
    }

    @Transactional(readOnly = true)
    public AttendanceResponse getTodayAttendance(UUID employeeId) {
        LocalDate today = LocalDate.now();

        return attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, today)
                .map(this::mapToResponse) // Uses the mapping function we wrote earlier
                .orElseThrow(() -> new NoSuchElementException("No attendance record found for today"));
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceHistory(UUID employeeId) {
        List<Attendance> history = attendanceRepository.findByEmployeeIdOrderByWorkDateDesc(employeeId);

        return history.stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Helper method to fetch today's record
    private Attendance getTodayActiveAttendance(UUID employeeId) {
        return attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.now())
                .orElseThrow(() -> new IllegalStateException("No active attendance session for today."));
    }

    // This replaces the placeholder mapToResponse we wrote earlier
    private AttendanceResponse mapToResponse(Attendance attendance) {
        List<BreakSession> dailyBreaks = breakSessionRepository.findByAttendanceId(attendance.getId());

        long totalBreakMinutes = 0;
        List<AttendanceResponse.BreakDetailDTO> breakDTOs = new java.util.ArrayList<>();
        for (BreakSession b : dailyBreaks) {
            long duration = 0;
            // PRD Rule: Recorded break time = sum of completed break durations
            if (b.getEndedAt() != null) {
                duration = Duration.between(b.getStartedAt(), b.getEndedAt()).toMinutes();
                totalBreakMinutes += duration;
            } else if (b.getStartedAt() != null) {
                duration = Duration.between(b.getStartedAt(), OffsetDateTime.now()).toMinutes();
            }
            breakDTOs.add(AttendanceResponse.BreakDetailDTO.builder()
                    .id(b.getId())
                    .startedAt(b.getStartedAt())
                    .endedAt(b.getEndedAt())
                    .durationMinutes(duration)
                    .build());
        }

        long elapsedMinutes = 0;
        OffsetDateTime calculationEnd = (attendance.getCheckOutAt() != null) ? attendance.getCheckOutAt() : OffsetDateTime.now();

        if (attendance.getCheckInAt() != null) {
            elapsedMinutes = Duration.between(attendance.getCheckInAt(), calculationEnd).toMinutes();
        }

        // PRD Rule: Net work time = elapsed attendance time minus recorded break time. No negative values.
        long netWorkMinutes = Math.max(0, elapsedMinutes - totalBreakMinutes);

        return AttendanceResponse.builder()
                .id(attendance.getId())
                .workDate(attendance.getWorkDate())
                .status(attendance.getStatus())
                .checkInAt(attendance.getCheckInAt())
                .checkOutAt(attendance.getCheckOutAt())
                .elapsedMinutes(elapsedMinutes)
                .breakMinutes(totalBreakMinutes)
                .netWorkMinutes(netWorkMinutes)
                .breaks(breakDTOs)
                .build();
    }
}

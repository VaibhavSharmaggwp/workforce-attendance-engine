package com.techviista.attendance.attendance.service;

import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import com.techviista.attendance.repository.EmployeeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final BreakSessionRepository breakSessionRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public AttendanceResponse checkIn(UUID employeeId){
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(()-> new IllegalArgumentException("Employee not found"));

        LocalDate today = LocalDate.now(); // We will make this timezone-aware later

        // PRD Rule: Reject duplicate check-ins
        if(attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, today).isPresent()){
            throw new IllegalStateException("You are already checked in for today.");
        }

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .workDate(today)
                .checkInAt(OffsetDateTime.now())
                .status(AttendanceStatus.WORKING)
                .build();

        attendanceRepository.save(attendance);
        return mapToResponse(attendance); // We will implement the mapping logic next
    }
    @Transactional
    public AttendanceResponse startBreak(UUID employeeId){
        Attendance attendance = getTodayActiveAttendance(employeeId);

        if(attendance.getStatus() != AttendanceStatus.WORKING){
            throw new IllegalStateException("Can only start a break while working.");
        }

        if(breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendance.getId()).isPresent()){
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

    // Helper method to fetch today's record
    private Attendance getTodayActiveAttendance(UUID employeeId){
        return attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.now())
                .orElseThrow(() -> new IllegalStateException("No active attendance session for today."));
    }

    // Placeholder for DTO mapping
    private AttendanceResponse mapToResponse(Attendance attendance) {
        return AttendanceResponse.builder()
                .id(attendance.getId())
                .status(attendance.getStatus())
                .checkInAt(attendance.getCheckInAt())
                .build();
    }
}

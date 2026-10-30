package com.techviista.attendance.admin.adminService;

import com.techviista.attendance.admin.CreateEmployeeRequest;
import com.techviista.attendance.admin.TeamAttendanceDashboardDTO;
import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import com.techviista.attendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final BreakSessionRepository breakSessionRepository;

    @Transactional
    public Employee provisionEmployee(CreateEmployeeRequest request) {
        if (employeeRepository.findByEmail(request.email().trim().toLowerCase()).isPresent()) {
            throw new IllegalStateException("An employee with this email already exists.");
        }

        Employee newEmployee = Employee.builder()
                .fullName(request.fullName().trim())
                .email(request.email().trim().toLowerCase())
                .role(request.role() != null ? request.role() : com.techviista.attendance.employee.EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();

        return employeeRepository.save(newEmployee);
    }

    @Transactional(readOnly = true)
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public TeamAttendanceDashboardDTO getTeamAttendanceToday() {
        return getTeamAttendanceForDate(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public TeamAttendanceDashboardDTO getTeamAttendanceForDate(LocalDate targetDate) {
        LocalDate date = (targetDate != null) ? targetDate : LocalDate.now();
        List<Employee> allEmployees = employeeRepository.findAll();
        List<Attendance> todaySessions = attendanceRepository.findByWorkDate(date);

        Map<UUID, Attendance> sessionByEmp = new HashMap<>();
        for (Attendance a : todaySessions) {
            sessionByEmp.put(a.getEmployee().getId(), a);
        }

        int workingCount = 0;
        int onBreakCount = 0;
        int checkedOutCount = 0;
        int notCheckedInCount = 0;
        int incompleteCount = 0;
        int overBreakCount = 0;

        List<TeamAttendanceDashboardDTO.TeamMemberAttendanceDTO> memberList = new ArrayList<>();

        for (Employee emp : allEmployees) {
            Attendance att = sessionByEmp.get(emp.getId());
            if (att == null) {
                notCheckedInCount++;
                memberList.add(TeamAttendanceDashboardDTO.TeamMemberAttendanceDTO.builder()
                        .employeeId(emp.getId())
                        .fullName(emp.getFullName())
                        .email(emp.getEmail())
                        .role(emp.getRole())
                        .status("NOT_CHECKED_IN")
                        .breakCount(0)
                        .totalBreakMinutes(0)
                        .netWorkMinutes(0)
                        .netWorkFormatted("0m")
                        .breaks(Collections.emptyList())
                        .build());
            } else {
                List<BreakSession> breaks = breakSessionRepository.findByAttendanceId(att.getId());
                long totalBreakMinutes = 0;
                boolean hasActiveBreak = false;
                long activeBreakMinutes = 0;
                boolean breakOverOneHour = false;
                List<AttendanceResponse.BreakDetailDTO> breakDTOs = new ArrayList<>();

                for (BreakSession b : breaks) {
                    long duration = 0;
                    if (b.getEndedAt() != null) {
                        duration = Duration.between(b.getStartedAt(), b.getEndedAt()).toMinutes();
                        totalBreakMinutes += duration;
                        if (duration > 60) {
                            breakOverOneHour = true;
                        }
                    } else if (b.getStartedAt() != null) {
                        hasActiveBreak = true;
                        activeBreakMinutes = Duration.between(b.getStartedAt(), OffsetDateTime.now()).toMinutes();
                        duration = activeBreakMinutes;
                        if (duration > 60) {
                            breakOverOneHour = true;
                        }
                    }
                    breakDTOs.add(AttendanceResponse.BreakDetailDTO.builder()
                            .id(b.getId())
                            .startedAt(b.getStartedAt())
                            .endedAt(b.getEndedAt())
                            .durationMinutes(duration)
                            .build());
                }

                if (totalBreakMinutes > 60 || activeBreakMinutes > 60) {
                    breakOverOneHour = true;
                    overBreakCount++;
                }

                OffsetDateTime calcEnd = (att.getCheckOutAt() != null) ? att.getCheckOutAt() : OffsetDateTime.now();
                long elapsed = Duration.between(att.getCheckInAt(), calcEnd).toMinutes();
                long netWorkMinutes = Math.max(0, elapsed - totalBreakMinutes);

                String statusStr = att.getStatus().name();
                switch (att.getStatus()) {
                    case WORKING -> workingCount++;
                    case ON_BREAK -> onBreakCount++;
                    case COMPLETED -> checkedOutCount++;
                    case INCOMPLETE -> incompleteCount++;
                }

                memberList.add(TeamAttendanceDashboardDTO.TeamMemberAttendanceDTO.builder()
                        .employeeId(emp.getId())
                        .fullName(emp.getFullName())
                        .email(emp.getEmail())
                        .role(emp.getRole())
                        .attendanceId(att.getId())
                        .status(statusStr)
                        .checkInAt(att.getCheckInAt())
                        .checkOutAt(att.getCheckOutAt())
                        .breakCount(breaks.size())
                        .totalBreakMinutes(totalBreakMinutes)
                        .hasActiveBreak(hasActiveBreak)
                        .activeBreakMinutes(activeBreakMinutes)
                        .breakOverOneHour(breakOverOneHour)
                        .netWorkMinutes(netWorkMinutes)
                        .netWorkFormatted(formatMinutes(netWorkMinutes))
                        .breaks(breakDTOs)
                        .build());
            }
        }

        return TeamAttendanceDashboardDTO.builder()
                .date(date)
                .totalEmployees(allEmployees.size())
                .workingCount(workingCount)
                .onBreakCount(onBreakCount)
                .checkedOutCount(checkedOutCount)
                .notCheckedInCount(notCheckedInCount)
                .incompleteCount(incompleteCount)
                .overBreakCount(overBreakCount)
                .members(memberList)
                .build();
    }

    @Transactional(readOnly = true)
    public AttendanceResponse getAttendanceRecordDetail(UUID attendanceId) {
        Attendance att = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new NoSuchElementException("Attendance record not found"));

        return mapToResponse(att);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getFilteredAttendance(LocalDate date, UUID employeeId, AttendanceStatus status) {
        List<Attendance> list;
        if (employeeId != null && date != null) {
            list = attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, date).stream().toList();
        } else if (employeeId != null) {
            list = attendanceRepository.findByEmployeeIdOrderByWorkDateDesc(employeeId);
        } else if (date != null) {
            list = attendanceRepository.findByWorkDate(date);
        } else {
            list = attendanceRepository.findAll();
        }

        if (status != null) {
            list = list.stream().filter(a -> a.getStatus() == status).toList();
        }

        return list.stream().map(this::mapToResponse).toList();
    }

    private AttendanceResponse mapToResponse(Attendance attendance) {
        List<BreakSession> dailyBreaks = breakSessionRepository.findByAttendanceId(attendance.getId());

        long totalBreakMinutes = 0;
        List<AttendanceResponse.BreakDetailDTO> breakDTOs = new ArrayList<>();
        for (BreakSession b : dailyBreaks) {
            long duration = 0;
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

    private String formatMinutes(long minutes) {
        long h = minutes / 60;
        long m = minutes % 60;
        if (h > 0) {
            return h + "h " + m + "m";
        }
        return m + "m";
    }
}

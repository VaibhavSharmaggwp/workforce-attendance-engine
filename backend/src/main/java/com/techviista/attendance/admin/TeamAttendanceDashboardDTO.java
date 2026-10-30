package com.techviista.attendance.admin;

import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.employee.EmployeeRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamAttendanceDashboardDTO {
    private LocalDate date;
    private int totalEmployees;
    private int workingCount;
    private int onBreakCount;
    private int checkedOutCount;
    private int notCheckedInCount;
    private int incompleteCount;
    private int overBreakCount;
    private List<TeamMemberAttendanceDTO> members;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamMemberAttendanceDTO {
        private UUID employeeId;
        private String fullName;
        private String email;
        private EmployeeRole role;
        private UUID attendanceId;
        private String status; // WORKING, ON_BREAK, COMPLETED, NOT_CHECKED_IN, INCOMPLETE
        private OffsetDateTime checkInAt;
        private OffsetDateTime checkOutAt;
        private int breakCount;
        private long totalBreakMinutes;
        private boolean hasActiveBreak;
        private long activeBreakMinutes;
        private boolean breakOverOneHour;
        private long netWorkMinutes;
        private String netWorkFormatted;
        private List<AttendanceResponse.BreakDetailDTO> breaks;
    }
}

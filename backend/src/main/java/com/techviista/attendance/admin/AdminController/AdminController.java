package com.techviista.attendance.admin.AdminController;

import com.techviista.attendance.admin.CreateEmployeeRequest;
import com.techviista.attendance.admin.TeamAttendanceDashboardDTO;
import com.techviista.attendance.admin.adminService.AdminService;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.employee.Employee;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @PostMapping("/employees")
    public ResponseEntity<Employee> addEmployee(@RequestBody CreateEmployeeRequest request) {
        Employee created = adminService.provisionEmployee(request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/employees")
    public ResponseEntity<List<Employee>> getEmployees() {
        return ResponseEntity.ok(adminService.getAllEmployees());
    }

    @GetMapping("/attendance/today")
    public ResponseEntity<TeamAttendanceDashboardDTO> getTeamAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(adminService.getTeamAttendanceForDate(date != null ? date : LocalDate.now()));
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceList(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) AttendanceStatus status) {
        return ResponseEntity.ok(adminService.getFilteredAttendance(date, employeeId, status));
    }

    @GetMapping("/attendance/{id}")
    public ResponseEntity<AttendanceResponse> getAttendanceDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getAttendanceRecordDetail(id));
    }
}

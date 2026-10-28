package com.techviista.attendance.admin.AdminController;


import com.techviista.attendance.admin.CreateEmployeeRequest;
import com.techviista.attendance.admin.adminService.AdminService;
import com.techviista.attendance.employee.Employee;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('MANAGER')")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @PostMapping("/employees")
    public ResponseEntity<Employee> addEmployee(@RequestBody CreateEmployeeRequest request) {
        Employee created = adminService.provisionEmployee(request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/attendance/today")
    public ResponseEntity<?> getTeamAttendance() {
        return ResponseEntity.ok(adminService.getTeamAttendanceToday());
    }
}

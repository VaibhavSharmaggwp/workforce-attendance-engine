package com.techviista.attendance.controller;


import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.attendance.service.AttendanceService;
import com.techviista.attendance.employee.Employee;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;

    @PostMapping("/check-in")
    public ResponseEntity<AttendanceResponse> checkIn(@AuthenticationPrincipal Employee currentEmployee) {
        // We pull the ID directly from the secure token, completely ignoring the frontend
        AttendanceResponse response = attendanceService.checkIn(currentEmployee.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/breaks/start")
    public ResponseEntity<AttendanceResponse> startBreak(@AuthenticationPrincipal Employee currentEmployee) {
        AttendanceResponse response = attendanceService.startBreak(currentEmployee.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/breaks/end")
    public ResponseEntity<AttendanceResponse> endBreak(@AuthenticationPrincipal Employee currentEmployee) {
        AttendanceResponse response = attendanceService.endBreak(currentEmployee.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/check-out")
    public ResponseEntity<AttendanceResponse> checkOut(@AuthenticationPrincipal Employee currentEmployee) {
        AttendanceResponse response = attendanceService.checkOut(currentEmployee.getId());
        return ResponseEntity.ok(response);
    }
}

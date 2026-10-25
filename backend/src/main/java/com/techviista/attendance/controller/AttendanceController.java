package com.techviista.attendance.controller;


import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.attendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;

    /*
     * NOTE: For now, we are passing the employee ID via a custom HTTP Header ("X-Employee-Id").
     * Once we configure Google OAuth2 & Spring Security later, we will extract this securely
     * from the logged-in user's session token as required by the PRD.
     */
    @PostMapping("/check-in")
    public ResponseEntity<AttendanceResponse> checkIn(@RequestHeader("X-Employee-Id") UUID employeeId){
        AttendanceResponse response = attendanceService.checkIn(employeeId);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/breaks/start")
    public ResponseEntity<AttendanceResponse> startBreak(@RequestHeader("X-Employee-Id") UUID employeeId) {
        AttendanceResponse response = attendanceService.startBreak(employeeId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/breaks/end")
    public ResponseEntity<AttendanceResponse> endBreak(@RequestHeader("X-Employee-Id") UUID employeeId) {
        AttendanceResponse response = attendanceService.endBreak(employeeId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/check-out")
    public ResponseEntity<AttendanceResponse> checkOut(@RequestHeader("X-Employee-Id") UUID employeeId) {
        AttendanceResponse response = attendanceService.checkOut(employeeId);
        return ResponseEntity.ok(response);
    }
}

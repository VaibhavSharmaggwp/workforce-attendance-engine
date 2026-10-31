package com.techviista.attendance.activity.controller;

import com.techviista.attendance.activity.ActivityLog;
import com.techviista.attendance.activity.dto.EngagementSummaryDTO;
import com.techviista.attendance.activity.dto.SheetActivityRequest;
import com.techviista.attendance.activity.service.ActivityService;
import com.techviista.attendance.employee.Employee;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    /**
     * Webhook pulse endpoint for Google Sheets / Excel Online.
     * Fires automatically on cell edits or row changes.
     */
    @PostMapping("/pulse")
    public ResponseEntity<Map<String, Object>> recordPulse(@Valid @RequestBody SheetActivityRequest request) {
        ActivityLog saved = activityService.recordActivity(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "SUCCESS",
                "message", "Activity pulse recorded successfully",
                "logId", saved.getId(),
                "loggedAt", saved.getLoggedAt()
        ));
    }

    /**
     * Get the logged-in employee's engagement stats for today.
     */
    @GetMapping("/today")
    public ResponseEntity<EngagementSummaryDTO> getTodayEngagement(@AuthenticationPrincipal Employee currentEmployee) {
        UUID empId = currentEmployee != null ? currentEmployee.getId() : null;
        if (empId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EngagementSummaryDTO summary = activityService.getEmployeeDailyEngagement(empId, LocalDate.now());
        return ResponseEntity.ok(summary);
    }

    /**
     * Get engagement stats for a specific employee on a given date.
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<EngagementSummaryDTO> getEmployeeEngagement(
            @PathVariable UUID employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        EngagementSummaryDTO summary = activityService.getEmployeeDailyEngagement(employeeId, targetDate);
        return ResponseEntity.ok(summary);
    }

    /**
     * Manager / Admin view: Get engagement overview across all active employees.
     */
    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<EngagementSummaryDTO>> getTeamEngagement(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<EngagementSummaryDTO> teamEngagement = activityService.getTeamEngagement(targetDate);
        return ResponseEntity.ok(teamEngagement);
    }
}

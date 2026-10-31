package com.techviista.attendance.alerts.controller;

import com.techviista.attendance.alerts.service.AlertSettingsService;
import com.techviista.attendance.alerts.service.InactivityScannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class AlertSettingsController {

    private final AlertSettingsService alertSettingsService;
    private final InactivityScannerService inactivityScannerService;

    @GetMapping("/settings/alerts")
    public ResponseEntity<Map<String, Object>> getAlertSettings() {
        return ResponseEntity.ok(Map.of(
                "emailAlertsEnabled", alertSettingsService.isEmailAlertsEnabled(),
                "inactivityThresholdMinutes", 120,
                "maxEmailsPerDayPerEmployee", 1
        ));
    }

    @PostMapping("/settings/alerts/toggle")
    public ResponseEntity<Map<String, Object>> toggleAlertSettings() {
        boolean updated = alertSettingsService.toggleEmailAlerts();
        return ResponseEntity.ok(Map.of(
                "emailAlertsEnabled", updated,
                "message", updated ? "Inactivity email alerts enabled" : "Inactivity email alerts disabled"
        ));
    }

    @PostMapping("/settings/alerts")
    public ResponseEntity<Map<String, Object>> setAlertSettings(@RequestBody Map<String, Boolean> body) {
        boolean enabled = body.getOrDefault("emailAlertsEnabled", true);
        alertSettingsService.setEmailAlertsEnabled(enabled);
        return ResponseEntity.ok(Map.of(
                "emailAlertsEnabled", enabled,
                "message", "Alert preferences updated"
        ));
    }

    @PostMapping("/alerts/scan")
    public ResponseEntity<Map<String, Object>> triggerManualScan(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate scanDate = date != null ? date : LocalDate.now();
        int count = inactivityScannerService.runInactivityScan(scanDate);
        return ResponseEntity.ok(Map.of(
                "scanDate", scanDate,
                "alertsDispatched", count,
                "message", String.format("Inactivity scan finished. %d alert(s) dispatched to manager.", count)
        ));
    }
}

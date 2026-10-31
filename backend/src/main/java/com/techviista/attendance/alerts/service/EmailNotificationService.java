package com.techviista.attendance.alerts.service;

import com.techviista.attendance.events.InactivityAlertEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailNotificationService {

    public void sendInactivityAlertEmail(InactivityAlertEvent event) {
        String hoursFormatted = String.format("%dh %02dm", event.idleMinutes() / 60, event.idleMinutes() % 60);

        String emailBody = String.format("""
                ========================================================================================
                [OUTGOING EMAIL DISPATCH]
                To: %s
                Subject: \u26A0\uFE0F [Attendance Alert] Inactivity Detected: %s (>2h Idle)
                
                Dear Manager,
                
                This is an automated alert from the Workforce Attendance Engine.
                
                Employee: %s (%s)
                Work Date: %s
                Current Attendance Status: Checked in (WORKING)
                Continuous Idle Duration: %s (Break time excluded)
                Last Verified Spreadsheet Edit: %s
                
                Anti-Spam Policy Notice:
                This alert is sent at most ONCE per employee per day.
                You can manage email alert preferences anytime in the Team Attendance Dashboard.
                ========================================================================================
                """,
                event.managerEmail(),
                event.employeeName(),
                event.employeeName(),
                event.employeeEmail(),
                event.workDate(),
                hoursFormatted,
                event.lastActiveTime() != null ? event.lastActiveTime() : "No edits recorded today"
        );

        log.warn("DISPATCHING INACTIVITY EMAIL TO MANAGER:\n{}", emailBody);
    }
}

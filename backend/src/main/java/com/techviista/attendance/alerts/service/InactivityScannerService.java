package com.techviista.attendance.alerts.service;

import com.techviista.attendance.activity.ActivityLog;
import com.techviista.attendance.alerts.InactivityAlert;
import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.events.InactivityAlertEvent;
import com.techviista.attendance.repository.ActivityLogRepository;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import com.techviista.attendance.repository.InactivityAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class InactivityScannerService {

    private final AttendanceRepository attendanceRepository;
    private final ActivityLogRepository activityLogRepository;
    private final BreakSessionRepository breakSessionRepository;
    private final InactivityAlertRepository inactivityAlertRepository;
    private final AlertSettingsService alertSettingsService;
    private final EmailNotificationService emailNotificationService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Automatic scheduled scanner - runs every 15 minutes.
     * Fixed rate: 900,000 ms (15 mins) with an initial delay of 30,000 ms.
     */
    @Scheduled(fixedRate = 900000, initialDelay = 30000)
    public void scheduledInactivityScan() {
        runInactivityScan(LocalDate.now());
    }

    /**
     * Core scan execution (can also be invoked manually by manager for testing).
     */
    @Transactional
    public int runInactivityScan(LocalDate targetDate) {
        if (!alertSettingsService.isEmailAlertsEnabled()) {
            log.info("Inactivity scan skipped: Manager has disabled email alerts.");
            return 0;
        }

        List<Attendance> activeSessions = attendanceRepository.findByWorkDateAndStatus(targetDate, AttendanceStatus.WORKING);
        log.info("Scanning {} active working sessions on {} for >2h spreadsheet inactivity...",
                activeSessions.size(), targetDate);

        OffsetDateTime now = OffsetDateTime.now();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        int alertsDispatched = 0;

        for (Attendance session : activeSessions) {
            Employee employee = session.getEmployee();

            // 1. Anti-spam check: Max 1 email alert per employee per day
            if (inactivityAlertRepository.existsByEmployeeIdAndWorkDate(employee.getId(), targetDate)) {
                log.debug("Alert already sent today for employee: {} on {}", employee.getEmail(), targetDate);
                continue;
            }

            OffsetDateTime checkInAt = session.getCheckInAt();
            long totalElapsedMinutes = Duration.between(checkInAt, now).toMinutes();

            // 2. Calculate break minutes (both completed and ongoing)
            List<BreakSession> breaks = breakSessionRepository.findByAttendanceId(session.getId());
            long totalBreakMinutes = 0;
            long activeBreakMinutes = 0;

            for (BreakSession b : breaks) {
                if (b.getEndedAt() != null) {
                    totalBreakMinutes += Duration.between(b.getStartedAt(), b.getEndedAt()).toMinutes();
                } else {
                    long ongoing = Duration.between(b.getStartedAt(), now).toMinutes();
                    totalBreakMinutes += ongoing;
                    activeBreakMinutes += ongoing;
                }
            }

            // Net working time excluding breaks
            long netWorkMinutes = Math.max(0, totalElapsedMinutes - totalBreakMinutes);

            // Employee must be checked in for at least 2 hours (120 minutes) net work
            if (netWorkMinutes < 120) {
                continue;
            }

            // 3. Query spreadsheet activity pulses between check-in and now
            List<ActivityLog> logs = activityLogRepository.findByEmployeeIdAndLoggedAtBetweenOrderByLoggedAtAsc(
                    employee.getId(), checkInAt, now);

            long idleMinutes;
            String lastActiveString;

            if (logs.isEmpty()) {
                // Zero cell edits for entire shift
                idleMinutes = netWorkMinutes;
                lastActiveString = "None recorded today (0 cell edits)";
            } else {
                ActivityLog latestLog = logs.get(logs.size() - 1);
                long minutesSinceLastEdit = Duration.between(latestLog.getLoggedAt(), now).toMinutes();
                idleMinutes = Math.max(0, minutesSinceLastEdit - activeBreakMinutes);
                lastActiveString = String.format("%s on %s (%s)",
                        latestLog.getLoggedAt().format(timeFormatter),
                        latestLog.getWorkbookName(),
                        latestLog.getCellRange() != null ? latestLog.getCellRange() : "Sheet");
            }

            // 4. Threshold check: Continuous inactivity >= 120 minutes
            if (idleMinutes >= 120) {
                String managerEmail = "rahul.khanna@techviista.net";

                // Save to database (enforcing database-level single alert constraint per day)
                InactivityAlert alert = InactivityAlert.builder()
                        .employee(employee)
                        .workDate(targetDate)
                        .idleMinutes(idleMinutes)
                        .managerEmail(managerEmail)
                        .sentAt(now)
                        .build();

                inactivityAlertRepository.save(alert);

                // Publish Kafka Event
                InactivityAlertEvent alertEvent = new InactivityAlertEvent(
                        employee.getId(),
                        employee.getFullName(),
                        employee.getEmail(),
                        managerEmail,
                        targetDate,
                        idleMinutes,
                        lastActiveString,
                        now.toString()
                );

                if (kafkaTemplate != null) {
                    try {
                        kafkaTemplate.send("attendance-alerts", alertEvent);
                        log.info("Kafka alert event sent for employee {}: idle {} mins", employee.getEmail(), idleMinutes);
                    } catch (Exception e) {
                        log.warn("Kafka publish failed, falling back to direct email dispatch: {}", e.getMessage());
                        emailNotificationService.sendInactivityAlertEmail(alertEvent);
                    }
                } else {
                    emailNotificationService.sendInactivityAlertEmail(alertEvent);
                }

                alertsDispatched++;
            }
        }

        log.info("Inactivity scan completed: {} alerts dispatched to manager.", alertsDispatched);
        return alertsDispatched;
    }
}


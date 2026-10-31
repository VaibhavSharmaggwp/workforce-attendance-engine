package com.techviista.attendance.activity.service;

import com.techviista.attendance.activity.ActivityLog;
import com.techviista.attendance.activity.dto.EngagementSummaryDTO;
import com.techviista.attendance.activity.dto.SheetActivityRequest;
import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.repository.ActivityLogRepository;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final ActivityLogRepository activityLogRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;

    @Transactional
    public ActivityLog recordActivity(SheetActivityRequest request) {
        String email = request.getEmployeeEmail().trim();
        Employee employee = employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NoSuchElementException("Employee not found with email: " + email));

        if (!employee.isActive()) {
            throw new IllegalStateException("Cannot record activity for deactivated employee: " + email);
        }

        OffsetDateTime timestamp = request.getLoggedAt() != null ? request.getLoggedAt() : OffsetDateTime.now();

        ActivityLog logEntry = ActivityLog.builder()
                .employee(employee)
                .workbookName(request.getWorkbookName().trim())
                .sheetName(request.getSheetName() != null ? request.getSheetName().trim() : "Sheet1")
                .cellRange(request.getCellRange() != null ? request.getCellRange().trim() : null)
                .activityType(request.getActivityType() != null ? request.getActivityType().trim() : "CELL_EDIT")
                .details(request.getDetails())
                .loggedAt(timestamp)
                .build();

        ActivityLog saved = activityLogRepository.save(logEntry);
        log.info("Recorded sales sheet activity for employee {}: workbook={}, range={}, at={}",
                email, saved.getWorkbookName(), saved.getCellRange(), timestamp);
        return saved;
    }

    @Transactional(readOnly = true)
    public EngagementSummaryDTO getEmployeeDailyEngagement(UUID employeeId, LocalDate date) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException("Employee not found with ID: " + employeeId));

        Optional<Attendance> attendanceOpt = attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, date);

        if (attendanceOpt.isEmpty()) {
            return EngagementSummaryDTO.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getFullName())
                    .employeeEmail(employee.getEmail())
                    .workDate(date)
                    .totalShiftMinutes(0)
                    .activeSpreadsheetMinutes(0)
                    .engagementPercentage(0.0)
                    .totalEditsCount(0)
                    .verificationLevel("NOT_CHECKED_IN")
                    .isSuspicious(false)
                    .recentActivitySnippets(Collections.emptyList())
                    .build();
        }

        Attendance attendance = attendanceOpt.get();
        OffsetDateTime shiftStart = attendance.getCheckInAt();
        OffsetDateTime shiftEnd = attendance.getCheckOutAt() != null
                ? attendance.getCheckOutAt()
                : OffsetDateTime.now();

        long shiftMinutes = Math.max(1, Duration.between(shiftStart, shiftEnd).toMinutes());

        List<ActivityLog> logs = activityLogRepository.findByEmployeeIdAndLoggedAtBetweenOrderByLoggedAtAsc(
                employeeId, shiftStart, shiftEnd);

        // Group into 10-minute active buckets (each bucket with >= 1 edit counts as 10 active minutes)
        Set<Long> activeBucketIndices = new HashSet<>();
        for (ActivityLog activity : logs) {
            long minutesFromStart = Duration.between(shiftStart, activity.getLoggedAt()).toMinutes();
            if (minutesFromStart >= 0) {
                activeBucketIndices.add(minutesFromStart / 10);
            }
        }

        long activeMinutes = Math.min(shiftMinutes, activeBucketIndices.size() * 10L);
        double engagementPct = Math.min(100.0, Math.round(((double) activeMinutes / shiftMinutes) * 1000.0) / 10.0);

        String verificationLevel;
        if (logs.isEmpty()) {
            verificationLevel = "IDLE";
        } else if (engagementPct >= 70.0) {
            verificationLevel = "HIGH";
        } else if (engagementPct >= 40.0) {
            verificationLevel = "MODERATE";
        } else {
            verificationLevel = "LOW";
        }

        // Suspicious flag: checked in for > 90 mins with 0 edits
        boolean isSuspicious = shiftMinutes >= 90 && logs.isEmpty();

        OffsetDateTime lastActiveAt = logs.isEmpty() ? null : logs.get(logs.size() - 1).getLoggedAt();
        String activeWorkbook = logs.isEmpty() ? null : logs.get(logs.size() - 1).getWorkbookName();

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a");
        List<String> snippets = logs.stream()
                .skip(Math.max(0, logs.size() - 5))
                .map(l -> String.format("%s on %s%s at %s",
                        l.getActivityType(),
                        l.getWorkbookName(),
                        l.getCellRange() != null ? " (" + l.getCellRange() + ")" : "",
                        l.getLoggedAt().format(timeFmt)))
                .collect(Collectors.toList());
        Collections.reverse(snippets);

        return EngagementSummaryDTO.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .employeeEmail(employee.getEmail())
                .workDate(date)
                .totalShiftMinutes(shiftMinutes)
                .activeSpreadsheetMinutes(activeMinutes)
                .engagementPercentage(engagementPct)
                .totalEditsCount(logs.size())
                .lastActiveAt(lastActiveAt)
                .activeWorkbook(activeWorkbook)
                .verificationLevel(verificationLevel)
                .isSuspicious(isSuspicious)
                .recentActivitySnippets(snippets)
                .build();
    }

    @Transactional(readOnly = true)
    public List<EngagementSummaryDTO> getTeamEngagement(LocalDate date) {
        List<Employee> activeEmployees = employeeRepository.findByIsActiveTrue();
        return activeEmployees.stream()
                .map(emp -> getEmployeeDailyEngagement(emp.getId(), date))
                .collect(Collectors.toList());
    }
}


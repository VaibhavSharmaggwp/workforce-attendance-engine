package com.techviista.attendance.activity.dto;

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
public class EngagementSummaryDTO {
    private UUID employeeId;
    private String employeeName;
    private String employeeEmail;
    private LocalDate workDate;
    private long totalShiftMinutes;
    private long activeSpreadsheetMinutes;
    private double engagementPercentage;
    private long totalEditsCount;
    private OffsetDateTime lastActiveAt;
    private String activeWorkbook;
    private String verificationLevel; // HIGH, MODERATE, LOW, IDLE
    private boolean isSuspicious;
    private List<String> recentActivitySnippets;
}


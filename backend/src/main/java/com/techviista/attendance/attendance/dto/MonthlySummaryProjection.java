package com.techviista.attendance.attendance.dto;

public interface MonthlySummaryProjection {
    String getMonthYear(); // e.g., "2026-10"
    Integer getDaysRecorded();
    Integer getIncompleteDays();
    Long getNetWorkMinutes();
}

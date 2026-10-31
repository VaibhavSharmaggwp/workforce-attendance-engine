package com.techviista.attendance.analytics;

import java.time.LocalDate;
import java.util.List;

public record YearlyOverviewDTO(
        int totalDaysRecorded,
        int completeDays,
        int incompleteDays,
        String totalNetWorkHours,
        String averageNetPerDay,
        List<MonthlySummaryDTO> monthlySummaries,
        List<DailyActivityDTO> dailyActivities
) {
    public record MonthlySummaryDTO(
            String monthName,
            int recordedDays,
            int incompleteDays,
            String netWorkHours,
            String averagePerDay
    ) {}

    public record DailyActivityDTO(
            LocalDate date,
            int netWorkMinutes,
            int breakMinutes,
            String status
    ) {}
}

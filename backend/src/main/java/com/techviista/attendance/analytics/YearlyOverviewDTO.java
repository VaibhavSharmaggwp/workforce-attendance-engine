package com.techviista.attendance.analytics;

import java.util.List;

public record YearlyOverviewDTO(
        int totalDaysRecorded,
        int completeDays,
        int incompleteDays,
        String totalNetWorkHours,
        String averageNetPerDay,
        List<MonthlySummaryDTO> monthlySummaries
) {
    public record MonthlySummaryDTO(
            String monthName,
            int recordedDays,
            int incompleteDays,
            String netWorkHours,
            String averagePerDay
    ) {}
}

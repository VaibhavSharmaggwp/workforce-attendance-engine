package com.techviista.attendance.analytics;

import com.techviista.attendance.attendance.dto.MonthlySummaryProjection;
import com.techviista.attendance.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AttendanceRepository attendanceRepository;

    @Transactional(readOnly = true)
    public YearlyOverviewDTO getYearlyOverview(UUID employeeId, int year) {
        List<MonthlySummaryProjection> projections = attendanceRepository.getYearlyMonthlySummary(employeeId, year);

        int totalDays = 0;
        int incompleteDays = 0;
        long totalNetMinutes = 0;

        List<YearlyOverviewDTO.MonthlySummaryDTO> monthlySummaries = projections.stream().map(p -> {
            int days = p.getDaysRecorded() != null ? p.getDaysRecorded() : 0;
            int incDays = p.getIncompleteDays() != null ? p.getIncompleteDays() : 0;
            long netMinutes = p.getNetWorkMinutes() != null ? p.getNetWorkMinutes() : 0L;
            long avgMinutes = days > 0 ? (netMinutes / days) : 0L;

            return new YearlyOverviewDTO.MonthlySummaryDTO(
                    p.getMonthYear(),
                    days,
                    incDays,
                    formatHoursOnly(netMinutes),
                    formatHoursAndMinutes(avgMinutes)
            );
        }).toList();

        for (MonthlySummaryProjection p : projections) {
            totalDays += p.getDaysRecorded() != null ? p.getDaysRecorded() : 0;
            incompleteDays += p.getIncompleteDays() != null ? p.getIncompleteDays() : 0;
            totalNetMinutes += p.getNetWorkMinutes() != null ? p.getNetWorkMinutes() : 0L;
        }

        int completeDays = totalDays - incompleteDays;
        long overallAvgMinutes = totalDays > 0 ? (totalNetMinutes / totalDays) : 0;

        return new YearlyOverviewDTO(
                totalDays,
                completeDays,
                incompleteDays,
                formatHoursOnly(totalNetMinutes), // UI shows "1,148h"
                formatHoursAndMinutes(overallAvgMinutes), // UI shows "6h 10m"
                monthlySummaries
        );
    }

    private String formatHoursAndMinutes(long totalMinutes) {
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        return hours + "h " + (minutes < 10 ? "0" : "") + minutes + "m";
    }

    private String formatHoursOnly(long totalMinutes) {
        long hours = totalMinutes / 60;
        return String.format(Locale.US, "%,dh", hours);
    }
}

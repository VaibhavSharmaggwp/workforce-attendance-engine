package com.techviista.attendance.analytics;

import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.attendance.dto.MonthlySummaryProjection;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AttendanceRepository attendanceRepository;
    private final BreakSessionRepository breakSessionRepository;

    @Transactional(readOnly = true)
    public YearlyOverviewDTO getYearlyOverview(UUID employeeId, int year) {
        if (year < 2000 || year > 2100) {
            year = LocalDate.now().getYear();
        }

        List<MonthlySummaryProjection> projections = attendanceRepository.getYearlyMonthlySummary(employeeId, year);

        int totalDays = 0;
        int incompleteDays = 0;
        long totalNetMinutes = 0;

        List<YearlyOverviewDTO.MonthlySummaryDTO> monthlySummaries = (projections != null) ? projections.stream().map(p -> {
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
        }).toList() : Collections.emptyList();

        if (projections != null) {
            for (MonthlySummaryProjection p : projections) {
                totalDays += p.getDaysRecorded() != null ? p.getDaysRecorded() : 0;
                incompleteDays += p.getIncompleteDays() != null ? p.getIncompleteDays() : 0;
                totalNetMinutes += p.getNetWorkMinutes() != null ? p.getNetWorkMinutes() : 0L;
            }
        }

        int completeDays = Math.max(0, totalDays - incompleteDays);
        long overallAvgMinutes = totalDays > 0 ? (totalNetMinutes / totalDays) : 0;

        // Fetch daily activity records for the LeetCode-style activity matrix
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);
        List<Attendance> yearRecords = attendanceRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(employeeId, startDate, endDate);

        List<YearlyOverviewDTO.DailyActivityDTO> dailyActivities = new ArrayList<>();
        if (yearRecords != null) {
            for (Attendance att : yearRecords) {
                List<BreakSession> breaks = (breakSessionRepository != null && att.getId() != null)
                        ? breakSessionRepository.findByAttendanceId(att.getId())
                        : Collections.emptyList();

                long totalBreakMinutes = 0;
                for (BreakSession b : breaks) {
                    if (b.getEndedAt() != null && b.getStartedAt() != null) {
                        totalBreakMinutes += Duration.between(b.getStartedAt(), b.getEndedAt()).toMinutes();
                    }
                }

                OffsetDateTime end = (att.getCheckOutAt() != null) ? att.getCheckOutAt() : OffsetDateTime.now();
                long elapsed = (att.getCheckInAt() != null) ? Duration.between(att.getCheckInAt(), end).toMinutes() : 0;
                long netWorkMinutes = Math.max(0, elapsed - totalBreakMinutes);

                dailyActivities.add(new YearlyOverviewDTO.DailyActivityDTO(
                        att.getWorkDate(),
                        (int) netWorkMinutes,
                        (int) totalBreakMinutes,
                        att.getStatus() != null ? att.getStatus().name() : "COMPLETED"
                ));
            }
        }

        return new YearlyOverviewDTO(
                totalDays,
                completeDays,
                incompleteDays,
                formatHoursOnly(totalNetMinutes), // e.g. "1,148h"
                formatHoursAndMinutes(overallAvgMinutes), // e.g. "6h 10m"
                monthlySummaries,
                dailyActivities
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

package com.techviista.attendance.analytics;

import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.attendance.dto.MonthlySummaryProjection;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private BreakSessionRepository breakSessionRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private UUID employeeId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
    }

    @Test
    @DisplayName("getYearlyOverview - Successfully calculates summary and daily activities")
    void getYearlyOverview_Success() {
        int year = 2026;

        MonthlySummaryProjection projJan = mock(MonthlySummaryProjection.class);
        when(projJan.getMonthYear()).thenReturn("2026-01");
        when(projJan.getDaysRecorded()).thenReturn(20);
        when(projJan.getIncompleteDays()).thenReturn(1);
        when(projJan.getNetWorkMinutes()).thenReturn(9600L); // 160h

        when(attendanceRepository.getYearlyMonthlySummary(employeeId, year))
                .thenReturn(List.of(projJan));

        Attendance attendance1 = Attendance.builder()
                .id(UUID.randomUUID())
                .workDate(LocalDate.of(2026, 1, 15))
                .checkInAt(OffsetDateTime.now().minusHours(8))
                .checkOutAt(OffsetDateTime.now())
                .status(AttendanceStatus.COMPLETED)
                .build();

        BreakSession break1 = BreakSession.builder()
                .id(UUID.randomUUID())
                .startedAt(OffsetDateTime.now().minusHours(4))
                .endedAt(OffsetDateTime.now().minusHours(3)) // 60 mins
                .build();

        when(attendanceRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(eq(employeeId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(attendance1));

        when(breakSessionRepository.findByAttendanceId(attendance1.getId()))
                .thenReturn(List.of(break1));

        YearlyOverviewDTO overview = analyticsService.getYearlyOverview(employeeId, year);

        assertThat(overview).isNotNull();
        assertThat(overview.totalDaysRecorded()).isEqualTo(20);
        assertThat(overview.incompleteDays()).isEqualTo(1);
        assertThat(overview.completeDays()).isEqualTo(19);
        assertThat(overview.totalNetWorkHours()).isEqualTo("160h");
        assertThat(overview.monthlySummaries()).hasSize(1);
        assertThat(overview.dailyActivities()).hasSize(1);
        assertThat(overview.dailyActivities().get(0).breakMinutes()).isEqualTo(60);
    }

    @Test
    @DisplayName("getYearlyOverview - Handles empty records gracefully without crashing")
    void getYearlyOverview_EmptyRecords() {
        when(attendanceRepository.getYearlyMonthlySummary(employeeId, 2026))
                .thenReturn(Collections.emptyList());
        when(attendanceRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(eq(employeeId), any(), any()))
                .thenReturn(Collections.emptyList());

        YearlyOverviewDTO overview = analyticsService.getYearlyOverview(employeeId, 2026);

        assertThat(overview).isNotNull();
        assertThat(overview.totalDaysRecorded()).isEqualTo(0);
        assertThat(overview.completeDays()).isEqualTo(0);
        assertThat(overview.incompleteDays()).isEqualTo(0);
        assertThat(overview.totalNetWorkHours()).isEqualTo("0h");
        assertThat(overview.averageNetPerDay()).isEqualTo("0h 00m");
        assertThat(overview.monthlySummaries()).isEmpty();
        assertThat(overview.dailyActivities()).isEmpty();
    }

    @Test
    @DisplayName("getYearlyOverview - Handles out-of-bounds year by falling back to current year")
    void getYearlyOverview_OutOfBoundsYear() {
        when(attendanceRepository.getYearlyMonthlySummary(eq(employeeId), any(Integer.class)))
                .thenReturn(Collections.emptyList());
        when(attendanceRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(eq(employeeId), any(), any()))
                .thenReturn(Collections.emptyList());

        YearlyOverviewDTO overview = analyticsService.getYearlyOverview(employeeId, -1);
        assertThat(overview).isNotNull();
    }
}

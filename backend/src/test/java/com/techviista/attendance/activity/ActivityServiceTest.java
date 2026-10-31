package com.techviista.attendance.activity;

import com.techviista.attendance.activity.dto.EngagementSummaryDTO;
import com.techviista.attendance.activity.dto.SheetActivityRequest;
import com.techviista.attendance.activity.service.ActivityService;
import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import com.techviista.attendance.repository.ActivityLogRepository;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @InjectMocks
    private ActivityService activityService;

    private Employee employee;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        employee = Employee.builder()
                .id(employeeId)
                .fullName("Ananya Sharma")
                .email("ananya.sharma@techviista.com")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("recordActivity successfully logs cell edit when employee is active")
    void recordActivity_Success() {
        when(employeeRepository.findByEmailIgnoreCase("ananya.sharma@techviista.com"))
                .thenReturn(Optional.of(employee));
        when(activityLogRepository.save(any(ActivityLog.class)))
                .thenAnswer(invocation -> {
                    ActivityLog log = invocation.getArgument(0);
                    log.setId(UUID.randomUUID());
                    return log;
                });

        SheetActivityRequest request = SheetActivityRequest.builder()
                .employeeEmail("ananya.sharma@techviista.com")
                .workbookName("Q4_Sales_Pipeline.xlsx")
                .sheetName("Leads")
                .cellRange("B14:D14")
                .activityType("CELL_EDIT")
                .details("Updated status to Closed-Won")
                .build();

        ActivityLog saved = activityService.recordActivity(request);

        assertThat(saved).isNotNull();
        assertThat(saved.getWorkbookName()).isEqualTo("Q4_Sales_Pipeline.xlsx");
        assertThat(saved.getCellRange()).isEqualTo("B14:D14");
        assertThat(saved.getEmployee().getId()).isEqualTo(employeeId);
        verify(activityLogRepository, times(1)).save(any(ActivityLog.class));
    }

    @Test
    @DisplayName("recordActivity throws NoSuchElementException if employee email is not recognized")
    void recordActivity_EmployeeNotFound() {
        when(employeeRepository.findByEmailIgnoreCase("unknown@techviista.com"))
                .thenReturn(Optional.empty());

        SheetActivityRequest request = SheetActivityRequest.builder()
                .employeeEmail("unknown@techviista.com")
                .workbookName("Test.xlsx")
                .build();

        assertThatThrownBy(() -> activityService.recordActivity(request))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("Employee not found with email");

        verify(activityLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("recordActivity throws IllegalStateException if employee account is deactivated")
    void recordActivity_DeactivatedEmployee() {
        employee.setActive(false);
        when(employeeRepository.findByEmailIgnoreCase("ananya.sharma@techviista.com"))
                .thenReturn(Optional.of(employee));

        SheetActivityRequest request = SheetActivityRequest.builder()
                .employeeEmail("ananya.sharma@techviista.com")
                .workbookName("Test.xlsx")
                .build();

        assertThatThrownBy(() -> activityService.recordActivity(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot record activity for deactivated employee");

        verify(activityLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("getEmployeeDailyEngagement computes active buckets, engagement percentage, and level")
    void getEmployeeDailyEngagement_ActiveCalculations() {
        LocalDate today = LocalDate.now();
        OffsetDateTime checkIn = OffsetDateTime.now().minusHours(4); // 4 hours = 240 mins
        OffsetDateTime checkOut = OffsetDateTime.now();

        Attendance attendance = Attendance.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .workDate(today)
                .checkInAt(checkIn)
                .checkOutAt(checkOut)
                .status(AttendanceStatus.COMPLETED)
                .build();

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, today)).thenReturn(Optional.of(attendance));

        // Create 12 edits in 12 distinct 10-minute buckets = 120 active minutes (50% of 240 min shift)
        List<ActivityLog> logs = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            logs.add(ActivityLog.builder()
                    .id(UUID.randomUUID())
                    .employee(employee)
                    .workbookName("Leads.xlsx")
                    .loggedAt(checkIn.plusMinutes(i * 15)) // every 15 mins
                    .activityType("CELL_EDIT")
                    .build());
        }

        when(activityLogRepository.findByEmployeeIdAndLoggedAtBetweenOrderByLoggedAtAsc(eq(employeeId), any(), any()))
                .thenReturn(logs);

        EngagementSummaryDTO summary = activityService.getEmployeeDailyEngagement(employeeId, today);

        assertThat(summary).isNotNull();
        assertThat(summary.getTotalShiftMinutes()).isEqualTo(240);
        assertThat(summary.getActiveSpreadsheetMinutes()).isEqualTo(120);
        assertThat(summary.getEngagementPercentage()).isEqualTo(50.0);
        assertThat(summary.getVerificationLevel()).isEqualTo("MODERATE");
        assertThat(summary.isSuspicious()).isFalse();
        assertThat(summary.getTotalEditsCount()).isEqualTo(12);
    }

    @Test
    @DisplayName("getEmployeeDailyEngagement flags isSuspicious when shift is long but zero edits")
    void getEmployeeDailyEngagement_SuspiciousIdle() {
        LocalDate today = LocalDate.now();
        OffsetDateTime checkIn = OffsetDateTime.now().minusHours(3); // 180 mins (> 90 mins threshold)

        Attendance attendance = Attendance.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .workDate(today)
                .checkInAt(checkIn)
                .status(AttendanceStatus.WORKING)
                .build();

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, today)).thenReturn(Optional.of(attendance));
        when(activityLogRepository.findByEmployeeIdAndLoggedAtBetweenOrderByLoggedAtAsc(eq(employeeId), any(), any()))
                .thenReturn(Collections.emptyList());

        EngagementSummaryDTO summary = activityService.getEmployeeDailyEngagement(employeeId, today);

        assertThat(summary).isNotNull();
        assertThat(summary.getActiveSpreadsheetMinutes()).isEqualTo(0);
        assertThat(summary.getEngagementPercentage()).isEqualTo(0.0);
        assertThat(summary.getVerificationLevel()).isEqualTo("IDLE");
        assertThat(summary.isSuspicious()).isTrue();
    }
}

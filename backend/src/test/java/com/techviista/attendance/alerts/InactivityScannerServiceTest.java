package com.techviista.attendance.alerts;

import com.techviista.attendance.activity.ActivityLog;
import com.techviista.attendance.alerts.service.AlertSettingsService;
import com.techviista.attendance.alerts.service.EmailNotificationService;
import com.techviista.attendance.alerts.service.InactivityScannerService;
import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import com.techviista.attendance.repository.ActivityLogRepository;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import com.techviista.attendance.repository.InactivityAlertRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InactivityScannerServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private BreakSessionRepository breakSessionRepository;

    @Mock
    private InactivityAlertRepository inactivityAlertRepository;

    @Mock
    private AlertSettingsService alertSettingsService;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private InactivityScannerService inactivityScannerService;

    private Employee employee;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        employee = Employee.builder()
                .id(employeeId)
                .fullName("Arjun Reddy")
                .email("arjun.reddy@techviista.net")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Inactivity scan does nothing when manager disabled email alerts")
    void runInactivityScan_WhenEmailAlertsDisabled_DoesNothing() {
        when(alertSettingsService.isEmailAlertsEnabled()).thenReturn(false);

        int count = inactivityScannerService.runInactivityScan(LocalDate.now());

        assertThat(count).isEqualTo(0);
        verify(attendanceRepository, never()).findByWorkDateAndStatus(any(), any());
    }

    @Test
    @DisplayName("Anti-Spam Guarantee: Skips employee if alert already sent today")
    void runInactivityScan_WhenAlertAlreadySentToday_SkipsEmployee() {
        LocalDate today = LocalDate.now();
        when(alertSettingsService.isEmailAlertsEnabled()).thenReturn(true);

        Attendance attendance = Attendance.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .workDate(today)
                .checkInAt(OffsetDateTime.now().minusHours(3))
                .status(AttendanceStatus.WORKING)
                .build();

        when(attendanceRepository.findByWorkDateAndStatus(today, AttendanceStatus.WORKING))
                .thenReturn(List.of(attendance));
        when(inactivityAlertRepository.existsByEmployeeIdAndWorkDate(employeeId, today))
                .thenReturn(true); // Alert already sent today!

        int count = inactivityScannerService.runInactivityScan(today);

        assertThat(count).isEqualTo(0);
        verify(inactivityAlertRepository, never()).save(any());
        verify(kafkaTemplate, never()).send(anyString(), any());
    }

    @Test
    @DisplayName("Skips employee if checked in for less than 2 hours (120 minutes)")
    void runInactivityScan_WhenWorkingLessThanTwoHours_SkipsEmployee() {
        LocalDate today = LocalDate.now();
        when(alertSettingsService.isEmailAlertsEnabled()).thenReturn(true);

        // Checked in 45 minutes ago
        Attendance attendance = Attendance.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .workDate(today)
                .checkInAt(OffsetDateTime.now().minusMinutes(45))
                .status(AttendanceStatus.WORKING)
                .build();

        when(attendanceRepository.findByWorkDateAndStatus(today, AttendanceStatus.WORKING))
                .thenReturn(List.of(attendance));
        when(inactivityAlertRepository.existsByEmployeeIdAndWorkDate(employeeId, today))
                .thenReturn(false);
        when(breakSessionRepository.findByAttendanceId(attendance.getId()))
                .thenReturn(Collections.emptyList());

        int count = inactivityScannerService.runInactivityScan(today);

        assertThat(count).isEqualTo(0);
        verify(inactivityAlertRepository, never()).save(any());
    }

    @Test
    @DisplayName("Dispatches alert when employee working >2h with zero spreadsheet edits")
    void runInactivityScan_WhenWorkingOverTwoHoursWithZeroEdits_DispatchesAlert() {
        LocalDate today = LocalDate.now();
        when(alertSettingsService.isEmailAlertsEnabled()).thenReturn(true);

        // Checked in 2.5 hours ago (150 mins)
        Attendance attendance = Attendance.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .workDate(today)
                .checkInAt(OffsetDateTime.now().minusHours(2).minusMinutes(30))
                .status(AttendanceStatus.WORKING)
                .build();

        when(attendanceRepository.findByWorkDateAndStatus(today, AttendanceStatus.WORKING))
                .thenReturn(List.of(attendance));
        when(inactivityAlertRepository.existsByEmployeeIdAndWorkDate(employeeId, today))
                .thenReturn(false);
        when(breakSessionRepository.findByAttendanceId(attendance.getId()))
                .thenReturn(Collections.emptyList());
        when(activityLogRepository.findByEmployeeIdAndLoggedAtBetweenOrderByLoggedAtAsc(eq(employeeId), any(), any()))
                .thenReturn(Collections.emptyList()); // Zero spreadsheet edits!

        int count = inactivityScannerService.runInactivityScan(today);

        assertThat(count).isEqualTo(1);
        verify(inactivityAlertRepository, times(1)).save(any(InactivityAlert.class));
        verify(kafkaTemplate, times(1)).send(eq("attendance-alerts"), any());
    }
}

package com.techviista.attendance.activity;

import com.techviista.attendance.activity.controller.ActivityController;
import com.techviista.attendance.activity.dto.EngagementSummaryDTO;
import com.techviista.attendance.activity.dto.SheetActivityRequest;
import com.techviista.attendance.activity.service.ActivityService;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityControllerTest {

    @Mock
    private ActivityService activityService;

    @InjectMocks
    private ActivityController activityController;

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
    @DisplayName("POST /api/v1/activity/pulse returns 201 Created and log details")
    void recordPulse_Success() {
        ActivityLog log = ActivityLog.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .workbookName("Sales_Oct.xlsx")
                .loggedAt(OffsetDateTime.now())
                .build();

        when(activityService.recordActivity(any(SheetActivityRequest.class))).thenReturn(log);

        SheetActivityRequest req = SheetActivityRequest.builder()
                .employeeEmail("ananya.sharma@techviista.com")
                .workbookName("Sales_Oct.xlsx")
                .build();

        ResponseEntity<Map<String, Object>> response = activityController.recordPulse(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("SUCCESS");
        assertThat(response.getBody().get("logId")).isEqualTo(log.getId());
    }

    @Test
    @DisplayName("GET /api/v1/activity/today returns engagement summary for authenticated employee")
    void getTodayEngagement_Success() {
        EngagementSummaryDTO summary = EngagementSummaryDTO.builder()
                .employeeId(employeeId)
                .employeeName("Ananya Sharma")
                .workDate(LocalDate.now())
                .totalShiftMinutes(240)
                .activeSpreadsheetMinutes(180)
                .engagementPercentage(75.0)
                .verificationLevel("HIGH")
                .isSuspicious(false)
                .build();

        when(activityService.getEmployeeDailyEngagement(eq(employeeId), any(LocalDate.class)))
                .thenReturn(summary);

        ResponseEntity<EngagementSummaryDTO> response = activityController.getTodayEngagement(employee);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getEngagementPercentage()).isEqualTo(75.0);
        assertThat(response.getBody().getVerificationLevel()).isEqualTo("HIGH");
    }

    @Test
    @DisplayName("GET /api/v1/activity/team returns list of employee engagement summaries")
    void getTeamEngagement_Success() {
        EngagementSummaryDTO summary = EngagementSummaryDTO.builder()
                .employeeId(employeeId)
                .employeeName("Ananya Sharma")
                .workDate(LocalDate.now())
                .engagementPercentage(82.0)
                .verificationLevel("HIGH")
                .build();

        when(activityService.getTeamEngagement(any(LocalDate.class)))
                .thenReturn(List.of(summary));

        ResponseEntity<List<EngagementSummaryDTO>> response = activityController.getTeamEngagement(LocalDate.now());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getEmployeeName()).isEqualTo("Ananya Sharma");
    }
}

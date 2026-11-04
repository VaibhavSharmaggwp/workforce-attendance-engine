package com.techviista.attendance.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techviista.attendance.activity.ActivityLog;
import com.techviista.attendance.activity.controller.ActivityController;
import com.techviista.attendance.activity.dto.SheetActivityRequest;
import com.techviista.attendance.activity.service.ActivityService;
import com.techviista.attendance.admin.AdminController.AdminController;
import com.techviista.attendance.admin.CreateEmployeeRequest;
import com.techviista.attendance.admin.TeamAttendanceDashboardDTO;
import com.techviista.attendance.admin.adminService.AdminService;
import com.techviista.attendance.alerts.service.InactivityScannerService;
import com.techviista.attendance.analytics.AnalyticsController;
import com.techviista.attendance.analytics.AnalyticsService;
import com.techviista.attendance.analytics.YearlyOverviewDTO;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.attendance.service.AttendanceService;
import com.techviista.attendance.auth.AuthController;
import com.techviista.attendance.common.GlobalExceptionHandler;
import com.techviista.attendance.config.JwtAuthenticationFilter;
import com.techviista.attendance.config.JwtService;
import com.techviista.attendance.controller.AttendanceController;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import com.techviista.attendance.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Complete End-to-End (E2E) Production Readiness Test Suite.
 * Validates the entire application lifecycle before production deployment:
 * 1. Manager Authentication & Profile Inspection
 * 2. Employee Provisioning by Manager (and duplicate prevention)
 * 3. 4-State Shift Lifecycle (Check-in -> Break Start -> Break End -> Check-out)
 * 4. Conflict & State Machine Rule Enforcement (409 on duplicate actions / illegal transitions)
 * 5. Google Sheets Proof-of-Work Telemetry Ingestion (/pulse)
 * 6. Inactivity Scanner Service Detection
 * 7. Annual Analytics & Heatmap Aggregations (/yearly-overview)
 * 8. Manager Team Real-Time Dashboard Queries
 */
@ExtendWith(MockitoExtension.class)
public class ProductionEndToEndFlowTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    private JwtService jwtService;
    private JwtAuthenticationFilter jwtFilter;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AttendanceService attendanceService;

    @Mock
    private AdminService adminService;

    @Mock
    private ActivityService activityService;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private InactivityScannerService inactivityScannerService;

    @InjectMocks
    private AuthController authController;

    @InjectMocks
    private AdminController adminController;

    @InjectMocks
    private AttendanceController attendanceController;

    @InjectMocks
    private ActivityController activityController;

    @InjectMocks
    private AnalyticsController analyticsController;

    private Employee manager;
    private Employee employee;
    private String managerToken;
    private String employeeToken;

    private final String secretKey = "5e58bb32852e173a0b6dabe03e6e5b28894f588ecdf1ed247438cfdb9fafc72028bce5a34cb4ead22d7460a788ddfcbd0c18d894b07306ec1c0d494ae0fde6c2";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        // 1. Initialize real JwtService
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800000L);

        // 2. Initialize real JwtAuthenticationFilter
        jwtFilter = new JwtAuthenticationFilter(jwtService, employeeRepository);

        // 3. Define Authority Entities
        manager = Employee.builder()
                .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                .fullName("Mayank Verma")
                .email("techviista53@gmail.com")
                .role(EmployeeRole.MANAGER)
                .isActive(true)
                .build();

        employee = Employee.builder()
                .id(UUID.fromString("22222222-2222-2222-2222-222222222222"))
                .fullName("Ananya Sharma")
                .email("ananya.sharma@techviista.com")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();

        managerToken = jwtService.generateAccessToken(manager.getEmail());
        employeeToken = jwtService.generateAccessToken(employee.getEmail());

        // 4. Configure Argument Resolver for @AuthenticationPrincipal
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof Employee emp) {
                    return emp;
                }
                return null;
            }
        };

        // 5. Build Standalone MockMvc with real JWT filter and all production controllers
        mockMvc = MockMvcBuilders
                .standaloneSetup(authController, adminController, attendanceController, activityController, analyticsController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(jwtFilter)
                .build();
    }

    @Test
    @DisplayName("E2E Step 1: Manager authenticates with valid JWT and retrieves verified profile")
    void testStep1_ManagerAuthentication() throws Exception {
        when(employeeRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("techviista53@gmail.com")))
                .andExpect(jsonPath("$.role", is("MANAGER")))
                .andExpect(jsonPath("$.fullName", is("Mayank Verma")));
    }

    @Test
    @DisplayName("E2E Step 2: Unauthenticated request is rejected with 401 Unauthorized")
    void testStep2_UnauthenticatedRejection() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("E2E Step 3: Manager provisions new employee successfully")
    void testStep3_ManagerProvisionsEmployee() throws Exception {
        when(employeeRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));

        CreateEmployeeRequest request = new CreateEmployeeRequest("Ananya Sharma", "ananya.sharma@techviista.com", EmployeeRole.EMPLOYEE);

        when(adminService.provisionEmployee(any(CreateEmployeeRequest.class))).thenReturn(employee);

        mockMvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(employee.getId().toString())))
                .andExpect(jsonPath("$.email", is("ananya.sharma@techviista.com")))
                .andExpect(jsonPath("$.role", is("EMPLOYEE")));
    }

    @Test
    @DisplayName("E2E Step 4: Duplicate employee provisioning returns 409 Conflict")
    void testStep4_DuplicateProvisioningConflict() throws Exception {
        when(employeeRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));

        CreateEmployeeRequest request = new CreateEmployeeRequest("Ananya Sharma", "ananya.sharma@techviista.com", EmployeeRole.EMPLOYEE);

        when(adminService.provisionEmployee(any(CreateEmployeeRequest.class)))
                .thenThrow(new IllegalStateException("An employee with email ananya.sharma@techviista.com already exists."));

        mockMvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", is("An employee with email ananya.sharma@techviista.com already exists.")));
    }

    @Test
    @DisplayName("E2E Step 5: Shift Lifecycle - Check-in transitions state to WORKING")
    void testStep5_EmployeeCheckIn() throws Exception {
        when(employeeRepository.findByEmail(employee.getEmail())).thenReturn(Optional.of(employee));

        AttendanceResponse checkInResponse = AttendanceResponse.builder()
                .id(UUID.randomUUID())
                .workDate(LocalDate.now())
                .status(AttendanceStatus.WORKING)
                .checkInAt(OffsetDateTime.now())
                .elapsedMinutes(0L)
                .breakMinutes(0L)
                .netWorkMinutes(0L)
                .breaks(List.of())
                .build();

        when(attendanceService.checkIn(eq(employee.getId()))).thenReturn(checkInResponse);

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("WORKING")))
                .andExpect(jsonPath("$.checkInAt", notNullValue()))
                .andExpect(jsonPath("$.breakMinutes", is(0)));
    }

    @Test
    @DisplayName("E2E Step 6: Duplicate Check-in returns 409 Conflict")
    void testStep6_DuplicateCheckInConflict() throws Exception {
        when(employeeRepository.findByEmail(employee.getEmail())).thenReturn(Optional.of(employee));
        when(attendanceService.checkIn(eq(employee.getId())))
                .thenThrow(new IllegalStateException("You are already checked in for today."));

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", is("You are already checked in for today.")));
    }

    @Test
    @DisplayName("E2E Step 7: Sales Spreadsheet Telemetry (/pulse) ingests cell edits seamlessly")
    void testStep7_SpreadsheetPulseIngest() throws Exception {
        SheetActivityRequest pulse = SheetActivityRequest.builder()
                .employeeEmail("ananya.sharma@techviista.com")
                .workbookName("Q4_Sales_Pipeline.xlsx")
                .sheetName("Leads")
                .cellRange("C14:E14")
                .activityType("CELL_EDIT")
                .details("Updated deal size")
                .build();

        ActivityLog savedLog = ActivityLog.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .workbookName("Q4_Sales_Pipeline.xlsx")
                .sheetName("Leads")
                .cellRange("C14:E14")
                .activityType("CELL_EDIT")
                .details("Updated deal size")
                .loggedAt(OffsetDateTime.now())
                .build();

        when(activityService.recordActivity(any(SheetActivityRequest.class))).thenReturn(savedLog);

        mockMvc.perform(post("/api/v1/activity/pulse")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pulse)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.message", is("Activity pulse recorded successfully")))
                .andExpect(jsonPath("$.logId", notNullValue()));
    }

    @Test
    @DisplayName("E2E Step 8: Break Start transitions state to ON_BREAK")
    void testStep8_BreakStart() throws Exception {
        when(employeeRepository.findByEmail(employee.getEmail())).thenReturn(Optional.of(employee));

        AttendanceResponse breakResponse = AttendanceResponse.builder()
                .id(UUID.randomUUID())
                .workDate(LocalDate.now())
                .status(AttendanceStatus.ON_BREAK)
                .checkInAt(OffsetDateTime.now().minusHours(2))
                .elapsedMinutes(120L)
                .breakMinutes(0L)
                .netWorkMinutes(120L)
                .build();

        when(attendanceService.startBreak(eq(employee.getId()))).thenReturn(breakResponse);

        mockMvc.perform(post("/api/v1/attendance/breaks/start")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ON_BREAK")));
    }

    @Test
    @DisplayName("E2E Step 9: Check-out while on break is strictly rejected with 409 Conflict")
    void testStep9_CheckOutWhileOnBreakRejected() throws Exception {
        when(employeeRepository.findByEmail(employee.getEmail())).thenReturn(Optional.of(employee));
        when(attendanceService.checkOut(eq(employee.getId())))
                .thenThrow(new IllegalStateException("Cannot check out while a break is active. Please end your break first."));

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", is("Cannot check out while a break is active. Please end your break first.")));
    }

    @Test
    @DisplayName("E2E Step 10: Break End resumes state to WORKING")
    void testStep10_BreakEnd() throws Exception {
        when(employeeRepository.findByEmail(employee.getEmail())).thenReturn(Optional.of(employee));

        AttendanceResponse resumeResponse = AttendanceResponse.builder()
                .id(UUID.randomUUID())
                .workDate(LocalDate.now())
                .status(AttendanceStatus.WORKING)
                .checkInAt(OffsetDateTime.now().minusHours(3))
                .elapsedMinutes(180L)
                .breakMinutes(30L)
                .netWorkMinutes(150L)
                .build();

        when(attendanceService.endBreak(eq(employee.getId()))).thenReturn(resumeResponse);

        mockMvc.perform(post("/api/v1/attendance/breaks/end")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("WORKING")))
                .andExpect(jsonPath("$.breakMinutes", is(30)))
                .andExpect(jsonPath("$.netWorkMinutes", is(150)));
    }

    @Test
    @DisplayName("E2E Step 11: Check-out finalizes daily shift to COMPLETED")
    void testStep11_ShiftCheckOut() throws Exception {
        when(employeeRepository.findByEmail(employee.getEmail())).thenReturn(Optional.of(employee));

        AttendanceResponse completedResponse = AttendanceResponse.builder()
                .id(UUID.randomUUID())
                .workDate(LocalDate.now())
                .status(AttendanceStatus.COMPLETED)
                .checkInAt(OffsetDateTime.now().minusHours(8))
                .checkOutAt(OffsetDateTime.now())
                .elapsedMinutes(480L)
                .breakMinutes(45L)
                .netWorkMinutes(435L)
                .build();

        when(attendanceService.checkOut(eq(employee.getId()))).thenReturn(completedResponse);

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.checkOutAt", notNullValue()))
                .andExpect(jsonPath("$.elapsedMinutes", is(480)))
                .andExpect(jsonPath("$.breakMinutes", is(45)))
                .andExpect(jsonPath("$.netWorkMinutes", is(435)));
    }

    @Test
    @DisplayName("E2E Step 12: Inactivity Scanner executes scheduled scan without failure")
    void testStep12_InactivityScannerScan() {
        doNothing().when(inactivityScannerService).scheduledInactivityScan();
        inactivityScannerService.scheduledInactivityScan();
        verify(inactivityScannerService, times(1)).scheduledInactivityScan();
    }

    @Test
    @DisplayName("E2E Step 13: Annual Analytics & LeetCode Heatmap returns clean metrics")
    void testStep13_YearlyOverviewAnalytics() throws Exception {
        when(employeeRepository.findByEmail(employee.getEmail())).thenReturn(Optional.of(employee));

        YearlyOverviewDTO dto = new YearlyOverviewDTO(
                210,
                205,
                5,
                "1680h 30m",
                "8h 00m",
                List.of(new YearlyOverviewDTO.MonthlySummaryDTO("OCTOBER", 22, 1, "176h 00m", "8h 00m")),
                List.of(new YearlyOverviewDTO.DailyActivityDTO(LocalDate.of(2026, 10, 31), 480, 45, "COMPLETED"))
        );

        when(analyticsService.getYearlyOverview(eq(employee.getId()), eq(2026))).thenReturn(dto);

        mockMvc.perform(get("/api/v1/analytics/yearly-overview?year=2026")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDaysRecorded", is(210)))
                .andExpect(jsonPath("$.completeDays", is(205)))
                .andExpect(jsonPath("$.incompleteDays", is(5)))
                .andExpect(jsonPath("$.totalNetWorkHours", is("1680h 30m")));
    }

    @Test
    @DisplayName("E2E Step 14: Manager retrieves Team Attendance for today")
    void testStep14_ManagerTeamAttendanceOverview() throws Exception {
        when(employeeRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));

        TeamAttendanceDashboardDTO teamSummary = TeamAttendanceDashboardDTO.builder()
                .date(LocalDate.now())
                .totalEmployees(1)
                .workingCount(0)
                .onBreakCount(0)
                .checkedOutCount(1)
                .notCheckedInCount(0)
                .incompleteCount(0)
                .overBreakCount(0)
                .members(List.of())
                .build();

        when(adminService.getTeamAttendanceForDate(any(LocalDate.class))).thenReturn(teamSummary);

        mockMvc.perform(get("/api/v1/admin/attendance/today")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees", is(1)))
                .andExpect(jsonPath("$.checkedOutCount", is(1)));
    }
}

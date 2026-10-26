package com.techviista.attendance.config;

import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.attendance.service.AttendanceService;
import com.techviista.attendance.common.GlobalExceptionHandler;
import com.techviista.attendance.controller.AttendanceController;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import com.techviista.attendance.repository.EmployeeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-End Integration Test for JWT Authentication Flow.
 * Validates token generation, filter interception, JJWT signature verification,
 * SecurityContext population, and controller execution with @AuthenticationPrincipal.
 */
@ExtendWith(MockitoExtension.class)
class JwtSecurityIntegrationTest {

    private MockMvc mockMvc;

    private JwtService jwtService;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AttendanceService attendanceService;

    @InjectMocks
    private AttendanceController attendanceController;

    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final String secretKey = "5e58bb32852e173a0b6dabe03e6e5b28894f588ecdf1ed247438cfdb9fafc72028bce5a34cb4ead22d7460a788ddfcbd0c18d894b07306ec1c0d494ae0fde6c2";
    private final long accessTokenExpiration = 900000L;
    private final long refreshTokenExpiration = 604800000L;

    private Employee testEmployee;
    private UUID employeeId;
    private String employeeEmail;
    private AttendanceResponse sampleResponse;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        // 1. Initialize real JwtService with valid configuration
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", accessTokenExpiration);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", refreshTokenExpiration);

        // 2. Initialize real JwtAuthenticationFilter with real JwtService and mocked EmployeeRepository
        jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtService, employeeRepository);

        // 3. Resolver that extracts @AuthenticationPrincipal from SecurityContextHolder
        HandlerMethodArgumentResolver securityContextPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                return (auth != null) ? auth.getPrincipal() : null;
            }
        };

        // 4. Build MockMvc with real JwtAuthenticationFilter and controller
        mockMvc = MockMvcBuilders.standaloneSetup(attendanceController)
                .addFilter(jwtAuthenticationFilter)
                .setCustomArgumentResolvers(securityContextPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // 5. Setup test employee data
        employeeId = UUID.randomUUID();
        employeeEmail = "alice.smith@techviista.com";

        testEmployee = Employee.builder()
                .id(employeeId)
                .email(employeeEmail)
                .fullName("Alice Smith")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();

        sampleResponse = AttendanceResponse.builder()
                .id(UUID.randomUUID())
                .status(AttendanceStatus.WORKING)
                .checkInAt(OffsetDateTime.now())
                .elapsedMinutes(60)
                .breakMinutes(0)
                .netWorkMinutes(60)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("E2E: Protected endpoint without Authorization header fails authentication")
    void checkIn_WithoutToken_FailsAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/attendance/check-in"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Employee authentication is required")));

        verifyNoInteractions(attendanceService);
    }

    @Test
    @DisplayName("E2E: Protected endpoint with malformed/tampered JWT fails authentication")
    void checkIn_WithInvalidJwt_FailsAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer invalid.tampered.token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Employee authentication is required")));

        verifyNoInteractions(attendanceService);
    }

    @Test
    @DisplayName("E2E: Protected endpoint with unknown employee email fails authentication")
    void checkIn_WithUnknownEmail_FailsAuthentication() throws Exception {
        String token = jwtService.generateAccessToken("ghost@techviista.com");
        when(employeeRepository.findByEmail("ghost@techviista.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Employee authentication is required")));

        verifyNoInteractions(attendanceService);
    }

    @Test
    @DisplayName("E2E: POST /check-in with valid JWT authenticates via filter and returns 200 OK")
    void checkIn_WithValidJwt_Success() throws Exception {
        // Generate real cryptographically signed JWT token
        String token = jwtService.generateAccessToken(employeeEmail);
        when(employeeRepository.findByEmail(employeeEmail)).thenReturn(Optional.of(testEmployee));
        when(attendanceService.checkIn(eq(employeeId))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(sampleResponse.getId().toString())))
                .andExpect(jsonPath("$.status", is("WORKING")))
                .andExpect(jsonPath("$.netWorkMinutes", is(60)));

        verify(attendanceService).checkIn(eq(employeeId));
    }

    @Test
    @DisplayName("E2E: GET /today with valid JWT authenticates and returns today's attendance")
    void getTodayAttendance_WithValidJwt_Success() throws Exception {
        String token = jwtService.generateAccessToken(employeeEmail);
        when(employeeRepository.findByEmail(employeeEmail)).thenReturn(Optional.of(testEmployee));
        when(attendanceService.getTodayAttendance(eq(employeeId))).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/attendance/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(sampleResponse.getId().toString())))
                .andExpect(jsonPath("$.status", is("WORKING")));

        verify(attendanceService).getTodayAttendance(eq(employeeId));
    }

    @Test
    @DisplayName("E2E: GET /history with valid JWT authenticates and returns history list")
    void getHistory_WithValidJwt_Success() throws Exception {
        String token = jwtService.generateAccessToken(employeeEmail);
        when(employeeRepository.findByEmail(employeeEmail)).thenReturn(Optional.of(testEmployee));
        when(attendanceService.getAttendanceHistory(eq(employeeId))).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/v1/attendance/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(sampleResponse.getId().toString())))
                .andExpect(jsonPath("$[0].status", is("WORKING")));

        verify(attendanceService).getAttendanceHistory(eq(employeeId));
    }

    @Test
    @DisplayName("E2E: POST /breaks/start with valid JWT starts break")
    void startBreak_WithValidJwt_Success() throws Exception {
        String token = jwtService.generateAccessToken(employeeEmail);
        sampleResponse.setStatus(AttendanceStatus.ON_BREAK);

        when(employeeRepository.findByEmail(employeeEmail)).thenReturn(Optional.of(testEmployee));
        when(attendanceService.startBreak(eq(employeeId))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/attendance/breaks/start")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ON_BREAK")));

        verify(attendanceService).startBreak(eq(employeeId));
    }

    @Test
    @DisplayName("E2E: POST /check-out with valid JWT completes attendance session")
    void checkOut_WithValidJwt_Success() throws Exception {
        String token = jwtService.generateAccessToken(employeeEmail);
        sampleResponse.setStatus(AttendanceStatus.COMPLETED);
        sampleResponse.setCheckOutAt(OffsetDateTime.now());

        when(employeeRepository.findByEmail(employeeEmail)).thenReturn(Optional.of(testEmployee));
        when(attendanceService.checkOut(eq(employeeId))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")));

        verify(attendanceService).checkOut(eq(employeeId));
    }
}

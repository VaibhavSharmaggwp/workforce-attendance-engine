package com.techviista.attendance.controller;

import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.attendance.service.AttendanceService;
import com.techviista.attendance.common.GlobalExceptionHandler;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AttendanceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AttendanceService attendanceService;

    @InjectMocks
    private AttendanceController attendanceController;

    private UUID employeeId;
    private UUID attendanceId;
    private AttendanceResponse sampleResponse;

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                String header = webRequest.getHeader("X-Employee-Id");
                if (header != null && !header.isBlank()) {
                    return Employee.builder()
                            .id(UUID.fromString(header))
                            .email("test@example.com")
                            .role(EmployeeRole.EMPLOYEE)
                            .build();
                }
                return null;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(attendanceController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        employeeId = UUID.randomUUID();
        attendanceId = UUID.randomUUID();

        sampleResponse = AttendanceResponse.builder()
                .id(attendanceId)
                .status(AttendanceStatus.WORKING)
                .checkInAt(OffsetDateTime.now())
                .elapsedMinutes(120)
                .breakMinutes(15)
                .netWorkMinutes(105)
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/attendance/check-in")
    class CheckInEndpointTests {

        @Test
        @DisplayName("Should return 200 OK with response payload when check-in succeeds")
        void checkIn_Success() throws Exception {
            when(attendanceService.checkIn(eq(employeeId))).thenReturn(sampleResponse);

            mockMvc.perform(post("/api/v1/attendance/check-in")
                            .header("X-Employee-Id", employeeId.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(attendanceId.toString())))
                    .andExpect(jsonPath("$.status", is("WORKING")))
                    .andExpect(jsonPath("$.checkInAt", notNullValue()))
                    .andExpect(jsonPath("$.elapsedMinutes", is(120)))
                    .andExpect(jsonPath("$.breakMinutes", is(15)))
                    .andExpect(jsonPath("$.netWorkMinutes", is(105)));

            verify(attendanceService).checkIn(eq(employeeId));
        }

        @Test
        @DisplayName("Should return 409 CONFLICT when duplicate check-in occurs")
        void checkIn_Conflict() throws Exception {
            when(attendanceService.checkIn(eq(employeeId)))
                    .thenThrow(new IllegalStateException("You are already checked in for today."));

            mockMvc.perform(post("/api/v1/attendance/check-in")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status", is(409)))
                    .andExpect(jsonPath("$.message", is("You are already checked in for today.")))
                    .andExpect(jsonPath("$.timestamp", notNullValue()));
        }

        @Test
        @DisplayName("Should return 400 BAD REQUEST when employee does not exist")
        void checkIn_NotFound() throws Exception {
            when(attendanceService.checkIn(eq(employeeId)))
                    .thenThrow(new IllegalArgumentException("Employee not found"));

            mockMvc.perform(post("/api/v1/attendance/check-in")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status", is(400)))
                    .andExpect(jsonPath("$.message", is("Employee not found")))
                    .andExpect(jsonPath("$.timestamp", notNullValue()));
        }

        @Test
        @DisplayName("Should return 400 BAD REQUEST when X-Employee-Id header is missing")
        void checkIn_MissingHeader() throws Exception {
            mockMvc.perform(post("/api/v1/attendance/check-in"))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(attendanceService);
        }
    }

    @Nested
    @DisplayName("POST /api/v1/attendance/breaks/start")
    class StartBreakEndpointTests {

        @Test
        @DisplayName("Should return 200 OK when start break succeeds")
        void startBreak_Success() throws Exception {
            sampleResponse.setStatus(AttendanceStatus.ON_BREAK);
            when(attendanceService.startBreak(eq(employeeId))).thenReturn(sampleResponse);

            mockMvc.perform(post("/api/v1/attendance/breaks/start")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("ON_BREAK")));

            verify(attendanceService).startBreak(eq(employeeId));
        }

        @Test
        @DisplayName("Should return 409 CONFLICT when break is already active")
        void startBreak_Conflict() throws Exception {
            when(attendanceService.startBreak(eq(employeeId)))
                    .thenThrow(new IllegalStateException("A break is already active."));

            mockMvc.perform(post("/api/v1/attendance/breaks/start")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status", is(409)))
                    .andExpect(jsonPath("$.message", is("A break is already active.")));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/attendance/breaks/end")
    class EndBreakEndpointTests {

        @Test
        @DisplayName("Should return 200 OK when ending break succeeds")
        void endBreak_Success() throws Exception {
            sampleResponse.setStatus(AttendanceStatus.WORKING);
            when(attendanceService.endBreak(eq(employeeId))).thenReturn(sampleResponse);

            mockMvc.perform(post("/api/v1/attendance/breaks/end")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("WORKING")));

            verify(attendanceService).endBreak(eq(employeeId));
        }

        @Test
        @DisplayName("Should return 409 CONFLICT when ending break without an active break")
        void endBreak_NotOnBreak() throws Exception {
            when(attendanceService.endBreak(eq(employeeId)))
                    .thenThrow(new IllegalStateException("You are not currently on a break."));

            mockMvc.perform(post("/api/v1/attendance/breaks/end")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status", is(409)))
                    .andExpect(jsonPath("$.message", is("You are not currently on a break.")));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/attendance/check-out")
    class CheckOutEndpointTests {

        @Test
        @DisplayName("Should return 200 OK when checkout succeeds")
        void checkOut_Success() throws Exception {
            sampleResponse.setStatus(AttendanceStatus.COMPLETED);
            sampleResponse.setCheckOutAt(OffsetDateTime.now());
            when(attendanceService.checkOut(eq(employeeId))).thenReturn(sampleResponse);

            mockMvc.perform(post("/api/v1/attendance/check-out")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("COMPLETED")))
                    .andExpect(jsonPath("$.checkOutAt", notNullValue()));

            verify(attendanceService).checkOut(eq(employeeId));
        }

        @Test
        @DisplayName("Should return 409 CONFLICT when attempting to check out with an active break")
        void checkOut_ActiveBreakConflict() throws Exception {
            when(attendanceService.checkOut(eq(employeeId)))
                    .thenThrow(new IllegalStateException("Cannot check out while a break is active. Please end your break first."));

            mockMvc.perform(post("/api/v1/attendance/check-out")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status", is(409)))
                    .andExpect(jsonPath("$.message", is("Cannot check out while a break is active. Please end your break first.")));
        }

        @Test
        @DisplayName("Should return 409 CONFLICT when employee has already checked out today")
        void checkOut_AlreadyCompleted() throws Exception {
            when(attendanceService.checkOut(eq(employeeId)))
                    .thenThrow(new IllegalStateException("You have already checked out today."));

            mockMvc.perform(post("/api/v1/attendance/check-out")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status", is(409)))
                    .andExpect(jsonPath("$.message", is("You have already checked out today.")));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/attendance/today")
    class GetTodayAttendanceEndpointTests {

        @Test
        @DisplayName("Should return 200 OK with today's attendance")
        void getTodayAttendance_Success() throws Exception {
            when(attendanceService.getTodayAttendance(eq(employeeId))).thenReturn(sampleResponse);

            mockMvc.perform(get("/api/v1/attendance/today")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(attendanceId.toString())))
                    .andExpect(jsonPath("$.status", is("WORKING")));

            verify(attendanceService).getTodayAttendance(eq(employeeId));
        }

        @Test
        @DisplayName("Should return 400 BAD REQUEST when employee is unauthenticated")
        void getTodayAttendance_Unauthenticated() throws Exception {
            mockMvc.perform(get("/api/v1/attendance/today"))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(attendanceService);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/attendance/history")
    class GetHistoryEndpointTests {

        @Test
        @DisplayName("Should return 200 OK with attendance history list")
        void getHistory_Success() throws Exception {
            when(attendanceService.getAttendanceHistory(eq(employeeId))).thenReturn(List.of(sampleResponse));

            mockMvc.perform(get("/api/v1/attendance/history")
                            .header("X-Employee-Id", employeeId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id", is(attendanceId.toString())))
                    .andExpect(jsonPath("$[0].status", is("WORKING")));

            verify(attendanceService).getAttendanceHistory(eq(employeeId));
        }

        @Test
        @DisplayName("Should return 400 BAD REQUEST when employee is unauthenticated")
        void getHistory_Unauthenticated() throws Exception {
            mockMvc.perform(get("/api/v1/attendance/history"))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(attendanceService);
        }
    }
}

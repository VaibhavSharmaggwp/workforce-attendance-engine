package com.techviista.attendance.attendance.service;

import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.attendance.dto.AttendanceResponse;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import com.techviista.attendance.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private BreakSessionRepository breakSessionRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    private UUID employeeId;
    private Employee employee;
    private UUID attendanceId;
    private Attendance workingAttendance;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        employee = Employee.builder()
                .id(employeeId)
                .fullName("John Doe")
                .email("john.doe@techviista.com")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();

        attendanceId = UUID.randomUUID();
        workingAttendance = Attendance.builder()
                .id(attendanceId)
                .employee(employee)
                .workDate(LocalDate.now())
                .checkInAt(OffsetDateTime.now().minusHours(4))
                .status(AttendanceStatus.WORKING)
                .build();
    }

    @Nested
    @DisplayName("checkIn Tests")
    class CheckInTests {

        @Test
        @DisplayName("Should successfully check in employee when no prior record exists today")
        void checkIn_Success() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.empty());
            when(attendanceRepository.save(any(Attendance.class))).thenAnswer(invocation -> {
                Attendance att = invocation.getArgument(0);
                att.setId(attendanceId);
                return att;
            });
            when(breakSessionRepository.findByAttendanceId(any())).thenReturn(Collections.emptyList());

            AttendanceResponse response = attendanceService.checkIn(employeeId);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(AttendanceStatus.WORKING);
            assertThat(response.getCheckInAt()).isNotNull();

            ArgumentCaptor<Attendance> captor = ArgumentCaptor.forClass(Attendance.class);
            verify(attendanceRepository).save(captor.capture());
            Attendance saved = captor.getValue();
            assertThat(saved.getEmployee()).isEqualTo(employee);
            assertThat(saved.getStatus()).isEqualTo(AttendanceStatus.WORKING);
            assertThat(saved.getWorkDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when employee does not exist")
        void checkIn_EmployeeNotFound() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> attendanceService.checkIn(employeeId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Employee not found");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalStateException when employee is already checked in today")
        void checkIn_AlreadyCheckedIn() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));

            assertThatThrownBy(() -> attendanceService.checkIn(employeeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("You are already checked in for today.");

            verify(attendanceRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("startBreak Tests")
    class StartBreakTests {

        @Test
        @DisplayName("Should successfully start break when employee is currently WORKING")
        void startBreak_Success() {
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));
            when(breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendanceId))
                    .thenReturn(Optional.empty());
            when(breakSessionRepository.findByAttendanceId(attendanceId))
                    .thenReturn(Collections.emptyList());

            AttendanceResponse response = attendanceService.startBreak(employeeId);

            assertThat(response).isNotNull();
            assertThat(workingAttendance.getStatus()).isEqualTo(AttendanceStatus.ON_BREAK);

            verify(breakSessionRepository).save(any(BreakSession.class));
            verify(attendanceRepository).save(workingAttendance);
        }

        @Test
        @DisplayName("Should throw IllegalStateException if attendance status is not WORKING")
        void startBreak_NotWorkingStatus() {
            workingAttendance.setStatus(AttendanceStatus.ON_BREAK);
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));

            assertThatThrownBy(() -> attendanceService.startBreak(employeeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Can only start a break while working.");

            verify(breakSessionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalStateException if a break is already active")
        void startBreak_BreakAlreadyActive() {
            BreakSession activeBreak = BreakSession.builder()
                    .id(UUID.randomUUID())
                    .attendance(workingAttendance)
                    .startedAt(OffsetDateTime.now())
                    .build();

            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));
            when(breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendanceId))
                    .thenReturn(Optional.of(activeBreak));

            assertThatThrownBy(() -> attendanceService.startBreak(employeeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("A break is already active.");

            verify(breakSessionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalStateException if no active attendance exists for today")
        void startBreak_NoAttendanceToday() {
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> attendanceService.startBreak(employeeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("No active attendance session for today.");
        }
    }

    @Nested
    @DisplayName("endBreak Tests")
    class EndBreakTests {

        @Test
        @DisplayName("Should successfully end active break and restore status to WORKING")
        void endBreak_Success() {
            workingAttendance.setStatus(AttendanceStatus.ON_BREAK);
            BreakSession activeBreak = BreakSession.builder()
                    .id(UUID.randomUUID())
                    .attendance(workingAttendance)
                    .startedAt(OffsetDateTime.now().minusMinutes(20))
                    .build();

            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));
            when(breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendanceId))
                    .thenReturn(Optional.of(activeBreak));
            when(breakSessionRepository.findByAttendanceId(attendanceId))
                    .thenReturn(List.of(activeBreak));

            AttendanceResponse response = attendanceService.endBreak(employeeId);

            assertThat(response).isNotNull();
            assertThat(workingAttendance.getStatus()).isEqualTo(AttendanceStatus.WORKING);
            assertThat(activeBreak.getEndedAt()).isNotNull();

            verify(breakSessionRepository).save(activeBreak);
            verify(attendanceRepository).save(workingAttendance);
        }

        @Test
        @DisplayName("Should throw IllegalStateException if employee is not ON_BREAK")
        void endBreak_NotOnBreak() {
            workingAttendance.setStatus(AttendanceStatus.WORKING);
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));

            assertThatThrownBy(() -> attendanceService.endBreak(employeeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("You are not currently on a break.");

            verify(breakSessionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalStateException if status is ON_BREAK but no active break found")
        void endBreak_NoActiveBreakInDb() {
            workingAttendance.setStatus(AttendanceStatus.ON_BREAK);
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));
            when(breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendanceId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> attendanceService.endBreak(employeeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("No active break found to end.");
        }
    }

    @Nested
    @DisplayName("checkOut Tests")
    class CheckOutTests {

        @Test
        @DisplayName("Should successfully check out employee and set status to COMPLETED")
        void checkOut_Success() {
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));
            when(breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendanceId))
                    .thenReturn(Optional.empty());
            when(breakSessionRepository.findByAttendanceId(attendanceId))
                    .thenReturn(Collections.emptyList());

            AttendanceResponse response = attendanceService.checkOut(employeeId);

            assertThat(response).isNotNull();
            assertThat(workingAttendance.getStatus()).isEqualTo(AttendanceStatus.COMPLETED);
            assertThat(workingAttendance.getCheckOutAt()).isNotNull();

            verify(attendanceRepository).save(workingAttendance);
        }

        @Test
        @DisplayName("Should throw IllegalStateException if already checked out today")
        void checkOut_AlreadyCompleted() {
            workingAttendance.setStatus(AttendanceStatus.COMPLETED);
            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));

            assertThatThrownBy(() -> attendanceService.checkOut(employeeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("You have already checked out today.");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalStateException if break is still open during checkout")
        void checkOut_ActiveBreakRemains() {
            BreakSession openBreak = BreakSession.builder()
                    .id(UUID.randomUUID())
                    .attendance(workingAttendance)
                    .startedAt(OffsetDateTime.now().minusMinutes(10))
                    .build();

            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));
            when(breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendanceId))
                    .thenReturn(Optional.of(openBreak));

            assertThatThrownBy(() -> attendanceService.checkOut(employeeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Cannot check out while a break is active. Please end your break first.");

            verify(attendanceRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("mapToResponse Calculation Tests")
    class CalculationTests {

        @Test
        @DisplayName("Should calculate elapsed, break, and net work minutes accurately")
        void mapToResponse_AccurateCalculations() {
            OffsetDateTime checkIn = OffsetDateTime.now().minusMinutes(300); // 5 hours ago
            OffsetDateTime checkOut = OffsetDateTime.now(); // now -> 300 minutes elapsed

            workingAttendance.setCheckInAt(checkIn);
            workingAttendance.setStatus(AttendanceStatus.WORKING);

            // Completed break 1: 30 minutes
            BreakSession break1 = BreakSession.builder()
                    .startedAt(checkIn.plusMinutes(60))
                    .endedAt(checkIn.plusMinutes(90))
                    .build();

            // Completed break 2: 15 minutes
            BreakSession break2 = BreakSession.builder()
                    .startedAt(checkIn.plusMinutes(150))
                    .endedAt(checkIn.plusMinutes(165))
                    .build();

            // Open break (should be ignored in recorded break sum)
            BreakSession openBreak = BreakSession.builder()
                    .startedAt(checkIn.plusMinutes(250))
                    .endedAt(null)
                    .build();

            when(attendanceRepository.findByEmployeeIdAndWorkDate(eq(employeeId), any(LocalDate.class)))
                    .thenReturn(Optional.of(workingAttendance));
            when(breakSessionRepository.findByAttendanceIdAndEndedAtIsNull(attendanceId))
                    .thenReturn(Optional.empty());
            when(breakSessionRepository.findByAttendanceId(attendanceId))
                    .thenReturn(List.of(break1, break2, openBreak));

            AttendanceResponse response = attendanceService.checkOut(employeeId);

            assertThat(response.getBreakMinutes()).isEqualTo(45); // 30 + 15
            assertThat(response.getElapsedMinutes()).isGreaterThanOrEqualTo(300);
            assertThat(response.getNetWorkMinutes()).isEqualTo(response.getElapsedMinutes() - 45);
        }
    }
}

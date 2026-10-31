package com.techviista.attendance.admin;

import com.techviista.attendance.admin.adminService.AdminService;
import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private BreakSessionRepository breakSessionRepository;

    @InjectMocks
    private AdminService adminService;

    private Employee employee1;
    private Employee employee2;

    @BeforeEach
    void setUp() {
        employee1 = Employee.builder()
                .id(UUID.randomUUID())
                .fullName("Ananya Sharma")
                .email("ananya.sharma@techviista.net")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();

        employee2 = Employee.builder()
                .id(UUID.randomUUID())
                .fullName("Rahul Khanna")
                .email("rahul.khanna@techviista.net")
                .role(EmployeeRole.MANAGER)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("provisionEmployee - Successfully creates a new active employee")
    void provisionEmployee_Success() {
        CreateEmployeeRequest request = new CreateEmployeeRequest("Priya Nair", "priya.nair@techviista.net", EmployeeRole.EMPLOYEE);

        when(employeeRepository.findByEmail("priya.nair@techviista.net")).thenReturn(Optional.empty());
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Employee created = adminService.provisionEmployee(request);

        assertThat(created).isNotNull();
        assertThat(created.getFullName()).isEqualTo("Priya Nair");
        assertThat(created.getEmail()).isEqualTo("priya.nair@techviista.net");
        assertThat(created.isActive()).isTrue();
    }

    @Test
    @DisplayName("provisionEmployee - Rejects duplicate employee email with IllegalStateException")
    void provisionEmployee_DuplicateEmail() {
        CreateEmployeeRequest request = new CreateEmployeeRequest("Ananya Sharma", "ananya.sharma@techviista.net", EmployeeRole.EMPLOYEE);

        when(employeeRepository.findByEmail("ananya.sharma@techviista.net")).thenReturn(Optional.of(employee1));

        assertThatThrownBy(() -> adminService.provisionEmployee(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already exists");

        verify(employeeRepository, never()).save(any());
    }

    @Test
    @DisplayName("getTeamAttendanceForDate - Correctly aggregates status buckets (working, not checked in, etc.)")
    void getTeamAttendanceForDate_AggregatesAccurately() {
        LocalDate date = LocalDate.of(2026, 10, 24);

        when(employeeRepository.findAll()).thenReturn(List.of(employee1, employee2));

        Attendance attWorking = Attendance.builder()
                .id(UUID.randomUUID())
                .employee(employee1)
                .workDate(date)
                .checkInAt(OffsetDateTime.now().minusHours(4))
                .status(AttendanceStatus.WORKING)
                .build();

        when(attendanceRepository.findByWorkDate(date)).thenReturn(List.of(attWorking));
        when(breakSessionRepository.findByAttendanceId(attWorking.getId())).thenReturn(List.of(
                BreakSession.builder()
                        .id(UUID.randomUUID())
                        .startedAt(OffsetDateTime.now().minusHours(2))
                        .endedAt(OffsetDateTime.now().minusHours(1)) // 60m
                        .build()
        ));

        TeamAttendanceDashboardDTO dashboard = adminService.getTeamAttendanceForDate(date);

        assertThat(dashboard).isNotNull();
        assertThat(dashboard.getTotalEmployees()).isEqualTo(2);
        assertThat(dashboard.getWorkingCount()).isEqualTo(1);
        assertThat(dashboard.getNotCheckedInCount()).isEqualTo(1); // employee2 did not check in
        assertThat(dashboard.getMembers()).hasSize(2);
    }
}

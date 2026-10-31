package com.techviista.attendance.auth;

import com.techviista.attendance.config.JwtService;
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
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthController authController;

    private Employee activeEmployee;
    private Employee inactiveEmployee;

    @BeforeEach
    void setUp() {
        activeEmployee = Employee.builder()
                .id(UUID.randomUUID())
                .fullName("Ananya Sharma")
                .email("ananya.sharma@techviista.net")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();

        inactiveEmployee = Employee.builder()
                .id(UUID.randomUUID())
                .fullName("Terminated User")
                .email("terminated@techviista.net")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(false)
                .build();
    }

    @Test
    @DisplayName("login - Generates tokens for active employee")
    void login_Success() {
        when(employeeRepository.findByEmail("ananya.sharma@techviista.net"))
                .thenReturn(Optional.of(activeEmployee));
        when(jwtService.generateAccessToken(anyString())).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("mock-refresh-token");

        LoginRequest request = new LoginRequest("ananya.sharma@techviista.net", "password");
        ResponseEntity<AuthResponse> response = authController.login(request);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getAccessToken()).isEqualTo("mock-access-token");
        assertThat(response.getBody().getUser().getFullName()).isEqualTo("Ananya Sharma");
    }

    @Test
    @DisplayName("login - Rejects inactive employee with IllegalStateException")
    void login_InactiveEmployee() {
        when(employeeRepository.findByEmail("terminated@techviista.net"))
                .thenReturn(Optional.of(inactiveEmployee));

        LoginRequest request = new LoginRequest("terminated@techviista.net", "password");

        assertThatThrownBy(() -> authController.login(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("inactive");
    }

    @Test
    @DisplayName("login - Rejects unlinked account with IllegalArgumentException")
    void login_UnlinkedAccount() {
        when(employeeRepository.findByEmail("unknown@techviista.net"))
                .thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("unknown@techviista.net", "password");

        assertThatThrownBy(() -> authController.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not linked to an employee record");
    }

    @Test
    @DisplayName("health - Returns status UP")
    void health_ReturnsUp() {
        ResponseEntity<Map<String, Object>> res = authController.health();
        assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(res.getBody()).containsEntry("status", "UP");
    }
}

package com.techviista.attendance.config;

import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import com.techviista.attendance.repository.EmployeeRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should pass request without authenticating when Authorization header is missing")
    void doFilter_NoAuthHeader_PassesThrough() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtService);
        verifyNoInteractions(employeeRepository);
    }

    @Test
    @DisplayName("Should pass request without authenticating when Authorization header does not start with Bearer")
    void doFilter_NonBearerHeader_PassesThrough() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtService);
        verifyNoInteractions(employeeRepository);
    }

    @Test
    @DisplayName("Should authenticate user and set SecurityContext when JWT and employee are valid")
    void doFilter_ValidJwt_AuthenticatesSuccessfully() throws ServletException, IOException {
        String token = "valid.jwt.token";
        String email = "john.doe@example.com";
        Employee employee = Employee.builder()
                .id(UUID.randomUUID())
                .email(email)
                .fullName("John Doe")
                .role(EmployeeRole.EMPLOYEE)
                .build();

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractEmail(token)).thenReturn(email);
        when(employeeRepository.findByEmail(email)).thenReturn(Optional.of(employee));
        when(jwtService.isTokenValid(token, email)).thenReturn(true);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isEqualTo(employee);
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_EMPLOYEE");
    }

    @Test
    @DisplayName("Should not authenticate when employee does not exist in repository")
    void doFilter_EmployeeNotFound_DoesNotAuthenticate() throws ServletException, IOException {
        String token = "valid.jwt.token";
        String email = "unknown@example.com";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractEmail(token)).thenReturn(email);
        when(employeeRepository.findByEmail(email)).thenReturn(Optional.empty());

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("Should not authenticate when JWT is invalid")
    void doFilter_InvalidToken_DoesNotAuthenticate() throws ServletException, IOException {
        String token = "invalid.jwt.token";
        String email = "john.doe@example.com";
        Employee employee = Employee.builder()
                .id(UUID.randomUUID())
                .email(email)
                .role(EmployeeRole.EMPLOYEE)
                .build();

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractEmail(token)).thenReturn(email);
        when(employeeRepository.findByEmail(email)).thenReturn(Optional.of(employee));
        when(jwtService.isTokenValid(token, email)).thenReturn(false);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}

package com.techviista.attendance.auth;

import com.techviista.attendance.config.JwtService;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final EmployeeRepository employeeRepository;
    private final JwtService jwtService;

    @PostMapping("/api/v1/auth/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("Email is required for authentication.");
        }

        Employee employee = employeeRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("This Google/work account is not linked to an employee record. Ask your manager to add your account."));

        if (!employee.isActive()) {
            throw new IllegalStateException("Your employee account is currently inactive. Please contact your manager.");
        }

        String accessToken = jwtService.generateAccessToken(employee.getEmail());
        String refreshToken = jwtService.generateRefreshToken(employee.getEmail());

        UserProfileDTO userProfile = UserProfileDTO.builder()
                .id(employee.getId())
                .fullName(employee.getFullName())
                .email(employee.getEmail())
                .role(employee.getRole())
                .active(employee.isActive())
                .build();

        return ResponseEntity.ok(AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userProfile)
                .build());
    }

    @GetMapping("/api/v1/auth/demo-accounts")
    public ResponseEntity<List<UserProfileDTO>> getDemoAccounts() {
        List<UserProfileDTO> list = employeeRepository.findAll().stream()
                .map(e -> UserProfileDTO.builder()
                        .id(e.getId())
                        .fullName(e.getFullName())
                        .email(e.getEmail())
                        .role(e.getRole())
                        .active(e.isActive())
                        .build())
                .toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/api/v1/me")
    public ResponseEntity<UserProfileDTO> getCurrentUser(@AuthenticationPrincipal Employee currentEmployee) {
        if (currentEmployee == null) {
            throw new IllegalArgumentException("Unauthorized");
        }

        return ResponseEntity.ok(UserProfileDTO.builder()
                .id(currentEmployee.getId())
                .fullName(currentEmployee.getFullName())
                .email(currentEmployee.getEmail())
                .role(currentEmployee.getRole())
                .active(currentEmployee.isActive())
                .build());
    }

    @GetMapping("/api/v1/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "workforce-attendance-engine",
                "timestamp", OffsetDateTime.now()
        ));
    }
}


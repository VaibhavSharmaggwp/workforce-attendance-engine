package com.techviista.attendance.config;

import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.AttendanceStatus;
import com.techviista.attendance.attendance.BreakSession;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.employee.EmployeeRole;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.BreakSessionRepository;
import com.techviista.attendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final BreakSessionRepository breakSessionRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Value("${app.initial-manager.email:techviista53@gmail.com}")
    private String initialManagerEmail;

    @org.springframework.beans.factory.annotation.Value("${app.initial-manager.name:Mayank Verma}")
    private String initialManagerName;

    @Override
    public void run(String... args) {
        // Ensure Mayank Verma exists as the authorized manager
        seedManagerIfMissing("techviista53@gmail.com", "Mayank Verma");
        if (initialManagerEmail != null && !initialManagerEmail.isBlank()) {
            seedManagerIfMissing(initialManagerEmail, initialManagerName);
        }

        // Clean up test accounts (vs9736400462@gmail.com and austindunhamm@gmail.com)
        cleanupTestAccount("vs9736400462@gmail.com");
        cleanupTestAccount("austindunhamm@gmail.com");

        log.info("Data initialization check completed. Primary manager verified: Mayank Verma <techviista53@gmail.com>");
    }

    private void cleanupTestAccount(String email) {
        if (email == null || email.isBlank()) return;
        try {
            String cleanEmail = email.trim().toLowerCase();
            // Delete child audit entries
            jdbcTemplate.update("DELETE FROM audit_entries WHERE actor_employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?) OR attendance_id IN (SELECT a.id FROM attendance_sessions a JOIN employees e ON a.employee_id = e.id WHERE LOWER(e.email) = ?)", cleanEmail, cleanEmail);
            // Delete child activity logs
            jdbcTemplate.update("DELETE FROM activity_logs WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?)", cleanEmail);
            // Delete inactivity alerts
            jdbcTemplate.update("DELETE FROM inactivity_alerts WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?)", cleanEmail);
            // Delete break sessions
            jdbcTemplate.update("DELETE FROM break_sessions WHERE attendance_id IN (SELECT a.id FROM attendance_sessions a JOIN employees e ON a.employee_id = e.id WHERE LOWER(e.email) = ?)", cleanEmail);
            // Delete attendance sessions
            jdbcTemplate.update("DELETE FROM attendance_sessions WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?)", cleanEmail);
            // Delete employee
            int deleted = jdbcTemplate.update("DELETE FROM employees WHERE LOWER(email) = ?", cleanEmail);
            if (deleted > 0) {
                log.info("Successfully removed test account: {}", cleanEmail);
            }
        } catch (Exception e) {
            log.warn("Test account cleanup for {} deferred: {}", email, e.getMessage());
        }
    }

    private void seedManagerIfMissing(String email, String name) {
        if (email != null && !email.isBlank()) {
            String cleanEmail = email.trim().toLowerCase();
            if (employeeRepository.findByEmailIgnoreCase(cleanEmail).isEmpty()) {
                employeeRepository.save(Employee.builder()
                        .fullName(name)
                        .email(cleanEmail)
                        .role(EmployeeRole.MANAGER)
                        .isActive(true)
                        .build());
                log.info("Provisioned authorized manager account: {} <{}>", name, cleanEmail);
            }
        }
    }
}


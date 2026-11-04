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

    @org.springframework.beans.factory.annotation.Value("${app.initial-manager.email:vs9736400462@gmail.com}")
    private String initialManagerEmail;

    @org.springframework.beans.factory.annotation.Value("${app.initial-manager.name:Vaibhav Sharma}")
    private String initialManagerName;

    @Override
    public void run(String... args) {
        // Ensure both Vaibhav Sharma and Mayank Verma exist as authorized managers
        seedManagerIfMissing("vs9736400462@gmail.com", "Vaibhav Sharma");
        seedManagerIfMissing("techviista53@gmail.com", "Mayank Verma");
        if (initialManagerEmail != null && !initialManagerEmail.isBlank()) {
            seedManagerIfMissing(initialManagerEmail, initialManagerName);
        }

        log.info("Data initialization check completed. Authorized managers verified.");
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


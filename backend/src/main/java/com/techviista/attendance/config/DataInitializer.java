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

    @org.springframework.beans.factory.annotation.Value("${app.initial-manager.email:techviista53@gmail.com}")
    private String initialManagerEmail;

    @org.springframework.beans.factory.annotation.Value("${app.initial-manager.name:Mayank Verma}")
    private String initialManagerName;

    @Override
    public void run(String... args) {
        // Always ensure the configured primary manager exists
        if (initialManagerEmail != null && !initialManagerEmail.isBlank()) {
            if (employeeRepository.findByEmail(initialManagerEmail).isEmpty()) {
                employeeRepository.save(Employee.builder()
                        .fullName(initialManagerName)
                        .email(initialManagerEmail)
                        .role(EmployeeRole.MANAGER)
                        .isActive(true)
                        .build());
                log.info("Provisioned initial manager account: {} <{}>", initialManagerName, initialManagerEmail);
            }
        }

        log.info("Data initialization check completed. Zero mock employees seeded.");
    }
}


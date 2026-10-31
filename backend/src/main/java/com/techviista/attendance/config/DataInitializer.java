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

        if (employeeRepository.count() > 1) {
            return;
        }

        log.info("Seeding initial employees and attendance records from PRD/UI specification...");

        // 1. Manager: Mayank Verma
        Employee manager = employeeRepository.findByEmail(initialManagerEmail)
                .orElseGet(() -> employeeRepository.save(Employee.builder()
                        .fullName(initialManagerName)
                        .email(initialManagerEmail)
                        .role(EmployeeRole.MANAGER)
                        .isActive(true)
                        .build()));

        // 2. Primary Employee: Ananya Sharma
        Employee ananya = employeeRepository.save(Employee.builder()
                .fullName("Ananya Sharma")
                .email("ananya.sharma@techviista.net")
                .role(EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build());

        // 3. Team Members (from UI/UX Proposal Page 13)
        List<Employee> team = List.of(
                Employee.builder().fullName("Rohit Verma").email("rohit.verma@techviista.net").role(EmployeeRole.EMPLOYEE).isActive(true).build(),
                Employee.builder().fullName("Priya Nair").email("priya.nair@techviista.net").role(EmployeeRole.EMPLOYEE).isActive(true).build(),
                Employee.builder().fullName("Karan Mehta").email("karan.mehta@techviista.net").role(EmployeeRole.EMPLOYEE).isActive(true).build(),
                Employee.builder().fullName("Sneha Iyer").email("sneha.iyer@techviista.net").role(EmployeeRole.EMPLOYEE).isActive(true).build(),
                Employee.builder().fullName("Arjun Reddy").email("arjun.reddy@techviista.net").role(EmployeeRole.EMPLOYEE).isActive(true).build(),
                Employee.builder().fullName("Meera Pillai").email("meera.pillai@techviista.net").role(EmployeeRole.EMPLOYEE).isActive(true).build(),
                Employee.builder().fullName("Vikram Singh").email("vikram.singh@techviista.net").role(EmployeeRole.EMPLOYEE).isActive(true).build(),
                Employee.builder().fullName("Divya Kapoor").email("divya.kapoor@techviista.net").role(EmployeeRole.EMPLOYEE).isActive(true).build()
        );
        employeeRepository.saveAll(team);

        // 4. Historical Attendance for Ananya Sharma (October 2026 - matching UI Pages 7, 10, 12)
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 21), 9, 54, 17, 3, 53, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 20), 10, 1, 17, 8, 58, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 19), 9, 58, 17, 15, 50, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 16), 9, 49, 16, 45, 50, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 15), 9, 53, 17, 4, 54, AttendanceStatus.COMPLETED);
        // Missing checkout day (Incomplete)
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 14), 9, 50, 0, 0, 52, AttendanceStatus.INCOMPLETE);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 13), 10, 12, 17, 25, 50, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 12), 9, 59, 17, 10, 55, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 9), 9, 46, 17, 2, 48, AttendanceStatus.COMPLETED);
        // Break over 1h day (1h 15m break)
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 8), 9, 55, 17, 31, 75, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 7), 9, 51, 16, 58, 52, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 6), 10, 4, 17, 20, 50, AttendanceStatus.COMPLETED);
        seedHistoryRecord(ananya, LocalDate.of(2026, 10, 5), 9, 57, 17, 12, 52, AttendanceStatus.COMPLETED);

        log.info("Database seeding completed successfully.");
    }

    private void seedHistoryRecord(Employee employee, LocalDate date, int inH, int inM, int outH, int outM, int breakMins, AttendanceStatus status) {
        ZoneOffset istOffset = ZoneOffset.ofHoursMinutes(5, 30);
        OffsetDateTime checkIn = date.atTime(inH, inM).atOffset(istOffset);
        OffsetDateTime checkOut = (status == AttendanceStatus.INCOMPLETE) ? null : date.atTime(outH, outM).atOffset(istOffset);

        Attendance att = attendanceRepository.save(Attendance.builder()
                .employee(employee)
                .workDate(date)
                .checkInAt(checkIn)
                .checkOutAt(checkOut)
                .status(status)
                .build());

        if (breakMins > 0) {
            OffsetDateTime breakStart = date.atTime(13, 0).atOffset(istOffset);
            OffsetDateTime breakEnd = breakStart.plusMinutes(breakMins);
            breakSessionRepository.save(BreakSession.builder()
                    .attendance(att)
                    .startedAt(breakStart)
                    .endedAt(breakEnd)
                    .build());
        }
    }
}


package com.techviista.attendance.events;

import java.time.LocalDate;
import java.util.UUID;

public record InactivityAlertEvent(
        UUID employeeId,
        String employeeName,
        String employeeEmail,
        String managerEmail,
        LocalDate workDate,
        long idleMinutes,
        String lastActiveTime,
        String timestamp
) {}

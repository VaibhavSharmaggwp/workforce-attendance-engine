package com.techviista.attendance.events;

import java.util.UUID;

public record AttendanceEvent(
        UUID employeeId,
        String action,  // e.g., "CHECK_IN", "LONG_BREAK_FLAGGED"
        String timestamp
) {}

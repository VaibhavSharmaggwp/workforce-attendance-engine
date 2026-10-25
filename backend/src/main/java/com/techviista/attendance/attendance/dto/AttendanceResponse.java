package com.techviista.attendance.attendance.dto;

import com.techviista.attendance.attendance.AttendanceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class AttendanceResponse {
    private UUID id;
    private AttendanceStatus status;
    private OffsetDateTime checkInAt;
    private OffsetDateTime checkOutAt;
    private long elapsedMinutes;
    private long breakMinutes;
    private long netWorkMinutes;
}

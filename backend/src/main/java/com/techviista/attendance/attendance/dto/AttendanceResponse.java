package com.techviista.attendance.attendance.dto;

import com.techviista.attendance.attendance.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private UUID id;
    private LocalDate workDate;
    private AttendanceStatus status;
    private OffsetDateTime checkInAt;
    private OffsetDateTime checkOutAt;
    private long elapsedMinutes;
    private long breakMinutes;
    private long netWorkMinutes;
    private List<BreakDetailDTO> breaks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BreakDetailDTO {
        private UUID id;
        private OffsetDateTime startedAt;
        private OffsetDateTime endedAt;
        private long durationMinutes;
    }
}

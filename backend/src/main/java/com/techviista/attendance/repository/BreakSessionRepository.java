package com.techviista.attendance.repository;

import com.techviista.attendance.attendance.BreakSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BreakSessionRepository extends JpaRepository<BreakSession, UUID> {
    Optional<BreakSession> findByAttendanceIdAndEndedAtIsNull(UUID attendanceId);
    List<BreakSession> findByAttendanceId(UUID attendanceId);
}

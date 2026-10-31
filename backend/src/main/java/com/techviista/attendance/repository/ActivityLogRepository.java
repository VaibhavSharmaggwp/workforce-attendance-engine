package com.techviista.attendance.repository;

import com.techviista.attendance.activity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findByEmployeeIdAndLoggedAtBetweenOrderByLoggedAtAsc(
            UUID employeeId, OffsetDateTime start, OffsetDateTime end);

    long countByEmployeeIdAndLoggedAtBetween(
            UUID employeeId, OffsetDateTime start, OffsetDateTime end);

    List<ActivityLog> findTop10ByEmployeeIdOrderByLoggedAtDesc(UUID employeeId);
}


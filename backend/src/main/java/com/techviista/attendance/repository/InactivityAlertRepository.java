package com.techviista.attendance.repository;

import com.techviista.attendance.alerts.InactivityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface InactivityAlertRepository extends JpaRepository<InactivityAlert, UUID> {
    boolean existsByEmployeeIdAndWorkDate(UUID employeeId, LocalDate workDate);
    List<InactivityAlert> findByWorkDate(LocalDate workDate);
}


package com.techviista.attendance.repository;

import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.attendance.dto.MonthlySummaryProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    Optional<Attendance> findByEmployeeIdAndWorkDate(UUID employeeId, LocalDate workDate);
    List<Attendance> findByEmployeeIdOrderByWorkDateDesc(UUID employeeId);

    @Query(value = """
        WITH break_sums AS (
            SELECT attendance_id, COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at))/60), 0) as total_break_mins
            FROM break_sessions
            WHERE ended_at IS NOT NULL
            GROUP BY attendance_id
        )
        SELECT 
            TO_CHAR(a.work_date, 'YYYY-MM') as monthYear,
            CAST(COUNT(a.id) AS INTEGER) as daysRecorded,
            CAST(SUM(CASE WHEN a.status = 'INCOMPLETE' THEN 1 ELSE 0 END) AS INTEGER) as incompleteDays,
            CAST(SUM(EXTRACT(EPOCH FROM (COALESCE(a.check_out_at, CURRENT_TIMESTAMP) - a.check_in_at))/60 
                - COALESCE(b.total_break_mins, 0)) AS BIGINT) as netWorkMinutes
        FROM attendance_sessions a
        LEFT JOIN break_sums b ON a.id = b.attendance_id
        WHERE a.employee_id = :employeeId 
          AND EXTRACT(YEAR FROM a.work_date) = :year
        GROUP BY TO_CHAR(a.work_date, 'YYYY-MM')
        ORDER BY monthYear DESC
        """, nativeQuery = true)
    List<MonthlySummaryProjection> getYearlyMonthlySummary(@Param("employeeId") UUID employeeId, @Param("year") int year);

}

package com.techviista.attendance.activity;

import com.techviista.attendance.employee.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "workbook_name", nullable = false)
    private String workbookName;

    @Column(name = "sheet_name")
    private String sheetName;

    @Column(name = "cell_range")
    private String cellRange;

    @Column(name = "activity_type", nullable = false)
    @Builder.Default
    private String activityType = "CELL_EDIT";

    @Column(name = "details")
    private String details;

    @Column(name = "logged_at", nullable = false)
    private OffsetDateTime loggedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.loggedAt == null) {
            this.loggedAt = OffsetDateTime.now();
        }
        if (this.activityType == null) {
            this.activityType = "CELL_EDIT";
        }
        this.createdAt = OffsetDateTime.now();
    }
}

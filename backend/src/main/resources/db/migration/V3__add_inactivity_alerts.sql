CREATE TABLE inactivity_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    idle_minutes BIGINT NOT NULL,
    manager_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_employee_daily_inactivity_alert UNIQUE (employee_id, work_date)
);

CREATE INDEX idx_inactivity_alerts_date ON inactivity_alerts(work_date);

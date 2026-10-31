CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    workbook_name VARCHAR(255) NOT NULL,
    sheet_name VARCHAR(255),
    cell_range VARCHAR(100),
    activity_type VARCHAR(50) NOT NULL DEFAULT 'CELL_EDIT',
    details TEXT,
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_employee_logged_at ON activity_logs(employee_id, logged_at);


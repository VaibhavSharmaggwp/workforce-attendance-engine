CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE employee_role AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');
CREATE TYPE attendance_status AS ENUM ('WORKING', 'ON_BREAK', 'COMPLETED', 'INCOMPLETE');

CREATE TABLE employees (
                           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                           full_name VARCHAR(255) NOT NULL,
                           email VARCHAR(255) UNIQUE NOT NULL,
                           auth_provider_subject VARCHAR(255) UNIQUE,
                           password_hash VARCHAR(255),
                           role employee_role NOT NULL DEFAULT 'EMPLOYEE',
                           is_active BOOLEAN NOT NULL DEFAULT TRUE,
                           created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_sessions (
                                     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                     employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
                                     work_date DATE NOT NULL,
                                     check_in_at TIMESTAMP WITH TIME ZONE NOT NULL,
                                     check_out_at TIMESTAMP WITH TIME ZONE,
                                     status attendance_status NOT NULL DEFAULT 'WORKING',
                                     created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     CONSTRAINT unique_employee_date UNIQUE (employee_id, work_date),
                                     CONSTRAINT check_out_after_in CHECK (check_out_at IS NULL OR check_out_at > check_in_at)
);

CREATE TABLE break_sessions (
                                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                attendance_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
                                started_at TIMESTAMP WITH TIME ZONE NOT NULL,
                                ended_at TIMESTAMP WITH TIME ZONE,
                                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT end_after_start CHECK (ended_at IS NULL OR ended_at > started_at)
);

CREATE UNIQUE INDEX idx_one_active_break_per_attendance
    ON break_sessions (attendance_id)
    WHERE ended_at IS NULL;

CREATE TABLE audit_entries (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               actor_employee_id UUID NOT NULL REFERENCES employees(id),
                               attendance_id UUID NOT NULL REFERENCES attendance_sessions(id),
                               action VARCHAR(100) NOT NULL,
                               old_value JSONB,
                               new_value JSONB,
                               reason TEXT NOT NULL,
                               created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for heavy read operations (Manager Views & Employee History)
CREATE INDEX idx_attendance_employee_id ON attendance_sessions(employee_id);
CREATE INDEX idx_attendance_work_date ON attendance_sessions(work_date);
CREATE INDEX idx_break_attendance_id ON break_sessions(attendance_id);
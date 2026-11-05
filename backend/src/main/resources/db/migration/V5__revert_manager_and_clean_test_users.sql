-- Flyway Migration V5: Revert manager to Mayank Verma (techviista53@gmail.com) and clean test accounts
-- Removes vs9736400462@gmail.com and austindunhamm@gmail.com from production database

-- 1. Remove audit entries for test employees
DELETE FROM audit_entries 
WHERE actor_employee_id IN (SELECT id FROM employees WHERE LOWER(email) IN ('vs9736400462@gmail.com', 'austindunhamm@gmail.com'))
   OR attendance_id IN (SELECT a.id FROM attendance_sessions a JOIN employees e ON a.employee_id = e.id WHERE LOWER(e.email) IN ('vs9736400462@gmail.com', 'austindunhamm@gmail.com'));

-- 2. Remove activity logs for test employees
DELETE FROM activity_logs 
WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) IN ('vs9736400462@gmail.com', 'austindunhamm@gmail.com'));

-- 3. Remove inactivity alerts for test employees
DELETE FROM inactivity_alerts 
WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) IN ('vs9736400462@gmail.com', 'austindunhamm@gmail.com'));

-- 4. Remove break sessions for test employees
DELETE FROM break_sessions 
WHERE attendance_id IN (SELECT a.id FROM attendance_sessions a JOIN employees e ON a.employee_id = e.id WHERE LOWER(e.email) IN ('vs9736400462@gmail.com', 'austindunhamm@gmail.com'));

-- 5. Remove attendance sessions for test employees
DELETE FROM attendance_sessions 
WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) IN ('vs9736400462@gmail.com', 'austindunhamm@gmail.com'));

-- 6. Remove test employees from employees table
DELETE FROM employees 
WHERE LOWER(email) IN ('vs9736400462@gmail.com', 'austindunhamm@gmail.com');

-- 7. Ensure Mayank Verma exists as the active primary MANAGER
INSERT INTO employees (full_name, email, role, is_active)
VALUES ('Mayank Verma', 'techviista53@gmail.com', 'MANAGER', TRUE)
ON CONFLICT (email) DO UPDATE 
    SET full_name = 'Mayank Verma',
        role = 'MANAGER', 
        is_active = TRUE;

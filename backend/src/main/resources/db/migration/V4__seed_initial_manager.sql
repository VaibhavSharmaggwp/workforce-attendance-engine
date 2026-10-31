-- Flyway Migration V4: Seed initial manager (Mayank Verma - techviista53@gmail.com)
-- Guarantees the primary manager can authenticate via Google OAuth on Day 1

INSERT INTO employees (full_name, email, role, is_active)
VALUES ('Mayank Verma', 'techviista53@gmail.com', 'MANAGER', TRUE)
ON CONFLICT (email) DO UPDATE 
    SET role = 'MANAGER', 
        is_active = TRUE;


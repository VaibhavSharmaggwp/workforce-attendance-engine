$env:PGPASSWORD = 'Vaibhav@007'
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -h localhost -p 5433 -U postgres -d ams_db -c "DELETE FROM audit_entries; DELETE FROM break_sessions; DELETE FROM attendance_sessions; DELETE FROM inactivity_alerts; DELETE FROM activity_logs; DELETE FROM employees WHERE email != 'techviista53@gmail.com';"
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -h localhost -p 5433 -U postgres -d ams_db -c "SELECT id, full_name, email, role, is_active FROM employees;"

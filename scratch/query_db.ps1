$env:PGPASSWORD = 'Vaibhav@007'
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -h localhost -p 5433 -U postgres -d ams_db -c "SELECT id, full_name, email, role, is_active FROM employees;"


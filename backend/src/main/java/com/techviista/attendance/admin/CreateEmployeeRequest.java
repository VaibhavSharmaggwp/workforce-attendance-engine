package com.techviista.attendance.admin;

import com.techviista.attendance.employee.EmployeeRole;

public record CreateEmployeeRequest(String fullName, String email, EmployeeRole role) {}

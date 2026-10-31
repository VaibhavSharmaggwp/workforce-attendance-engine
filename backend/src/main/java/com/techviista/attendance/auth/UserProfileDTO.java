package com.techviista.attendance.auth;

import com.techviista.attendance.employee.EmployeeRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private UUID id;
    private String fullName;
    private String email;
    private EmployeeRole role;
    private boolean active;
}


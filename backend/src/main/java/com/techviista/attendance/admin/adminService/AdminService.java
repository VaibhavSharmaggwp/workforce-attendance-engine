package com.techviista.attendance.admin.adminService;

import com.techviista.attendance.admin.CreateEmployeeRequest;
import com.techviista.attendance.attendance.Attendance;
import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.repository.AttendanceRepository;
import com.techviista.attendance.repository.EmployeeRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;

    @Transactional
    public Employee provisionEmployee(CreateEmployeeRequest request){
        if(employeeRepository.findByEmail(request.email()).isPresent()){
            throw new IllegalStateException("An employee with this email already exists.");
        }

        Employee newEmployee = Employee.builder()
                .fullName(request.fullName())
                .email(request.email())
                .role(request.role() != null ? request.role() : com.techviista.attendance.employee.EmployeeRole.EMPLOYEE)
                .isActive(true)
                .build();

        return employeeRepository.save(newEmployee);
    }

    @Transactional(readOnly = true)
    public List<Attendance> getTeamAttendanceToday(){
        // For the MVP dashboard, we fetch everyone who has interacted with the system today
        // In the next phase, we will map this to a TeamAttendanceDTO to match the UI grid
        return attendanceRepository.findAll(); // We will optimize this query shortly
    }
}

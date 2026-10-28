package com.techviista.attendance.analytics;

import com.techviista.attendance.employee.Employee;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/yearly-overview")
    public ResponseEntity<YearlyOverviewDTO> getYearlyOverview(
            @AuthenticationPrincipal Employee currentEmployee,
            @RequestParam(required = false) Integer year) {

        int targetYear = (year != null) ? year : LocalDate.now().getYear();
        YearlyOverviewDTO response = analyticsService.getYearlyOverview(currentEmployee.getId(), targetYear);

        return ResponseEntity.ok(response);
    }
}
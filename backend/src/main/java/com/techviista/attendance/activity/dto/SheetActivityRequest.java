package com.techviista.attendance.activity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SheetActivityRequest {

    @NotBlank(message = "Employee email is required")
    private String employeeEmail;

    @NotBlank(message = "Workbook name is required")
    private String workbookName;

    private String sheetName;
    private String cellRange;
    private String activityType; // CELL_EDIT, ROW_INSERT, FORMULA_UPDATE
    private String details;
    private OffsetDateTime loggedAt;
    private String secretKey;
}

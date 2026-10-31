/**
 * Workforce Attendance Engine - Sales Spreadsheet Engagement Tracker
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet (Sales Leads / Pipeline / Quotations).
 * 2. In top menu, click Extensions > Apps Script.
 * 3. Delete any default code and paste this entire script.
 * 4. Set ATTENDANCE_API_URL to your deployed backend URL.
 * 5. Click the Save icon (Ctrl+S).
 * 6. That's it! Every lead entry or cell edit automatically records proof-of-work.
 */

var ATTENDANCE_API_URL = "http://localhost:8080/api/v1/activity/pulse";

function onEdit(e) {
  try {
    var userEmail = Session.getActiveUser().getEmail();
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = e ? e.range.getSheet() : spreadsheet.getActiveSheet();
    var range = e ? e.range.getA1Notation() : "A1";

    var payload = {
      employeeEmail: userEmail,
      workbookName: spreadsheet.getName(),
      sheetName: sheet.getName(),
      cellRange: range,
      activityType: "CELL_EDIT",
      details: "Active edit in " + sheet.getName() + "!" + range,
      loggedAt: new Date().toISOString()
    };

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(ATTENDANCE_API_URL, options);
  } catch (err) {
    Logger.log("Failed to send pulse: " + err);
  }
}

function testConnection() {
  onEdit(null);
  Logger.log("Pulse test sent successfully.");
}

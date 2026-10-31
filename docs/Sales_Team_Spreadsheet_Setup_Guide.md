# Eduqynt Techviista — Sales Team Onboarding Guide
## Automated Spreadsheet Proof-of-Work Setup (2-Minute Guide)

Welcome to the Techviista Sales Team! This guide walks you through linking your sales leads spreadsheet (**Google Sheets** or **Microsoft Excel**) to the company's **Workforce Attendance Engine**.

---

### Why Are We Doing This?

Our company uses **active proof-of-work** to ensure that your focused work hours on sales calls, customer outreach, and pipeline management are automatically credited to your attendance record.

- **You only check in once** in the morning on the web portal.
- **You work normally** in your spreadsheet. Every time you enter a lead or update a deal, your active work is automatically verified.
- **No need to keep the attendance website open** all day.

---

## Path A: If You Use Google Sheets (Recommended & 100% Free)

*Setup Time: 60 seconds*

### Step 1: Open your Sales Spreadsheet
Open your lead pipeline or outreach Google Sheet in Google Chrome.

### Step 2: Open Apps Script
In the top menu bar, click:  
**Extensions** ➔ **Apps Script**

*(A new tab will open with a code editor).*

### Step 3: Paste the Tracking Script
Delete any placeholder text in the editor and paste the following code:

```javascript
/**
 * Eduqynt Techviista - Sales Spreadsheet Activity Tracker
 * Automatically verifies active sales work for attendance credit.
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
      details: "Cell update in " + sheet.getName() + "!" + range,
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
    Logger.log("Attendance pulse error: " + err);
  }
}

function testConnection() {
  onEdit(null);
  Logger.log("Test pulse sent successfully!");
}
```

> **Note:** If your company's attendance engine is deployed on a custom domain (e.g., `https://attendance.techviista.com`), replace `http://localhost:8080` with your company's server URL.

### Step 4: Save
Click the **Disk / Save** icon (or press `Ctrl + S`).

### Step 5: Verify Connectivity
1. In the toolbar at the top of the script editor, choose **`testConnection`** from the function dropdown.
2. Click **Run**.
3. (If prompted, click *Review Permissions* and allow the script to connect).
4. **Done!** Whenever you edit a cell in your sales sheet, your attendance record will reflect active work.

---

## Path B: If You Use Desktop Microsoft Excel (.xlsx on Windows)

*Setup Time: 90 seconds*

If you work offline on Microsoft Excel installed on your laptop, follow these steps:

### Step 1: Open your Excel Workbook
Open your sales leads sheet in Microsoft Excel.

### Step 2: Open the VBA Editor
Press the keyboard shortcut:  
**`ALT + F11`**  
*(This opens the built-in Microsoft Visual Basic for Applications window).*

### Step 3: Open `ThisWorkbook`
1. On the left side under **Project - VBAProject**, find **`ThisWorkbook`**.
2. **Double-click** on **`ThisWorkbook`**. A blank code window will appear on the right.

### Step 4: Paste this Code

```vba
Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    On Error Resume Next
    
    Dim http As Object
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    
    ' Server endpoint (replace with your company's attendance URL if hosted)
    Dim url As String
    url = "http://localhost:8080/api/v1/activity/pulse"
    
    ' Construct JSON payload
    Dim jsonPayload As String
    jsonPayload = "{""employeeEmail"":""" & Application.UserName & "@techviista.net""," & _
                  """workbookName"":""" & ThisWorkbook.Name & """," & _
                  """sheetName"":""" & Sh.Name & """," & _
                  """cellRange"":""" & Target.Address & """," & _
                  """activityType"":""CELL_EDIT""}"
                  
    http.Open "POST", url, True
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonPayload
End Sub
```

### Step 5: Save as a Macro-Enabled Workbook
1. Click **File ➔ Save As**.
2. In the **Save as type** dropdown, select:  
   **Excel Macro-Enabled Workbook (*.xlsm)**.
3. Save the file.
4. **Done!** From now on, whenever you edit cells in this file, Excel silently reports your active hours to the attendance system.

---

## Your Daily Sales Routine

```
  09:00 AM ➔ Log into Attendance Portal & click "Check In"
              │
  All Day  ➔ Minimize the browser. Work inside your Sales Sheet
              │  (Calls, leads, customer updates automatically count as work)
              │
  01:00 PM ➔ Taking lunch? Click "Start Break" on the portal
              │
  02:00 PM ➔ Returning from lunch? Click "End Break"
              │
  05:30 PM ➔ Finished for the day? Click "Check Out"
```

---

## Frequently Asked Questions & Privacy

#### 1. Does this script read my customer details or confidential client data?
**No.** The script only sends:
- Your work email (to know who to credit).
- The workbook name & sheet name (e.g. *Q4_Sales_Pipeline.xlsx*).
- The cell coordinate (e.g. *B14*).
- The timestamp.  
It **never** uploads client phone numbers, deal notes, or personal data.

#### 2. How do I know my work is being recorded?
Open the attendance dashboard at any time. Look at the **"Sales Spreadsheet Activity"** card:
- It shows your **Engagement Percentage** (e.g., `88% Active`).
- It shows your **Total Verified Cell Edits**.
- You will see a green badge: **"Verified High Engagement"**.

#### 3. What if I am on a customer phone call for 30 minutes without typing?
The system groups activity into **10-minute buckets**. If you make even 1 note during or after a call, the entire window is credited as active work time.

#### 4. Need help?
If you have any difficulty setting this up, contact your team lead or the IT helpdesk at `support@techviista.net`.


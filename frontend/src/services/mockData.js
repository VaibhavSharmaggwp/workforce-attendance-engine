// High-fidelity seed & fallback dataset strictly matching PRD v1.0 and UI/UX Design Proposal

export const MOCK_EMPLOYEES = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    fullName: 'Ananya Sharma',
    email: 'ananya.sharma@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    fullName: 'Mayank Verma',
    email: 'techviista53@gmail.com',
    role: 'MANAGER',
    active: true,
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    fullName: 'Rohit Verma',
    email: 'rohit.verma@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    fullName: 'Priya Nair',
    email: 'priya.nair@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    fullName: 'Karan Mehta',
    email: 'karan.mehta@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
  {
    id: 'e6666666-6666-6666-6666-666666666666',
    fullName: 'Sneha Iyer',
    email: 'sneha.iyer@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
  {
    id: 'e7777777-7777-7777-7777-777777777777',
    fullName: 'Arjun Reddy',
    email: 'arjun.reddy@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
  {
    id: 'e8888888-8888-8888-8888-888888888888',
    fullName: 'Meera Pillai',
    email: 'meera.pillai@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
  {
    id: 'e9999999-9999-9999-9999-999999999999',
    fullName: 'Vikram Singh',
    email: 'vikram.singh@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
  {
    id: 'eaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    fullName: 'Divya Kapoor',
    email: 'divya.kapoor@techviista.net',
    role: 'EMPLOYEE',
    active: true,
  },
];

// October 2026 Historical Records for Ananya Sharma (Matches UI Page 7, 10, 12 exactly!)
export const MOCK_HISTORY_RECORDS = [
  {
    id: 'rec-2026-10-21',
    workDate: '2026-10-21',
    checkInAt: '2026-10-21T09:54:00+05:30',
    checkOutAt: '2026-10-21T17:03:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 429,
    breakMinutes: 53,
    netWorkMinutes: 376,
    breaks: [
      { id: 'b1', startedAt: '2026-10-21T13:00:00+05:30', endedAt: '2026-10-21T13:53:00+05:30', durationMinutes: 53 }
    ]
  },
  {
    id: 'rec-2026-10-20',
    workDate: '2026-10-20',
    checkInAt: '2026-10-20T10:01:00+05:30',
    checkOutAt: '2026-10-20T17:08:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 427,
    breakMinutes: 58,
    netWorkMinutes: 369,
    breaks: [
      { id: 'b2', startedAt: '2026-10-20T13:10:00+05:30', endedAt: '2026-10-20T14:08:00+05:30', durationMinutes: 58 }
    ]
  },
  {
    id: 'rec-2026-10-19',
    workDate: '2026-10-19',
    checkInAt: '2026-10-19T09:58:00+05:30',
    checkOutAt: '2026-10-19T17:15:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 437,
    breakMinutes: 50,
    netWorkMinutes: 387,
    breaks: [
      { id: 'b3', startedAt: '2026-10-19T13:05:00+05:30', endedAt: '2026-10-19T13:55:00+05:30', durationMinutes: 50 }
    ]
  },
  {
    id: 'rec-2026-10-16',
    workDate: '2026-10-16',
    checkInAt: '2026-10-16T09:49:00+05:30',
    checkOutAt: '2026-10-16T16:45:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 416,
    breakMinutes: 50,
    netWorkMinutes: 366,
    breaks: [
      { id: 'b4', startedAt: '2026-10-16T12:45:00+05:30', endedAt: '2026-10-16T13:35:00+05:30', durationMinutes: 50 }
    ]
  },
  {
    id: 'rec-2026-10-15',
    workDate: '2026-10-15',
    checkInAt: '2026-10-15T09:53:00+05:30',
    checkOutAt: '2026-10-15T17:04:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 431,
    breakMinutes: 54,
    netWorkMinutes: 377,
    breaks: [
      { id: 'b5', startedAt: '2026-10-15T13:00:00+05:30', endedAt: '2026-10-15T13:54:00+05:30', durationMinutes: 54 }
    ]
  },
  {
    id: 'rec-2026-10-14',
    workDate: '2026-10-14',
    checkInAt: '2026-10-14T09:50:00+05:30',
    checkOutAt: null,
    status: 'INCOMPLETE',
    elapsedMinutes: 0,
    breakMinutes: 52,
    netWorkMinutes: 0,
    breaks: [
      { id: 'b6', startedAt: '2026-10-14T13:00:00+05:30', endedAt: '2026-10-14T13:52:00+05:30', durationMinutes: 52 }
    ]
  },
  {
    id: 'rec-2026-10-13',
    workDate: '2026-10-13',
    checkInAt: '2026-10-13T10:12:00+05:30',
    checkOutAt: '2026-10-13T17:25:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 433,
    breakMinutes: 50,
    netWorkMinutes: 383,
    breaks: [
      { id: 'b7', startedAt: '2026-10-13T13:15:00+05:30', endedAt: '2026-10-13T14:05:00+05:30', durationMinutes: 50 }
    ]
  },
  {
    id: 'rec-2026-10-12',
    workDate: '2026-10-12',
    checkInAt: '2026-10-12T09:59:00+05:30',
    checkOutAt: '2026-10-12T17:10:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 431,
    breakMinutes: 55,
    netWorkMinutes: 376,
    breaks: [
      { id: 'b8', startedAt: '2026-10-12T13:00:00+05:30', endedAt: '2026-10-12T13:55:00+05:30', durationMinutes: 55 }
    ]
  },
  {
    id: 'rec-2026-10-09',
    workDate: '2026-10-09',
    checkInAt: '2026-10-09T09:46:00+05:30',
    checkOutAt: '2026-10-09T17:02:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 436,
    breakMinutes: 48,
    netWorkMinutes: 388,
    breaks: [
      { id: 'b9', startedAt: '2026-10-09T12:50:00+05:30', endedAt: '2026-10-09T13:38:00+05:30', durationMinutes: 48 }
    ]
  },
  {
    id: 'rec-2026-10-08',
    workDate: '2026-10-08',
    checkInAt: '2026-10-08T09:55:00+05:30',
    checkOutAt: '2026-10-08T17:31:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 456,
    breakMinutes: 75,
    netWorkMinutes: 381,
    breaks: [
      { id: 'b10', startedAt: '2026-10-08T13:00:00+05:30', endedAt: '2026-10-08T14:15:00+05:30', durationMinutes: 75 }
    ]
  },
  {
    id: 'rec-2026-10-07',
    workDate: '2026-10-07',
    checkInAt: '2026-10-07T09:51:00+05:30',
    checkOutAt: '2026-10-07T16:58:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 427,
    breakMinutes: 52,
    netWorkMinutes: 375,
    breaks: [
      { id: 'b11', startedAt: '2026-10-07T13:00:00+05:30', endedAt: '2026-10-07T13:52:00+05:30', durationMinutes: 52 }
    ]
  },
  {
    id: 'rec-2026-10-06',
    workDate: '2026-10-06',
    checkInAt: '2026-10-06T10:04:00+05:30',
    checkOutAt: '2026-10-06T17:20:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 436,
    breakMinutes: 50,
    netWorkMinutes: 386,
    breaks: [
      { id: 'b12', startedAt: '2026-10-06T13:10:00+05:30', endedAt: '2026-10-06T14:00:00+05:30', durationMinutes: 50 }
    ]
  },
  {
    id: 'rec-2026-10-05',
    workDate: '2026-10-05',
    checkInAt: '2026-10-05T09:57:00+05:30',
    checkOutAt: '2026-10-05T17:12:00+05:30',
    status: 'COMPLETED',
    elapsedMinutes: 435,
    breakMinutes: 52,
    netWorkMinutes: 383,
    breaks: [
      { id: 'b13', startedAt: '2026-10-05T13:00:00+05:30', endedAt: '2026-10-05T13:52:00+05:30', durationMinutes: 52 }
    ]
  },
];

// Team View for Today (Matches UI Page 13 exactly!)
export const MOCK_TEAM_TODAY = {
  date: '2026-10-22',
  totalEmployees: 10,
  workingCount: 5,
  onBreakCount: 2,
  checkedOutCount: 1,
  notCheckedInCount: 2,
  incompleteCount: 1,
  overBreakCount: 1,
  members: [
    {
      employeeId: 'e1111111-1111-1111-1111-111111111111',
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: 'att-1',
      status: 'WORKING',
      checkInAt: '2026-10-22T09:52:00+05:30',
      checkOutAt: null,
      breakCount: 1,
      totalBreakMinutes: 53,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: false,
      netWorkMinutes: 227,
      netWorkFormatted: '3h 47m',
      breaks: [{ id: 'tb1', startedAt: '2026-10-22T13:05:00+05:30', endedAt: '2026-10-22T13:58:00+05:30', durationMinutes: 53 }]
    },
    {
      employeeId: 'e3333333-3333-3333-3333-333333333333',
      fullName: 'Rohit Verma',
      email: 'rohit.verma@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: 'att-2',
      status: 'WORKING',
      checkInAt: '2026-10-22T09:41:00+05:30',
      checkOutAt: null,
      breakCount: 1,
      totalBreakMinutes: 72,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: true,
      netWorkMinutes: 219,
      netWorkFormatted: '3h 39m',
      breaks: [{ id: 'tb2', startedAt: '2026-10-22T12:45:00+05:30', endedAt: '2026-10-22T13:57:00+05:30', durationMinutes: 72 }]
    },
    {
      employeeId: 'e4444444-4444-4444-4444-444444444444',
      fullName: 'Priya Nair',
      email: 'priya.nair@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: 'att-3',
      status: 'ON_BREAK',
      checkInAt: '2026-10-22T10:05:00+05:30',
      checkOutAt: null,
      breakCount: 1,
      totalBreakMinutes: 18,
      hasActiveBreak: true,
      activeBreakMinutes: 18,
      breakOverOneHour: false,
      netWorkMinutes: 249,
      netWorkFormatted: '4h 09m',
      breaks: [{ id: 'tb3', startedAt: '2026-10-22T14:14:00+05:30', endedAt: null, durationMinutes: 18 }]
    },
    {
      employeeId: 'e5555555-5555-5555-5555-555555555555',
      fullName: 'Karan Mehta',
      email: 'karan.mehta@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: 'att-4',
      status: 'WORKING',
      checkInAt: '2026-10-22T09:58:00+05:30',
      checkOutAt: null,
      breakCount: 1,
      totalBreakMinutes: 50,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: false,
      netWorkMinutes: 224,
      netWorkFormatted: '3h 44m',
      breaks: [{ id: 'tb4', startedAt: '2026-10-22T13:00:00+05:30', endedAt: '2026-10-22T13:50:00+05:30', durationMinutes: 50 }]
    },
    {
      employeeId: 'e6666666-6666-6666-6666-666666666666',
      fullName: 'Sneha Iyer',
      email: 'sneha.iyer@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: 'att-5',
      status: 'WORKING',
      checkInAt: '2026-10-22T09:36:00+05:30',
      checkOutAt: null,
      breakCount: 1,
      totalBreakMinutes: 45,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: false,
      netWorkMinutes: 251,
      netWorkFormatted: '4h 11m',
      breaks: [{ id: 'tb5', startedAt: '2026-10-22T12:45:00+05:30', endedAt: '2026-10-22T13:30:00+05:30', durationMinutes: 45 }]
    },
    {
      employeeId: 'e7777777-7777-7777-7777-777777777777',
      fullName: 'Arjun Reddy',
      email: 'arjun.reddy@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: 'att-6',
      status: 'ON_BREAK',
      checkInAt: '2026-10-22T10:20:00+05:30',
      checkOutAt: null,
      breakCount: 1,
      totalBreakMinutes: 6,
      hasActiveBreak: true,
      activeBreakMinutes: 6,
      breakOverOneHour: false,
      netWorkMinutes: 246,
      netWorkFormatted: '4h 06m',
      breaks: [{ id: 'tb6', startedAt: '2026-10-22T14:26:00+05:30', endedAt: null, durationMinutes: 6 }]
    },
    {
      employeeId: 'e8888888-8888-8888-8888-888888888888',
      fullName: 'Meera Pillai',
      email: 'meera.pillai@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: null,
      status: 'NOT_CHECKED_IN',
      checkInAt: null,
      checkOutAt: null,
      breakCount: 0,
      totalBreakMinutes: 0,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: false,
      netWorkMinutes: 0,
      netWorkFormatted: '—',
      breaks: []
    },
    {
      employeeId: 'e9999999-9999-9999-9999-999999999999',
      fullName: 'Vikram Singh',
      email: 'vikram.singh@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: 'att-7',
      status: 'WORKING',
      checkInAt: '2026-10-22T09:47:00+05:30',
      checkOutAt: null,
      breakCount: 1,
      totalBreakMinutes: 55,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: false,
      netWorkMinutes: 230,
      netWorkFormatted: '3h 50m',
      breaks: [{ id: 'tb7', startedAt: '2026-10-22T13:00:00+05:30', endedAt: '2026-10-22T13:55:00+05:30', durationMinutes: 55 }]
    },
    {
      employeeId: 'eaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      fullName: 'Divya Kapoor',
      email: 'divya.kapoor@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: 'att-8',
      status: 'COMPLETED',
      checkInAt: '2026-10-22T08:58:00+05:30',
      checkOutAt: '2026-10-22T13:30:00+05:30',
      breakCount: 1,
      totalBreakMinutes: 40,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: false,
      netWorkMinutes: 232,
      netWorkFormatted: '3h 52m',
      breaks: [{ id: 'tb8', startedAt: '2026-10-22T11:00:00+05:30', endedAt: '2026-10-22T11:40:00+05:30', durationMinutes: 40 }]
    },
    {
      employeeId: 'ebbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      fullName: 'Aditya Rao',
      email: 'aditya.rao@techviista.net',
      role: 'EMPLOYEE',
      attendanceId: null,
      status: 'NOT_CHECKED_IN',
      checkInAt: null,
      checkOutAt: null,
      breakCount: 0,
      totalBreakMinutes: 0,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: false,
      netWorkMinutes: 0,
      netWorkFormatted: '—',
      breaks: []
    }
  ]
};

// Yearly Overview (Matches UI Page 11 exactly!)
export const MOCK_YEARLY_OVERVIEW = {
  totalDaysRecorded: 196,
  completeDays: 186,
  incompleteDays: 10,
  totalNetWorkHours: '1,148h',
  averageNetPerDay: '6h 10m',
  monthlySummaries: [
    { monthName: 'Oct 2026 (to date)', recordedDays: 14, incompleteDays: 1, netWorkHours: '82h', averagePerDay: '6h 19m' },
    { monthName: 'Sep 2026', recordedDays: 21, incompleteDays: 1, netWorkHours: '123h', averagePerDay: '6h 09m' },
    { monthName: 'Aug 2026', recordedDays: 19, incompleteDays: 0, netWorkHours: '117h', averagePerDay: '6h 10m' },
    { monthName: 'Jul 2026', recordedDays: 21, incompleteDays: 0, netWorkHours: '135h', averagePerDay: '6h 26m' },
    { monthName: 'Jun 2026', recordedDays: 19, incompleteDays: 2, netWorkHours: '105h', averagePerDay: '6h 09m' },
    { monthName: 'May 2026', recordedDays: 21, incompleteDays: 1, netWorkHours: '117h', averagePerDay: '5h 52m' },
    { monthName: 'Apr 2026', recordedDays: 21, incompleteDays: 0, netWorkHours: '129h', averagePerDay: '6h 09m' },
    { monthName: 'Mar 2026', recordedDays: 20, incompleteDays: 1, netWorkHours: '111h', averagePerDay: '5h 48m' },
    { monthName: 'Feb 2026', recordedDays: 19, incompleteDays: 2, netWorkHours: '105h', averagePerDay: '5h 51m' },
    { monthName: 'Jan 2026', recordedDays: 21, incompleteDays: 2, netWorkHours: '124h', averagePerDay: '6h 02m' },
  ]
};

// Sales Spreadsheet Engagement (Google Sheets / Excel Proof of Work)
export const MOCK_ENGAGEMENT_TODAY = {
  employeeId: 'e1111111-1111-1111-1111-111111111111',
  employeeName: 'Ananya Sharma',
  employeeEmail: 'ananya.sharma@techviista.net',
  workDate: '2026-10-22',
  totalShiftMinutes: 280,
  activeSpreadsheetMinutes: 240,
  engagementPercentage: 85.7,
  totalEditsCount: 68,
  lastActiveAt: '2026-10-22T14:15:00+05:30',
  activeWorkbook: 'Q4_Enterprise_Sales_Pipeline.xlsx',
  verificationLevel: 'HIGH',
  isSuspicious: false,
  recentActivitySnippets: [
    'CELL_EDIT on Q4_Enterprise_Sales_Pipeline.xlsx (Deals!F18) at 02:15 PM',
    'ROW_INSERT on Q4_Enterprise_Sales_Pipeline.xlsx (Leads!A42) at 02:08 PM',
    'CELL_EDIT on Q4_Enterprise_Sales_Pipeline.xlsx (Deals!D18) at 01:52 PM',
    'CELL_EDIT on Outreach_Tracker_Oct.xlsx (Contacts!C11) at 12:44 PM',
    'CELL_EDIT on Outreach_Tracker_Oct.xlsx (Contacts!B11) at 12:39 PM'
  ]
};

export const MOCK_TEAM_ENGAGEMENT = [
  {
    employeeId: 'e1111111-1111-1111-1111-111111111111',
    employeeName: 'Ananya Sharma',
    employeeEmail: 'ananya.sharma@techviista.net',
    totalShiftMinutes: 280,
    activeSpreadsheetMinutes: 240,
    engagementPercentage: 85.7,
    totalEditsCount: 68,
    activeWorkbook: 'Q4_Enterprise_Sales_Pipeline.xlsx',
    verificationLevel: 'HIGH',
    isSuspicious: false
  },
  {
    employeeId: 'e3333333-3333-3333-3333-333333333333',
    employeeName: 'Rohit Verma',
    employeeEmail: 'rohit.verma@techviista.net',
    totalShiftMinutes: 290,
    activeSpreadsheetMinutes: 230,
    engagementPercentage: 79.3,
    totalEditsCount: 54,
    activeWorkbook: 'SaaS_Prospects_NorthAmerica.xlsx',
    verificationLevel: 'HIGH',
    isSuspicious: false
  },
  {
    employeeId: 'e4444444-4444-4444-4444-444444444444',
    employeeName: 'Priya Nair',
    employeeEmail: 'priya.nair@techviista.net',
    totalShiftMinutes: 260,
    activeSpreadsheetMinutes: 190,
    engagementPercentage: 73.1,
    totalEditsCount: 42,
    activeWorkbook: 'Lead_Nurturing_Sequence.xlsx',
    verificationLevel: 'HIGH',
    isSuspicious: false
  },
  {
    employeeId: 'e5555555-5555-5555-5555-555555555555',
    employeeName: 'Karan Mehta',
    employeeEmail: 'karan.mehta@techviista.net',
    totalShiftMinutes: 270,
    activeSpreadsheetMinutes: 110,
    engagementPercentage: 40.7,
    totalEditsCount: 19,
    activeWorkbook: 'Q4_Direct_Sales.xlsx',
    verificationLevel: 'MODERATE',
    isSuspicious: false
  },
  {
    employeeId: 'e6666666-6666-6666-6666-666666666666',
    employeeName: 'Sneha Iyer',
    employeeEmail: 'sneha.iyer@techviista.net',
    totalShiftMinutes: 295,
    activeSpreadsheetMinutes: 260,
    engagementPercentage: 88.1,
    totalEditsCount: 77,
    activeWorkbook: 'Key_Accounts_Renewal_Tracker.xlsx',
    verificationLevel: 'HIGH',
    isSuspicious: false
  },
  {
    employeeId: 'e7777777-7777-7777-7777-777777777777',
    employeeName: 'Arjun Reddy',
    employeeEmail: 'arjun.reddy@techviista.net',
    totalShiftMinutes: 250,
    activeSpreadsheetMinutes: 40,
    engagementPercentage: 16.0,
    totalEditsCount: 5,
    activeWorkbook: 'Cold_Calls_Campaign.xlsx',
    verificationLevel: 'LOW',
    isSuspicious: true
  }
];



# Attendance Management System — Web Frontend

The client single-page application (SPA) for the **Workforce Attendance Engine**, developed strictly according to the **Product Requirements Document (PRD v1.0)** and the **UI/UX Design Proposal** by **Eduqynt Techviista Pvt. Ltd.**

---

## 🎨 Visual Design & Style System

The UI follows the specified warm neutral design system:
- **Palette**:
  - `Charcoal (#1F1B18)`: Primary text, navigation sidebar, card borders.
  - `Stone (#6B625A)`: Subdued metadata, table labels.
  - `Warm White (#F7F3EE)`: Page background.
  - `Surface (#FFFEFC)`: Card and modal backgrounds.
  - `Coral (#D9502A)`: Primary user actions (Check In, Check Out, Continue with Google).
  - `Emerald (#1D8350)`: Working status, complete check-out badges.
  - `Amber (#EFA537)`: Break state, pause indicator, break allowance warning.
  - `Rose (#BF3A4C)`: Incomplete missing punches, errors.
- **Typography**: Plus Jakarta Sans with tabular numbers (`tnum`) for all times, dates, and durations.
- **Components**: 8px border radius on controls, 12px on cards, soft shadows.

---

## 📱 Implemented Screens & Features

1. **Sign-In Screen (`/login`)**:
   - Primary `Continue with Google` action.
   - Optional email/password sign-in form with remember-me toggle and show/hide password.
   - Brand visual panel showing *"A typical day"* timeline.
   - Error banners for *Account Not Linked* cases.
   - Quick one-click test account switcher (`Ananya Sharma - Employee`, `Rahul Khanna - Manager`).
2. **Employee Dashboard (`Today`)**:
   - 4 reactive state panels:
     - **Before check-in**: Clock display, schedule target (`10:00–17:00`), large coral check-in button.
     - **Checked in / Working**: Live ticking work timer, elapsed work counter, break summary, *Start break* and *Check out* actions.
     - **On break**: Live ticking break timer, 1-hour break allowance progress bar with warning note if exceeded, *End break & resume work* action.
     - **Checked out**: Final net work summary, *Day closed* indicator.
   - Day timeline visualizer (09:00 to 18:00) with color blocks for work, breaks, target hours, and current time pin.
   - *Today's Log* chronological sidebar.
   - *October so far* 10-day mini bar chart and KPI summary.
   - Check-out confirmation modal.
3. **My Attendance (`History`)**:
   - 6 KPI summary cards: Days recorded, Complete days, Incomplete days, Net work, Avg net/day, Break time.
   - Month navigator (`< October 2026 >`) and CSV report export.
   - Interactive monthly calendar with color-coded day cells.
   - Records table with filter chips (`All`, `Complete`, `Incomplete`, `Break over 1h`).
   - Detailed slide-over drawer with event breakdown and audit footnote.
4. **Manager View (`Team Attendance`)**:
   - Real-time status cards: Working, On break, Checked out, Not checked in, Needs review.
   - Filter chips and employee search.
   - Live roster table showing check-in time, break count/duration, and net working minutes.
   - Employee provisioning modal (`POST /api/v1/admin/employees`).
5. **Yearly Overview (`Analytics`)**:
   - Long-term attendance patterns across the year.
   - Net work hours by month bar chart.
   - Monthly summary data table.
   - 52-week x 7-day GitHub-style daily pattern heatmap.

---

## 🚀 Running the Frontend

### 1. Development Mode (with hot-module reloading):
```bash
npm install
npm run dev
```
The application will launch on `http://localhost:3000` and automatically proxy API requests to the backend on `http://localhost:8080`.

### 2. Production Build:
```bash
npm run build
```
Generates optimized static assets in the `dist/` directory.

<div align="center">

# Workforce Attendance Engine

**An enterprise-grade, event-driven Attendance & Workforce Proof-of-Work Platform**  
*Developed & Maintained by **Eduqynt Techviista Pvt. Ltd.***

[![Java 17](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-CC0202?style=for-the-badge&logo=flyway&logoColor=white)](https://flywaydb.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)](https://kafka.apache.org/)
[![Vitest](https://img.shields.io/badge/Vitest-16%20Passed-FCC72B?style=for-the-badge&logo=vitest&logoColor=black)](https://vitest.dev/)
[![JUnit 5](https://img.shields.io/badge/JUnit_5-71%20Passed-25A162?style=for-the-badge&logo=junit5&logoColor=white)](https://junit.org/junit5/)

</div>

---

## 📌 Executive Overview

**Workforce Attendance Engine** is a high-throughput, mission-critical workforce attendance and productivity tracking platform engineered for modern enterprises, distributed sales teams, and academic organizations. 

Built with strict data integrity, auditability, and scalability at its core, the platform combines real-time attendance lifecycle state machines with live spreadsheet proof-of-work telemetry to eliminate time theft, unverified work claims, and manual auditing overhead.

### 🌟 Key Capabilities
- **4-State Real-Time Shift Lifecycle Engine:** Server-authoritative transitions across `NOT_CHECKED_IN`, `WORKING`, `ON_BREAK`, and `COMPLETED` (with automatic `INCOMPLETE` detection).
- **Zero Client Dependency Timestamping:** Elapsed shift time and net working minutes are computed dynamically on the server (`CURRENT_TIMESTAMP - check_in_at - breaks`). Employees can close their browser or shut down their workstation without losing track of their shift.
- **Enterprise Single Sign-On (Google OAuth2 + Stateless JWT):** Native Google OAuth2 OpenID Connect integration configured with `prompt=select_account` to allow multi-account switching, paired with high-performance HMAC-SHA256 JWT tokens.
- **Strict Role-Based Access Control (RBAC):** Authorized gatekeeping managed by CTO / Lead Manager **Mayank Verma** (`techviista53@gmail.com`). Unregistered users are barred from self-registration and must be provisioned by the manager.
- **Sales Spreadsheet Proof-of-Work Telemetry:** Direct webhook telemetry (`/api/v1/activity/pulse`) from Google Sheets (via Google Apps Script) and Microsoft Excel. Real-time logging of cell ranges, active sheet names, and timestamps.
- **Automated 2-Hour Inactivity Alerts via Kafka:** Background scheduled scanner continuously cross-references active `WORKING` shifts against spreadsheet telemetry, triggering automated manager alerts when an employee goes inactive for $\ge 2$ hours.
- **LeetCode-Style 52-Week Activity Heatmap & Analytics:** Annual overview displaying a 52-week activity matrix, 120-hour monthly target progress bar, and real-time database projections.
- **Enterprise-Grade Distributed Infrastructure:** Distributed token-bucket rate limiting via Bucket4j and Redis 7, asynchronous event streaming through Apache Kafka, and automated database migrations managed by Flyway.

---

## 🏛️ Security & Authority Model

### 1. Centralized Authority & Manager Role
The system implements a zero-trust, invitation-only access structure:
- **Primary CTO / Manager Authority:** `Mayank Verma` (`techviista53@gmail.com`) is seeded into the database on initial deployment (`V4__seed_initial_manager.sql`).
- **Exclusive Manager Access:** Only the authorized manager can view team-wide attendance records, inspect real-time sales spreadsheet telemetry, review inactivity alerts, and provision new employee accounts.
- **Restricted Employee Onboarding:** Open user registration is disabled. When an unknown user signs in via Google OAuth2, the authentication pipeline rejects the session and presents an **"Authorization Required"** gate directing them to contact the CTO. Once provisioned by the manager, the employee gains immediate access.

### 2. Multi-Account Google OAuth2 Flow
To prevent browser session lockouts when switching between personal and corporate Google accounts:
- The Spring Security OAuth2 authorization endpoint injects `prompt=select_account`.
- The user is always presented with Google's account chooser, ensuring seamless authentication with their designated corporate email.

---

## 🏗️ Repository Architecture

This repository adopts a modular monorepo structure separating the Spring Boot 4.x backend from the Vite/React frontend:

```text
workforce-attendance-engine/
├── backend/                                   # Spring Boot REST API & Business Logic
│   ├── .mvn/wrapper/                          # Maven Wrapper configuration (v3.9.9)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/techviista/attendance/
│   │   │   │   ├── activity/                  # Spreadsheet proof-of-work telemetry
│   │   │   │   │   ├── ActivityController.java# Pulse & team activity REST endpoints
│   │   │   │   │   ├── ActivityLog.java       # Activity entity (cell edits, workbooks)
│   │   │   │   │   ├── ActivityLogRepository.java
│   │   │   │   │   ├── ActivityPulseRequest.java
│   │   │   │   │   └── ActivityService.java   # Telemetry aggregation & logging
│   │   │   │   ├── admin/                     # Manager administrative portal
│   │   │   │   │   ├── AdminController.java   # Provisioning & team oversight
│   │   │   │   │   ├── AdminService.java
│   │   │   │   │   └── CreateEmployeeRequest.java
│   │   │   │   ├── alerts/                    # 2-hour inactivity alert engine
│   │   │   │   │   ├── InactivityAlert.java   # Alert log entity
│   │   │   │   │   ├── InactivityAlertRepository.java
│   │   │   │   │   └── InactivityScannerService.java # Scheduled Kafka alert scanner
│   │   │   │   ├── analytics/                 # Aggregated metrics & heatmap
│   │   │   │   │   ├── AnalyticsController.java # Yearly overview endpoint
│   │   │   │   │   ├── AnalyticsService.java  # 52-week & monthly SQL aggregations
│   │   │   │   │   └── YearlyOverviewDTO.java
│   │   │   │   ├── attendance/                # Core attendance state engine
│   │   │   │   │   ├── dto/                   # Response DTOs & projections
│   │   │   │   │   ├── service/               # State machine & time calculation
│   │   │   │   │   ├── Attendance.java        # Shift session entity
│   │   │   │   │   ├── AttendanceStatus.java  # NOT_CHECKED_IN, WORKING, ON_BREAK, COMPLETED
│   │   │   │   │   └── BreakSession.java      # Granular break tracking entity
│   │   │   │   ├── auth/                      # Authentication & Google OAuth2
│   │   │   │   │   ├── AuthController.java    # /api/v1/auth/me session check
│   │   │   │   │   └── OAuth2LoginSuccessHandler.java # JWT generation on Google SSO
│   │   │   │   ├── common/                    # Global exception handling & error DTOs
│   │   │   │   ├── config/                    # Security, JWT & CORS configuration
│   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   ├── JwtService.java
│   │   │   │   │   ├── SecurityConfig.java    # Stateless OAuth2 & JWT filter chain
│   │   │   │   │   └── WebMvcConfig.java
│   │   │   │   ├── employee/                  # Employee domain models & roles
│   │   │   │   ├── events/                    # Apache Kafka event producers & consumers
│   │   │   │   ├── ratelimit/                 # Distributed Redis + Bucket4j rate limiter
│   │   │   │   └── AttendanceApplication.java # Spring Boot application entry point
│   │   │   └── resources/
│   │   │       ├── application.yml            # Parameterized runtime configuration
│   │   │       └── db/migration/              # Flyway SQL schema versions
│   │   │           ├── V1__init_schema.sql
│   │   │           ├── V2__add_activity_logs.sql
│   │   │           ├── V3__add_inactivity_alerts.sql
│   │   │           └── V4__seed_initial_manager.sql
│   │   └── test/java/com/techviista/attendance/ # 71 automated unit & integration tests
│   ├── .env.example                           # Backend environment template
│   ├── pom.xml                                # Maven build specifications
│   └── mvnw & mvnw.cmd
├── frontend/                                  # React 18 / Vite Client Application
│   ├── src/
│   │   ├── components/                        # Reusable UI widgets & navigation
│   │   ├── context/
│   │   │   └── AuthContext.jsx                # JWT persistence & role authorization
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx                  # Google SSO & access restriction card
│   │   │   ├── TodayDashboardPage.jsx         # 4-state reactive shift control panel
│   │   │   ├── MyAttendancePage.jsx           # Shift records, calendar & detail drawer
│   │   │   ├── YearlyOverviewPage.jsx         # LeetCode 52-week heatmap & histogram
│   │   │   └── ManagerDashboardPage.jsx       # Employee provisioning & live telemetry
│   │   ├── __tests__/                         # 16 Vitest unit & integration tests
│   │   └── App.jsx                            # React Router role-protected routing
│   ├── package.json
│   └── vite.config.js                         # Port 3000 & reverse proxy config
├── docker-compose.yml                         # Redis 7 & Kafka multi-container setup
├── .gitignore
└── README.md
```

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required | Success |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile and permissions | Bearer JWT | `200 OK` |
| `GET` | `/oauth2/authorization/google` | Trigger Google OAuth2 OpenID Connect authorization | Public | `302 Found` |

### 2. Shift Lifecycle Engine (`/api/v1/attendance`)

| Method | Endpoint | Description | Success | Error Scenarios |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/check-in` | Clock in for daily shift; emits Kafka event | `200 OK` | `400` (Unknown employee)<br>`409` (Already checked in today) |
| `POST` | `/breaks/start` | Start an active break session | `200 OK` | `409` (Not working, already on break, or no active shift) |
| `POST` | `/breaks/end` | End current break and resume shift | `200 OK` | `409` (Not on break, or no open break session) |
| `POST` | `/check-out` | Clock out and finalize daily shift | `200 OK` | `409` (Already clocked out, or break still active) |
| `GET` | `/today` | Retrieve today's shift state and dynamic durations | `200 OK` | `404` (No record found for today) |
| `GET` | `/history` | Fetch complete historical attendance logs | `200 OK` | `401` (Unauthorized) |

### 3. Sales Spreadsheet Proof-of-Work Telemetry (`/api/v1/activity`)

| Method | Endpoint | Description | Auth Required | Success |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/pulse` | Ingest live cell edit telemetry from Google Sheets / Excel | Bearer JWT / Key | `200 OK` |
| `GET` | `/today` | Fetch today's telemetry timeline for authenticated employee | Bearer JWT | `200 OK` |
| `GET` | `/team` | Fetch team-wide telemetry summary and engagement metrics | MANAGER / ADMIN | `200 OK` |

### 4. Administrative Operations (`/api/v1/admin`)

*Restricted exclusively to users with role `MANAGER` or `ADMIN`.*

| Method | Endpoint | Description | Success | Error Scenarios |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/employees` | Provision a new employee email and role | `200 OK` | `403` (Forbidden)<br>`409` (Email already registered) |
| `GET` | `/attendance/today` | Fetch team-wide real-time attendance matrix | `200 OK` | `403` (Forbidden) |
| `GET` | `/activity/today` | Fetch team-wide spreadsheet proof-of-work telemetry | `200 OK` | `403` (Forbidden) |

### 5. Analytics & Aggregations (`/api/v1/analytics`)

| Method | Endpoint | Description | Success | Error Scenarios |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/yearly-overview` | 52-week activity heatmap & monthly hours (`?year=YYYY`) | `200 OK` | `401` (Unauthorized) |

---

## 📊 Sales Spreadsheet Proof-of-Work Integration

The platform provides a non-invasive, tamper-proof mechanism to verify active work on Google Spreadsheets without requiring desktop screen monitoring or keylogging software.

```
┌─────────────────────────┐          ┌─────────────────────────┐          ┌─────────────────────────┐
│ Google Sheets / Excel   │          │ Spring Boot Engine      │          │ Manager Real-Time Feed  │
│ (Sales Lead Tracking)   │─────────>│ (/api/v1/activity/pulse)│─────────>│ (Engagement %, Edits,   │
│ User makes cell edits   │  HTTPS   │ Persists to DB & Kafka  │ Webhook  │ Inactivity Scanner)     │
└─────────────────────────┘          └─────────────────────────┘          └─────────────────────────┘
```

### Google Apps Script Integration
To stream edits from your corporate Google Sheet:
1. In Google Sheets, navigate to **Extensions > Apps Script**.
2. Paste the following production script:

```javascript
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var userEmail = Session.getActiveUser().getEmail();
  
  var payload = {
    employeeEmail: userEmail,
    workbookName: e.source.getName(),
    sheetName: sheet.getName(),
    cellRange: range.getA1Notation(),
    activityType: "CELL_EDIT",
    details: "Edited " + range.getA1Notation() + " in sheet '" + sheet.getName() + "'",
    timestamp: new Date().toISOString()
  };
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  // Replace with your production domain
  UrlFetchApp.fetch("https://your-domain.com/api/v1/activity/pulse", options);
}
```
3. Save and set an installable trigger for `On Edit`.

### Automated 2-Hour Inactivity Detection
The `InactivityScannerService` executes a scheduled task every 15 minutes:
- Queries all employees whose current shift status is `WORKING`.
- Checks `activity_logs` for the latest telemetry timestamp.
- If $(\text{currentTime} - \text{lastActivityTimestamp}) \ge 2\text{ hours}$ (and no active break is registered), an automated `InactivityAlert` is recorded and dispatched to the manager.

---

## 🚀 Local Development Setup

### Prerequisites
- **JDK:** Version 17+ (LTS)
- **Node.js:** Version 18+ & npm
- **Database:** PostgreSQL 14+ (default: `localhost:5433` or `5432`)
- **Cache:** Redis 7+
- **Event Streaming:** Apache Kafka (optional for local standalone mode)
- **Build Tool:** Apache Maven 3.9+ (or bundled `./mvnw`)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/VaibhavSharmaggwp/workforce-attendance-engine.git
cd workforce-attendance-engine
```

---

### Step 2: Environment Configuration

Create `.env` inside `backend/`:
```bash
# backend/.env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/ams_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_postgres_password

SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379

SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret (minimum 256 bits)
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000

# CORS / Frontend URL
APP_FRONTEND_URL=http://localhost:3000
```

Create `.env` inside `frontend/`:
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8080
```

---

### Step 3: Start Infrastructure Services
Start Redis and Kafka using Docker Compose:
```bash
docker compose up -d redis
```

---

### Step 4: Run Database Migrations & Start Backend
Flyway executes automatically on application startup.

```bash
cd backend

# Compile and run test suite
.\mvnw.cmd test

# Run the Spring Boot application
.\mvnw.cmd spring-boot:run
```
*Backend runs on `http://localhost:8080`.*

---

### Step 5: Start the React Frontend
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Run frontend tests
npm test -- --run

# Launch Vite dev server
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🧪 Automated Testing & Verification

The codebase maintains complete automated test coverage across both backend and frontend layers:

### Backend Suite: 71 Tests Passing (JUnit 5 / MockMvc / Spring Security)
```bash
cd backend
.\mvnw.cmd test
```
- `AttendanceServiceTest` (14 tests): State transitions, duration calculations, break validation, conflict detection.
- `AttendanceControllerTest` (11 tests): Web layer validation, response envelopes, HTTP status assertions.
- `ActivityControllerTest` & `ActivityServiceTest` (12 tests): Telemetry ingest, pulse validation, team activity queries.
- `InactivityScannerServiceTest` (6 tests): 2-hour inactivity evaluation, duplicate alert suppression, alert dispatching.
- `AnalyticsServiceTest` (6 tests): SQL aggregation projections, monthly hour sums, heatmap generation.
- `AdminServiceTest` (5 tests): Employee provisioning, unique email constraints, role validation.
- `JwtAuthenticationFilterTest`, `JwtServiceTest`, `JwtSecurityIntegrationTest` (14 tests): Stateless authentication, token expiration, authorization rejection.
- `AuthControllerTest` (3 tests): Session verification and profile retrieval.

### Frontend Suite: 16 Tests Passing (Vitest / React Testing Library)
```bash
cd frontend
npm test -- --run
```
- `TodayDashboardPage.test.jsx` (4 tests): 4 reactive shift states, clock in/out workflows, duration live timers.
- `MyAttendancePage.test.jsx` (3 tests): KPI summary cards, calendar view, record filtering by status chip.
- `SalesSpreadsheetActivity.test.jsx` (5 tests): Engagement metrics, Google Apps Script integration modal, manager provisioning.
- `YearlyOverviewPage.test.jsx` (4 tests): 52-week LeetCode activity matrix, 120h target histogram, year dropdown switching.

---

## 🚢 Production Deployment Guide

### Architecture Overview
In production, the application is deployed behind a reverse proxy (Nginx or Apache / CWP):
- **Frontend:** Built into static assets via `npm run build` and served directly by the web server.
- **Backend:** Packaged into an executable Spring Boot JAR and managed via systemd.
- **Database:** Managed PostgreSQL instance with Flyway migrations applied at launch.

```
                  ┌───────────────────────────────┐
                  │ Nginx / Apache Reverse Proxy  │
                  │ (Port 80 / 443 with SSL)      │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        / (Static SPA Assets)            /api/*, /oauth2/*
                 │                               │
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │  frontend/dist/       │       │ Spring Boot JAR       │
     │  (Vite Production)    │       │ (Port 8080)           │
     └───────────────────────┘       └───────────┬───────────┘
                                                 │
                                     ┌───────────┴───────────┐
                                     │                       │
                                     ▼                       ▼
                              ┌─────────────┐         ┌─────────────┐
                              │ PostgreSQL  │         │ Redis 7     │
                              │ (Port 5432) │         │ (Port 6379) │
                              └─────────────┘         └─────────────┘
```

### 1. Build Frontend Production Bundle
```bash
cd frontend
npm run build
```
The optimized production bundle is generated in `frontend/dist/`.

### 2. Package Backend Executable JAR
```bash
cd backend
.\mvnw.cmd clean package -DskipTests
```
The runnable JAR will be located at `backend/target/attendance-1.0.0.jar`.

### 3. Systemd Service Configuration (Linux / VPS)
Create `/etc/systemd/system/workforce-attendance.service`:
```ini
[Unit]
Description=Workforce Attendance Engine Backend
After=network.target postgresql.service redis.service

[Service]
User=techviis
WorkingDirectory=/var/www/workforce-attendance/backend
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -jar attendance-1.0.0.jar
Restart=always
RestartSec=10
EnvironmentFile=/var/www/workforce-attendance/backend/.env

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable workforce-attendance
sudo systemctl start workforce-attendance
```

### 4. Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name attendance.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name attendance.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/attendance.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/attendance.yourdomain.com/privkey.pem;

    root /var/www/workforce-attendance/frontend/dist;
    index index.html;

    # Static Frontend SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API & OAuth2 Backend Proxy
    location ~ ^/(api|oauth2|login/oauth2) {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🏢 Organization & Ownership

Developed and engineered with pride by **Eduqynt Techviista Pvt. Ltd.**  
All rights reserved. Designed for proprietary enterprise deployment and verified workforce operations.

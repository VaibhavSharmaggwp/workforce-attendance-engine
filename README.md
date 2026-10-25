<div align="center">

# Workforce Attendance Engine

**An enterprise-grade, event-driven Attendance & Workforce Management Platform**  
*Developed & Maintained by **Eduqynt Techviista Pvt. Ltd.***

[![Java 17](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-CC0202?style=for-the-badge&logo=flyway&logoColor=white)](https://flywaydb.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)](https://kafka.apache.org/)

</div>

---

## 📌 Executive Overview

**Workforce Attendance Engine** is a high-throughput, mission-critical workforce attendance and shift-tracking backend designed to meet the rigorous operational requirements of modern enterprises, distributed teams, and academic institutions. 

Engineered with scalability, auditability, and data integrity at its core, the platform delivers:
- **Immutable Attendance Records:** Precise clock-in, clock-out, break tracking, and session state machine validation.
- **Strict Data Validation & Audit Trail:** Dedicated audit logs tracking retroactive adjustments, supervisory overrides, and manager approvals.
- **Event-Driven Architecture:** Asynchronous event streaming via Apache Kafka for real-time notifications, downstream payroll triggers, and compliance alerts.
- **High-Performance Caching:** Distributed state caching and rate-limiting powered by Redis.
- **Automated Calculation Engine:** Real-time computation of elapsed shift time, aggregated break duration, and net working minutes.

---

## 🏗️ Repository Architecture

This repository adopts a modular monorepo structure separating the backend services from the forthcoming client application:

```text
workforce-attendance-engine/
├── backend/                  # Core Spring Boot REST API & Business Logic
│   ├── .mvn/wrapper/         # Maven Wrapper configuration (v3.9.9)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/techviista/attendance/
│   │   │   │   ├── attendance/
│   │   │   │   │   ├── dto/AttendanceResponse.java      # Response DTO with duration metrics
│   │   │   │   │   ├── service/AttendanceService.java   # Attendance lifecycle & business logic
│   │   │   │   │   ├── Attendance.java                  # Attendance entity
│   │   │   │   │   ├── AttendanceStatus.java            # WORKING, ON_BREAK, COMPLETED, INCOMPLETE
│   │   │   │   │   └── BreakSession.java                # Granular break session entity
│   │   │   │   ├── common/
│   │   │   │   │   └── GlobalExceptionHandler.java      # Centralized error mapping (400, 409)
│   │   │   │   ├── controller/
│   │   │   │   │   └── AttendanceController.java        # REST API endpoints
│   │   │   │   ├── employee/
│   │   │   │   │   ├── Employee.java                    # Employee domain model
│   │   │   │   │   └── EmployeeRole.java                # EMPLOYEE, MANAGER, ADMIN
│   │   │   │   ├── repository/                          # Spring Data JPA repositories
│   │   │   │   │   ├── AttendanceRepository.java
│   │   │   │   │   ├── BreakSessionRepository.java
│   │   │   │   │   └── EmployeeRepository.java
│   │   │   │   └── AttendanceApplication.java           # Spring Boot application entry point
│   │   │   └── resources/
│   │   │       ├── application.yml                      # Parameterized runtime configuration
│   │   │       └── db/migration/V1__init_schema.sql     # Flyway SQL schema versioning
│   │   └── test/
│   │       └── java/com/techviista/attendance/
│   │           ├── attendance/service/AttendanceServiceTest.java  # Unit tests (14 test cases)
│   │           ├── controller/AttendanceControllerTest.java        # Web layer integration tests (11 test cases)
│   │           └── AttendanceApplicationTests.java                 # Context loads test
│   ├── .env.example          # Sample environment variable definitions
│   ├── mvnw & mvnw.cmd       # Cross-platform Maven executable scripts
│   └── pom.xml               # Maven project dependencies and build plugins
├── frontend/                 # Client SPA (Dashboard & Employee Portal - Coming Soon)
│   └── README.md
├── .gitignore                # Enterprise-grade git ignore filters
└── README.md                 # Project documentation
```

---

## 📡 REST API Reference

All endpoints currently authenticate via the `X-Employee-Id` header (temporary during core development; will transition to OAuth2 session extraction in Milestone 5).

Base URL: `/api/v1/attendance`

| Method | Endpoint | Description | Success Status | Error Scenarios |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/check-in` | Start daily shift session | `200 OK` | `400` (Unknown employee)<br>`409` (Already checked in today) |
| `POST` | `/breaks/start` | Start an active break | `200 OK` | `409` (Not working, break already active, or no shift) |
| `POST` | `/breaks/end` | Resume work after break | `200 OK` | `409` (Not on break, or no active break record found) |
| `POST` | `/check-out` | End daily shift session | `200 OK` | `409` (Already checked out, or break is still active) |

### Sample Response (`AttendanceResponse`)

```json
{
  "id": "c1f7b022-7f23-424a-a236-4d2b406e2e50",
  "status": "WORKING",
  "checkInAt": "2026-10-25T09:00:00+05:30",
  "checkOutAt": null,
  "elapsedMinutes": 240,
  "breakMinutes": 30,
  "netWorkMinutes": 210
}
```

### Standardized Error Format (`ErrorResponse`)

```json
{
  "status": 409,
  "message": "Cannot check out while a break is active. Please end your break first.",
  "timestamp": "2026-10-25T13:30:00+05:30"
}
```

---

## 🗄️ Database & Schema Design

Database migrations are strictly version-controlled using **Flyway**, ensuring identical schemas across Development, Staging, and Production environments.

### Core Domain Entities

1. **`employees`**: Stores employee profiles, corporate email, role-based access (`EMPLOYEE`, `MANAGER`, `ADMIN`), and authentication provider linkages.
2. **`attendance_sessions`**: Tracks daily work shifts, check-in/out timestamps, unique constraints per employee date, and attendance statuses (`WORKING`, `ON_BREAK`, `COMPLETED`, `INCOMPLETE`).
3. **`break_sessions`**: High-granularity break session tracking enforcing single active break per shift constraints.
4. **`audit_entries`**: Immutable JSONB-backed audit logs capturing state transitions, administrative modifications, actor IDs, and compliance reasons.

---

## 🚀 Getting Started

### Prerequisites

- **Java Development Kit (JDK):** Version 17 (or compatible 17+ LTS)
- **Database:** PostgreSQL 14+
- **In-Memory Cache:** Redis 6+ (Optional for core startup)
- **Message Broker:** Apache Kafka (Optional for core startup)
- **Build Tool:** Apache Maven 3.9+ (or use the bundled `./mvnw`)

---

### Environment Configuration & Secret Hygiene

> [!IMPORTANT]
> **Zero Credential Exposure:** Never commit plaintext passwords, API keys, or database credentials to git. All credentials are parameterized using environment variables with safe defaults.

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```

3. Provide your local environment credentials in `.env` (or pass as system environment variables):
   ```bash
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/ams_db
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=your_secure_password
   ```

---

### Building and Running the Backend

#### 1. Compile and Validate Build
```bash
# Windows
.\mvnw.cmd clean compile

# Linux / macOS
./mvnw clean compile
```

#### 2. Execute Tests
```bash
# Windows
.\mvnw.cmd test

# Linux / macOS
./mvnw test
```

> [!NOTE]
> The automated test suite executes 25 unit and web-layer integration tests covering all state machine transitions, edge cases, duration calculations, and HTTP error responses with **0 failures and 0 errors**.

#### 3. Run the Application Locally
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

The application will start on port `8080` (default) and execute Flyway migrations against the configured database automatically.

---

## 🗺️ Roadmap & Milestones

- [x] **Milestone 1:** Monorepo architecture setup & Maven toolchain stabilization.
- [x] **Milestone 2:** Flyway schema migration for Core Entities (Employees, Sessions, Breaks, Audit).
- [x] **Milestone 3:** Project Lombok integration & entity mapping.
- [x] **Milestone 4:** Clock-In / Clock-Out / Break lifecycle REST APIs & duration calculation engine.
- [x] **Milestone 5:** Comprehensive unit & integration testing suite (25 automated test cases).
- [ ] **Milestone 6:** Spring Security 6 & OAuth2 Client token integration.
- [ ] **Milestone 7:** Redis distributed session management & anti-tamper rate limiting.
- [ ] **Milestone 8:** Kafka event publishing for workforce audit triggers.
- [ ] **Milestone 9:** Frontend Web Client (React / Vite dashboard).

---

## 🏢 Organization & Ownership

Developed with pride by **Eduqynt Techviista Pvt. Ltd.**  
All rights reserved. Designed for proprietary enterprise deployments.

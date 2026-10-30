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
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📌 Executive Overview

**Workforce Attendance Engine** is a high-throughput, mission-critical workforce attendance and shift-tracking backend designed to meet the rigorous operational requirements of modern enterprises, distributed teams, and academic institutions. 

Engineered with scalability, auditability, and data integrity at its core, the platform delivers:
- **Immutable Attendance Records:** Precise clock-in, clock-out, break tracking, and session state machine validation.
- **Strict Data Validation & Audit Trail:** Dedicated audit logs tracking retroactive adjustments, supervisory overrides, and manager approvals.
- **Event-Driven Architecture:** Asynchronous event streaming via Apache Kafka for real-time notifications, downstream payroll triggers, and compliance alerts.
- **Distributed Rate Limiting & High-Performance Caching:** Distributed state caching and token-bucket rate limiting powered by Redis & Bucket4j.
- **Analytics & Aggregation Engine:** High-performance SQL projections aggregating yearly/monthly net working hours, complete days, and incomplete days.
- **Automated Calculation Engine:** Real-time computation of elapsed shift time, aggregated break duration, and net working minutes.

---

## 🏗️ Repository Architecture

This repository adopts a modular monorepo structure:

```text
workforce-attendance-engine/
├── backend/                  # Core Spring Boot REST API & Business Logic
│   ├── .mvn/wrapper/         # Maven Wrapper configuration (v3.9.9)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/techviista/attendance/
│   │   │   │   ├── admin/                           # Administrative management
│   │   │   │   │   ├── AdminController/             # Employee provisioning & team overview APIs
│   │   │   │   │   ├── adminService/                # Provisioning & administrative queries
│   │   │   │   │   └── CreateEmployeeRequest.java
│   │   │   │   ├── analytics/                       # Analytical summaries & dashboards
│   │   │   │   │   ├── AnalyticsController.java     # Yearly overview endpoint
│   │   │   │   │   ├── AnalyticsService.java        # Net hours & attendance aggregations
│   │   │   │   │   └── YearlyOverviewDTO.java
│   │   │   │   ├── attendance/                      # Core attendance domain
│   │   │   │   │   ├── dto/AttendanceResponse.java  # Response DTO with duration metrics
│   │   │   │   │   ├── dto/MonthlySummaryProjection # Database aggregation projection
│   │   │   │   │   ├── service/AttendanceService.java# Shift lifecycle & event publishing
│   │   │   │   │   ├── Attendance.java              # Attendance entity
│   │   │   │   │   ├── AttendanceStatus.java        # WORKING, ON_BREAK, COMPLETED, INCOMPLETE
│   │   │   │   │   └── BreakSession.java            # Granular break session entity
│   │   │   │   ├── common/
│   │   │   │   │   └── GlobalExceptionHandler.java  # Centralized error mapping (400, 401, 409)
│   │   │   │   ├── config/
│   │   │   │   │   ├── JwtAuthenticationFilter.java # JWT extraction & token validation filter
│   │   │   │   │   ├── JwtService.java              # JWT generation & parsing
│   │   │   │   │   ├── SecurityConfig.java          # Spring Security 6 stateless filter chain
│   │   │   │   │   └── WebMvcConfig.java            # WebMvcConfigurer interceptor registry
│   │   │   │   ├── controller/
│   │   │   │   │   └── AttendanceController.java    # Employee REST API endpoints
│   │   │   │   ├── employee/
│   │   │   │   │   ├── Employee.java                # Employee domain model
│   │   │   │   │   └── EmployeeRole.java            # EMPLOYEE, MANAGER, ADMIN
│   │   │   │   ├── events/                          # Event streaming (Apache Kafka)
│   │   │   │   │   ├── AttendanceEvent.java         # Event payload record
│   │   │   │   │   └── NotificationConsumer.java    # Consumer listeners
│   │   │   │   ├── ratelimit/                       # Rate limiting (Bucket4j + Redis)
│   │   │   │   │   ├── RateLimitInterceptor.java    # HandlerInterceptor enforcing quotas
│   │   │   │   │   └── RedisRateLimitConfig.java    # Distributed Lettuce ProxyManager
│   │   │   │   ├── repository/                      # Spring Data JPA repositories
│   │   │   │   │   ├── AttendanceRepository.java
│   │   │   │   │   ├── BreakSessionRepository.java
│   │   │   │   │   └── EmployeeRepository.java
│   │   │   │   └── AttendanceApplication.java       # Spring Boot application entry point
│   │   │   └── resources/
│   │   │       ├── application.yml                  # Parameterized runtime configuration
│   │   │       └── db/migration/V1__init_schema.sql # Flyway SQL schema versioning
│   │   └── test/
│   │       └── java/com/techviista/attendance/      # 49 automated unit & integration tests
│   ├── .env.example          # Sample environment variable definitions
│   ├── mvnw & mvnw.cmd       # Cross-platform Maven wrapper scripts
│   └── pom.xml               # Maven project dependencies and build plugins
├── docker-compose.yml        # Multi-container orchestration (Redis 7)
├── frontend/                 # Client SPA (Dashboard & Employee Portal - Coming Soon)
│   └── README.md
├── .gitignore                # Enterprise-grade git ignore filters
└── README.md                 # Project documentation
```

---

## 📡 REST API Reference

All protected endpoints authenticate via `Bearer <JWT_TOKEN>` (or extracted `@AuthenticationPrincipal`).

### 1. Attendance Lifecycle (`/api/v1/attendance`)

| Method | Endpoint | Description | Success Status | Error Scenarios |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/check-in` | Start daily shift session & emit Kafka event | `200 OK` | `400` (Unknown employee)<br>`409` (Already checked in today) |
| `POST` | `/breaks/start` | Start an active break | `200 OK` | `409` (Not working, break already active, or no shift) |
| `POST` | `/breaks/end` | Resume work after break | `200 OK` | `409` (Not on break, or no active break record found) |
| `POST` | `/check-out` | End daily shift session | `200 OK` | `409` (Already checked out, or break is still active) |
| `GET` | `/today` | Fetch today's current shift record | `200 OK` | `404` (No record for today) |
| `GET` | `/history` | Fetch complete shift history for employee | `200 OK` | `401` (Unauthorized) |

### 2. Administrative Operations (`/api/v1/admin`)

*Restricted to users with role `MANAGER` or `ADMIN`.*

| Method | Endpoint | Description | Success Status | Error Scenarios |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/employees` | Provision a new employee | `200 OK` | `403` (Forbidden)<br>`409` (Email already exists) |
| `GET` | `/attendance/today` | Fetch team-wide attendance for today | `200 OK` | `403` (Forbidden) |

### 3. Analytics & Reporting (`/api/v1/analytics`)

| Method | Endpoint | Description | Success Status | Error Scenarios |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/yearly-overview` | Yearly attendance summary & monthly breakdowns (`?year=YYYY`) | `200 OK` | `401` (Unauthorized) |

---

## 🚀 Getting Started

### Prerequisites

- **Java Development Kit (JDK):** Version 17 (or compatible 17+ LTS)
- **Database:** PostgreSQL 14+ (default: `localhost:5433`)
- **Distributed Cache / Rate Limiting:** Redis 7+ (via Docker or local service)
- **Message Broker:** Apache Kafka (default: `localhost:9092`)
- **Build Tool:** Apache Maven 3.9+ (or use the bundled `./mvnw`)
- **Docker:** Optional but recommended for Redis / infrastructure

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

3. Provide your local environment credentials in `.env` (or set as system environment variables):
   ```bash
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/ams_db
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=your_secure_password
   SPRING_DATA_REDIS_HOST=localhost
   SPRING_DATA_REDIS_PORT=6379
   SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
   ```

---

### Infrastructure Startup (Docker Compose)

Start the Redis rate-limiting service via Docker Compose:
```bash
docker compose up -d redis
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
> The automated test suite executes **49 unit, security, and web-layer integration tests** covering all state machine transitions, JWT filters, rate limiting, Kafka event generation, and HTTP error responses with **0 failures and 0 errors**.

#### 3. Run the Backend Locally
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

The application will start on port `8080` (default) and execute Flyway migrations against the configured database automatically.

#### 4. Run the React Web UI
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🗺️ Roadmap & Milestones

- [x] **Milestone 1:** Monorepo architecture setup & Maven toolchain stabilization.
- [x] **Milestone 2:** Flyway schema migration for Core Entities (Employees, Sessions, Breaks, Audit).
- [x] **Milestone 3:** Project Lombok integration & entity mapping.
- [x] **Milestone 4:** Clock-In / Clock-Out / Break lifecycle REST APIs & duration calculation engine.
- [x] **Milestone 5:** Comprehensive unit & integration testing suite (49 automated tests).
- [x] **Milestone 6:** Spring Security 6, JWT filter integration & Method Security (`@EnableMethodSecurity`).
- [x] **Milestone 7:** Redis distributed session management, Bucket4j anti-tamper rate limiting & Docker container support.
- [x] **Milestone 8:** Kafka event streaming (`attendance-events`) for workforce audit triggers.
- [x] **Milestone 9:** Frontend Web Client (React / Vite dashboard according to PRD & UI/UX Design Proposal).

---

## 🏢 Organization & Ownership

Developed with pride by **Eduqynt Techviista Pvt. Ltd.**  
All rights reserved. Designed for proprietary enterprise deployments.

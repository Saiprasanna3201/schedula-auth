# Schedula Auth — Backend API

A NestJS + PostgreSQL backend for a doctor-patient appointment scheduling system, built during the PearlThoughts Backend Internship Program.

**Live Server:** https://schedula-auth.onrender.com  
**Swagger Docs:** https://schedula-auth.onrender.com/api  
**Repository:** https://github.com/Saiprasanna3201/schedula-auth

---

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (Neon)
- **ORM:** TypeORM
- **Auth:** JWT + Passport
- **Docs:** Swagger / OpenAPI
- **Deployment:** Render

---

## Project Setup

### Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL database (Neon recommended)

### 1. Clone the repository

```bash
git clone https://github.com/Saiprasanna3201/schedula-auth.git
cd schedula-auth
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

```bash
cp .env.example .env
```

Fill in the values (see Environment Variables section below).

### 4. Run database migrations

```bash
npm run typeorm migration:run
```

### 5. Start the development server

```bash
npm run start:dev
```

The server starts at `http://localhost:3000`  
Swagger UI is available at `http://localhost:3000/api`

---

## Environment Variables

Create a `.env` file in the project root with these values:

```env
# Database
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require

# Auth
JWT_SECRET=your_jwt_secret_key_here

# App
PORT=3000
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon format) | ✅ |
| `JWT_SECRET` | Secret key for signing JWT tokens | ✅ |
| `PORT` | Port the server runs on (default: 3000) | ❌ |

---

## Features Implemented

### Day 5 — Authentication & User Management
- `POST /auth/signup` — Register as Doctor or Patient
- `POST /auth/login` — Login and receive JWT token
- Role-based access control (DOCTOR / PATIENT)
- JWT guard on all protected routes

### Day 6 — Doctor Availability
- `POST /doctor/availability` — Set recurring weekly availability
- `GET /doctor/availability` — View my recurring slots
- `PATCH /doctor/availability/:id` — Update a slot
- `DELETE /doctor/availability/:id` — Delete a slot
- `POST /doctor/availability/override` — Custom date override
- `GET /doctor/availability/date?date=YYYY-MM-DD` — Get availability for a specific date (override takes priority over recurring)
- Overlap, duplicate, and invalid time validation

### Day 7 — Slot Generation & Patient Slot View
- `POST /doctor/slots/generate` — Generate time slots from availability (configurable duration)
- `GET /doctor/:doctorId/slots?date=YYYY-MM-DD` — Patient views available slots for a doctor
- Future-only slots, custom override priority, booked slots filtered out

### Day 8 — Appointment Booking & Management
- `POST /appointment` — Patient books an available slot
- `GET /appointment/my` — Patient views their appointments
- `PATCH /appointment/:id/cancel` — Patient cancels an appointment
- `GET /doctor/appointments` — Doctor views all their booked appointments
- Duplicate booking prevention, past date/time checks, slot status management

### Day 10 — Appointment Rescheduling
- `PATCH /appointment/:id/reschedule` — Patient reschedules to a new slot
- 30-minute cutoff rule (cannot reschedule if < 30 min before current appointment)
- Atomic slot swap (old → AVAILABLE, new → BOOKED)
- Next available slot suggestion when requested slot is unavailable
- Validates: future date, different slot, ownership, not-cancelled status

---

## API Endpoints Summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | Public | Register |
| POST | `/auth/login` | Public | Login |
| POST | `/doctor/availability` | Doctor | Set recurring availability |
| GET | `/doctor/availability` | Doctor | View recurring availability |
| PATCH | `/doctor/availability/:id` | Doctor | Update availability |
| DELETE | `/doctor/availability/:id` | Doctor | Delete availability |
| POST | `/doctor/availability/override` | Doctor | Custom date override |
| GET | `/doctor/availability/date` | Any | Get slots for a date |
| POST | `/doctor/slots/generate` | Doctor | Generate time slots |
| GET | `/doctor/:doctorId/slots` | Patient | View available slots |
| GET | `/doctor/appointments` | Doctor | View booked appointments |
| POST | `/appointment` | Patient | Book appointment |
| GET | `/appointment/my` | Patient | View my appointments |
| PATCH | `/appointment/:id/cancel` | Patient | Cancel appointment |
| PATCH | `/appointment/:id/reschedule` | Patient | Reschedule appointment |

---

## Database Schema

```
users
  id (uuid PK)
  name, email, password, role (DOCTOR|PATIENT)

recurring_availability
  id (uuid PK)
  doctorId (FK → users)
  dayOfWeek, startTime, endTime

custom_availability
  id (uuid PK)
  doctorId (FK → users)
  date, startTime, endTime

slots
  id (uuid PK)
  doctorId (FK → users)
  date, startTime, endTime, durationMinutes
  status (AVAILABLE|BOOKED)

appointments
  id (uuid PK)
  patientId, doctorId (FK → users)
  slotId (FK → slots)
  date, startTime, endTime
  status (BOOKED|CANCELLED)
```

All migrations are in `src/database/migrations/`. `synchronize: false` is enforced.

---

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

---

## Deployment

This project is deployed on **Render** with auto-deploy on push to `main`.

- Build command: `npm install`
- Start command: `npm run start:dev`
- Environment variables are set in the Render dashboard

---

## API Collection

Import the Hoppscotch/Postman collection from the `api-collection/` folder in this repository, or use the live Swagger UI at https://schedula-auth.onrender.com/api.

---

## Author

**Sai Prasanna** — PearlThoughts Backend Internship, 2026

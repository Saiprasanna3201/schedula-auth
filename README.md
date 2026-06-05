# Schedula Auth — Role-Based Authentication (Day 2 Task)

## Tech Stack
- **Framework**: NestJS (Node.js + TypeScript)
- **Auth**: JWT via `@nestjs/jwt` + `passport-jwt`
- **Password**: bcryptjs (hashed, salted)
- **Docs**: Swagger UI (`/api`)
- **Storage**: In-memory (swap with TypeORM/Prisma + DB for prod)

---

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run start:dev
```

Server starts at **http://localhost:3000**  
Swagger docs at **http://localhost:3000/api**

---

## API Endpoints

### Auth (Public)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/signup` | Register as DOCTOR or PATIENT |
| POST | `/auth/login` | Login, receive JWT token |

### Doctor (JWT required — DOCTOR role only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/doctor/profile` | ✅ DOCTOR only — ❌ PATIENT blocked |
| GET | `/doctor/dashboard` | ✅ DOCTOR only — ❌ PATIENT blocked |

### Patient (JWT required — PATIENT role only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/patient/profile` | ✅ PATIENT only — ❌ DOCTOR blocked |
| GET | `/patient/appointments` | ✅ PATIENT only — ❌ DOCTOR blocked |

---

## Testing with Postman / Hoppscotch

### Step 1 — Signup as DOCTOR
```
POST http://localhost:3000/auth/signup
Content-Type: application/json

{
  "name": "Dr. Arjun Mehta",
  "email": "arjun@schedula.com",
  "password": "strongPass123",
  "role": "DOCTOR"
}
```
Copy the `access_token` from response.

### Step 2 — Signup as PATIENT
```
POST http://localhost:3000/auth/signup
Content-Type: application/json

{
  "name": "Priya Sharma",
  "email": "priya@schedula.com",
  "password": "patientPass123",
  "role": "PATIENT"
}
```

### Step 3 — Login
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "arjun@schedula.com",
  "password": "strongPass123"
}
```

### Step 4 — Access Doctor Profile (with DOCTOR token)
```
GET http://localhost:3000/doctor/profile
Authorization: Bearer <DOCTOR_TOKEN>
→ 200 OK ✅
```

### Step 5 — Try Doctor route with PATIENT token
```
GET http://localhost:3000/doctor/profile
Authorization: Bearer <PATIENT_TOKEN>
→ 403 Forbidden ❌
```

### Step 6 — Patient Profile (with PATIENT token)
```
GET http://localhost:3000/patient/profile
Authorization: Bearer <PATIENT_TOKEN>
→ 200 OK ✅
```

### Step 7 — No token at all
```
GET http://localhost:3000/doctor/profile
→ 401 Unauthorized ❌
```

---

## Project Structure

```
src/
├── main.ts                         # Bootstrap + Swagger
├── app.module.ts                   # Root module
├── common/
│   ├── types.ts                    # Role enum, User interface, in-memory store
│   ├── decorators/
│   │   └── roles.decorator.ts      # @Roles() decorator
│   └── guards/
│       ├── jwt-auth.guard.ts       # Validates JWT
│       └── roles.guard.ts          # Checks role from JWT payload
├── auth/
│   ├── auth.dto.ts                 # SignupDto, LoginDto (class-validator)
│   ├── jwt.strategy.ts             # Passport JWT strategy
│   ├── auth.service.ts             # Signup / Login logic
│   ├── auth.controller.ts          # POST /auth/signup, /auth/login
│   └── auth.module.ts
├── doctor/
│   ├── doctor.controller.ts        # GET /doctor/profile, /doctor/dashboard
│   └── doctor.module.ts
└── patient/
    ├── patient.controller.ts       # GET /patient/profile, /patient/appointments
    └── patient.module.ts
```

---

## Production Checklist
- [ ] Replace in-memory `users[]` with TypeORM/Prisma + PostgreSQL
- [ ] Store JWT_SECRET in `.env` and never commit it
- [ ] Add refresh token logic
- [ ] Add email verification on signup

// ─── Roles ──────────────────────────────────────────────────────────────────

export enum Role {
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

// ─── In-memory User store (replace with DB in production) ───────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: Role;
}

export const users: User[] = []; // acts as in-memory DB

// ─── JWT Payload shape ───────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: Role;
}

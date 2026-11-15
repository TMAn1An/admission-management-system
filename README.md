# Admission Management System

A secure, modern web app for running an institution's admission desk: register students, manage courses and seats, confirm admissions, collect fees and print official admission slips.

> Originally a university DBMS course project (PHP + MySQL). Rebuilt as a production-ready application — see [What changed](#what-changed-from-the-original-php-version).

## Features

- **Staff sign-in with roles** — Administrators manage courses and team members; Staff handle students, admissions and payments.
- **Students** — register, edit, search by name/email/phone, see each student's admissions and balances.
- **Courses & departments** — fees, duration, optional seat capacity; close/reopen courses without losing history.
- **Admissions** — one admission per student per course, seat limits enforced, fee locked at admission time, optional first payment.
- **Payments** — partial payments, overpayment protection, receipt numbers, per-admission history. Status (Unpaid / Partially paid / Paid in full) is always computed from payments.
- **Search, filter, export** — filter admissions by text, status, course and date range; export the result to CSV (Excel-safe).
- **Printable admission slip** with signature areas.
- **Dashboard** — students, open courses, admissions, fees collected vs outstanding.
- **Responsive & accessible** — works on phones; keyboard navigable, labelled forms, skip link, reduced reliance on colour alone.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components & Server Actions), React 19 |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Prisma ORM, with migrations |
| Styling | Tailwind CSS 4 |
| Auth | Signed httpOnly session cookie (`jose`), bcrypt password hashes |
| Validation | Zod, on the server for every mutation |
| Tests | Vitest |

## Getting started

Requirements: Node.js 20+ and a PostgreSQL database (Docker Compose file included).

```bash
git clone https://github.com/TMAn1An/admission-management-system.git
cd admission-management-system
npm install
cp .env.example .env        # then edit the values
docker compose up -d        # optional: local PostgreSQL
npx prisma migrate deploy   # create tables
npm run db:seed             # create the first admin (+ demo data if SEED_DEMO=true)
npm run dev                 # http://localhost:3000
```

Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your `.env`, then add team members under **Team**.

### Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | ≥ 32 random characters used to sign sessions (`openssl rand -base64 32`) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | First administrator created by the seed script (password ≥ 10 chars) |
| `SEED_DEMO` | `true` to also load sample departments, courses, students and admissions |

### Scripts

`npm run dev` · `npm run build` · `npm start` · `npm test` · `npm run lint` · `npm run typecheck` · `npm run db:migrate` · `npm run db:deploy` · `npm run db:seed`

## Deploying

**Vercel + managed PostgreSQL (e.g. Neon, Supabase, Vercel Postgres)**

1. Create a PostgreSQL database and copy its connection string.
2. Import the repository in Vercel and set `DATABASE_URL` and `SESSION_SECRET`.
3. Run migrations and the seed once against the production database from your machine:
   ```bash
   DATABASE_URL="<production url>" npx prisma migrate deploy
   DATABASE_URL="<production url>" SEED_ADMIN_EMAIL=you@school.edu SEED_ADMIN_PASSWORD="a-long-password" npm run db:seed
   ```
4. Deploy. Sign in and change nothing else — do **not** set `SEED_DEMO=true` in production.

Any Node host works too (`npm run build && npm start`) behind HTTPS.

## Design notes

- **Money is exact.** Amounts are `DECIMAL(12,2)` in the database and handled in integer paisa in code.
- **No stale status.** The old `Payment_Status` column is gone; status is derived from payments.
- **Concurrency-safe.** Payments and admissions run in transactions that lock the admission/course row, so two clerks cannot overpay a balance or oversell the last seat.
- **Fee history is stable.** An admission keeps the fee it was created with, even if the course fee changes later.
- **Records are protected.** Students, courses and admissions with history cannot be hard-deleted; close courses instead.
- **Security.** Every page and action re-checks the session and role on the server; Server Actions get built-in origin (CSRF) checks; cookies are `httpOnly`, `sameSite=lax`, `secure` in production; security headers are set; CSV export neutralises spreadsheet formula injection; login does not reveal whether an email exists.

## What changed from the original PHP version

| Before | Now |
|---|---|
| Open to anyone, no login | Authenticated staff with Admin/Staff roles |
| SQL + HTML mixed in every page, nav copied 7× | Typed data layer, validated server actions, shared layout & components |
| `root` with empty password in code | Configuration through environment variables |
| Stored, hand-updated payment status | Derived from payments; fee snapshot per admission |
| Payment race conditions possible | Transactional row locking |
| Course/department data only editable in SQL | Admin UI for courses and departments |
| No pagination, no tests, no CI | Pagination, unit tests, GitHub Actions CI |
| Desktop-oriented gradient UI | Clean responsive UI, mobile menu, print stylesheet |

The original PHP code remains available in the git history.

## Known limitations / next steps

- Login has no brute-force throttling yet; put the app behind your platform's rate limiting or add a store-backed limiter.
- Passwords are set by administrators (no self-service reset or email delivery yet).
- Single currency (BDT, ৳) and English-only UI.
- Course/department deletion and student archiving are intentionally not offered; add soft-delete if you need it.

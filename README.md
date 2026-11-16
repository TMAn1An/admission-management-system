# Admission Management System

A secure, modern web app for running an institution's admission desk: register students, manage courses and seats, confirm admissions, collect fees and print official admission slips.

> Originally a university DBMS course project (PHP + MySQL). Rebuilt as a production-ready application — see [What changed](#what-changed-from-the-original-php-version).

## Two sides, one system

- **Applicant portal (public, no login)** — browse open courses, apply online, track the application, see the admission slip and pay fees online.
- **Staff workspace (login)** — review applications, register students, manage courses, record payments, search and export.

## Features

### Applicant portal
- **Online application** — one short form; the applicant gets an application number (`APP-000123`).
- **Status page** — number + email unlocks a 30-minute private view: decision, admission slip, payments and balance. Wrong number and wrong email give the same answer, so numbers cannot be probed.
- **Online payment** — pay the balance (in full or in instalments) through SSLCommerz (bKash, Nagad, cards). Payments are re-validated with the gateway before crediting and can never be credited twice.
- **Spam protection** — hidden honeypot field, minimum fill time, per-IP rate limits.

### Staff workspace
- **Applications inbox** — approve (creates the student and the admission in one step, respecting seats) or reject with a reason; the applicant is emailed.

- **Staff sign-in with roles** — Administrators manage courses and team members; Staff handle students, admissions and payments.
- **Brute-force protection** — logins are throttled (5 failures per email / 20 per IP per 15 minutes).
- **Password management** — everyone can change their own password (**My account**); administrators can reset a team member's password. Either action signs the affected user out on every other device.
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
| Database | SQLite / libSQL via Prisma ORM — [Turso](https://turso.tech) in production, a local file in development |
| Styling | Tailwind CSS 4 |
| Auth | Signed httpOnly session cookie (`jose`), bcrypt password hashes |
| Validation | Zod, on the server for every mutation |
| Tests | Vitest |

## Getting started

Requirements: Node.js 20+. No database server needed locally — development uses a SQLite file.

```bash
git clone https://github.com/TMAn1An/admission-management-system.git
cd admission-management-system
npm install
cp .env.example .env        # then edit the values
npm run db:deploy           # create tables
npm run db:seed             # create the first admin (+ demo data if SEED_DEMO=true)
npm run dev                 # http://localhost:3000
```

Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your `.env`, then add team members under **Team**.

### Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` locally, or your Turso URL (`libsql://…`) |
| `DATABASE_AUTH_TOKEN` | Turso database token (not needed for local files) |
| `SESSION_SECRET` | ≥ 32 random characters used to sign sessions and tokens (`openssl rand -base64 32`) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | First administrator created by the seed script (password ≥ 10 chars) |
| `SEED_DEMO` | `true` to also load sample departments, courses, students and admissions |
| `INSTITUTION_NAME` | Name shown on the public pages and in emails |
| `APP_URL` | Public URL for links in emails and payment callbacks (auto-detected on Vercel) |
| `RESEND_API_KEY`, `MAIL_FROM` | *Optional.* Enables emails and "Forgot password" |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_LIVE` | *Optional.* Enables online payment (`SSLCOMMERZ_LIVE=true` only with live keys) |
| `PAYMENT_MOCK`, `MAIL_TRANSPORT=log` | Development only: simulated gateway page and emails printed to the log. Ignored in production. |

Optional integrations switch themselves off cleanly: without mail keys no emails are sent and the "Forgot password" link is hidden; without gateway keys the status page tells applicants to pay at the office.

### Enabling email (Resend)
1. Create an account at [resend.com](https://resend.com), verify your sending domain and create an API key.
2. In Vercel set `RESEND_API_KEY` and `MAIL_FROM` (for example `Admissions <admissions@your-domain.com>`), then redeploy.

### Enabling online payment (SSLCommerz)
1. Sign up at [sslcommerz.com](https://www.sslcommerz.com) (sandbox keys: [developer.sslcommerz.com](https://developer.sslcommerz.com)).
2. Set `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD` in Vercel. Test in the sandbox first, then switch to live keys and set `SSLCOMMERZ_LIVE=true`.
3. Callback and IPN URLs are sent with every payment (`/api/pay/sslcommerz/{success,fail,cancel,ipn}`); nothing needs to be configured in the SSLCommerz panel beyond enabling IPN if you want server-to-server confirmation.

> The gateway integration follows SSLCommerz's documented session-create and validation APIs and is covered by unit tests and a simulated-gateway end-to-end test, but it has **not** been exercised against SSLCommerz's live sandbox in this repository. Run one sandbox payment before going live.

### Scripts

`npm run dev` · `npm run build` · `npm start` · `npm test` · `npm run lint` · `npm run typecheck` · `npm run db:migrate` (author a new migration locally) · `npm run db:deploy` (apply migrations to `DATABASE_URL`) · `npm run db:seed`

## Deploying

**Vercel + Turso**

1. Create a Turso database (`turso db create admissions`) and a token (`turso db tokens create admissions`).
2. Import the repository in Vercel and set `DATABASE_URL`, `DATABASE_AUTH_TOKEN` and `SESSION_SECRET`.
   The build (`npm run vercel-build`) applies pending migrations automatically.
3. Create the first administrator once:
   ```bash
   DATABASE_URL="libsql://…" DATABASE_AUTH_TOKEN="…" SEED_ADMIN_EMAIL=you@school.edu SEED_ADMIN_PASSWORD="a-long-password" npm run db:seed
   ```
   Do **not** set `SEED_DEMO=true` in production.

Any Node host works too (`npm run build && npm start`) behind HTTPS.

## Design notes

- **Money is exact.** All arithmetic is done in integer paisa in code, and amounts are validated to two decimals, so SQLite's numeric storage never affects totals.
- **No stale status.** The old `Payment_Status` column is gone; status is derived from payments.
- **Concurrency-safe.** Payments and admissions run in transactions on a single-writer database: if two clerks submit at the same moment, one is retried against fresh data, so a balance cannot be overpaid and the last seat cannot be sold twice.
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
| Payment race conditions possible | Serialised transactions with retry |
| Course/department data only editable in SQL | Admin UI for courses and departments |
| No pagination, no tests, no CI | Pagination, unit tests, GitHub Actions CI |
| Desktop-oriented gradient UI | Clean responsive UI, mobile menu, print stylesheet |

The original PHP code remains available in the git history.

## Known limitations / next steps

- A user who forgets their password needs an administrator to reset it (email reset works once `RESEND_API_KEY` is configured). Keep at least two administrators so one can always reset the other's password.
- Single currency (BDT, ৳) and English-only UI.
- Applicants cannot edit or withdraw an application after submitting; staff handle that.
- Rate limiting is a fixed window stored in the database — good for abuse prevention, not a substitute for a WAF under a determined attack.
- Course/department deletion and student archiving are intentionally not offered; add soft-delete if you need it.

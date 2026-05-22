# 13 — Local Development Setup

This document covers everything needed to run OverseasERP locally from scratch.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20 LTS or higher | Check: `node --version` |
| npm | 10+ | Bundled with Node.js |
| Docker Desktop | Latest | For PostgreSQL container |
| Git | Any | For cloning the repo |

**Windows users:** Docker Desktop requires WSL2 or Hyper-V. Ensure Docker Desktop is running before starting.

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd overseas-erp
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies including Prisma, Next.js, React, jose, argon2, lucide-react, etc.

---

## Step 3: Start PostgreSQL with Docker

The project includes a `docker-compose.yml` file that sets up a PostgreSQL 16 container.

```bash
docker compose up -d
```

This starts:
- **Container name:** `overseas_erp_postgres`
- **Host port:** `5433` (maps to container port `5432`)
- **Database:** `overseas_erp_dev`
- **Username:** `overseas`
- **Password:** `overseas_dev_password`

**Verify it's running:**
```bash
docker ps
```

You should see `overseas_erp_postgres` with status `Up`.

**Stop the database:**
```bash
docker compose down
```

**Wipe all data and restart fresh:**
```bash
docker compose down -v   # WARNING: deletes all data
docker compose up -d
```

---

## Step 4: Configure Environment Variables

Copy the template and fill in values:

```bash
cp .env.example .env
```

**Minimum required values for local development (pre-filled for Docker setup):**

```env
# PostgreSQL — matches docker-compose.yml settings
DATABASE_URL="postgresql://overseas:overseas_dev_password@localhost:5433/overseas_erp_dev?schema=public"

# JWT secrets — must be at least 64 characters each
JWT_ACCESS_SECRET="replace_with_64_char_random_hex_string"
JWT_REFRESH_SECRET="replace_with_64_char_random_hex_string"

# Token expiry
JWT_ACCESS_EXPIRES_IN="900"    # 15 minutes
JWT_REFRESH_EXPIRES_IN="604800" # 7 days

# Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="Overseas Manpower ERP"
```

**Generate secure JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice — once for ACCESS secret, once for REFRESH secret.

> **Warning:** Never commit `.env` to version control. The `.gitignore` already excludes it.

---

## Step 5: Generate Prisma Client

```bash
npm run db:generate
```

This runs `prisma generate` and produces the TypeScript client in `generated/prisma/`. You must run this after any changes to `prisma/schema.prisma`.

---

## Step 6: Run Database Migrations

```bash
npm run db:migrate
```

This runs `prisma migrate dev` which:
1. Reads the migration history from `prisma/migrations/`
2. Applies any pending migrations to your PostgreSQL database
3. Generates a new migration if you have schema changes (in dev mode)

> **Note:** On a fresh database, this applies all migrations from scratch.

---

## Step 7: Seed the Database

```bash
npm run db:seed
```

This runs `prisma/seed.ts` which populates the database with:
- System roles (Super Admin, Operations Admin, HR Officer, etc.)
- All permissions
- Role-permission assignments
- Demo user accounts (one per role)
- Demo agents
- Sample job orders
- Sample applicants with workflow history
- Sample documents, invoices, receipts, ledger entries, commissions

**Seeded user credentials:**

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@agency.com | SuperAdmin@2026! |
| Operations Admin | ops@agency.com | OpsAdmin@2026! |
| HR Officer | hr@agency.com | HrOfficer@2026! |
| Documentation Officer | docs@agency.com | DocsOfficer@2026! |
| Visa Officer | visa@agency.com | VisaOfficer@2026! |
| Accounts Officer | accounts@agency.com | Accounts@2026! |
| Agent | agent@agent.com | AgentKabir@2026! |
| Applicant | applicant@applicant.com | Applicant@2026! |

---

## Step 8: Start the Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

Next.js will show which port it's running on (defaults to 3000, increments if 3000 is in use).

---

## Step 9: Open Prisma Studio (Optional)

Prisma Studio provides a visual database browser:

```bash
npm run db:studio
```

Opens at: **http://localhost:5555**

Useful for:
- Browsing tables visually
- Manually editing data for testing
- Verifying seed data

---

## Build for Production

```bash
npm run build
```

Then start the production server:
```bash
npm run start
```

Only run build if explicitly needed. Use `npm run dev` for development work.

---

## Common Troubleshooting

### Database Connection Failed

**Symptom:** `Error: Can't reach database server at localhost:5433`

**Fixes:**
1. Ensure Docker Desktop is running: open Docker Desktop app
2. Ensure the container is running: `docker ps`
3. If container is stopped: `docker compose up -d`
4. Check `DATABASE_URL` in `.env` — port should be `5433` (not 5432)
5. Check `prisma.config.ts` — it reads from `process.env.DATABASE_URL`

---

### Migration Issues

**Symptom:** `Migration failed to apply cleanly`

**Fixes:**
1. Reset the database: `docker compose down -v && docker compose up -d`
2. Re-run migrations: `npm run db:migrate`
3. Re-run seed: `npm run db:seed`

**Symptom:** `The migration ... was modified after it was applied`

This means you edited a migration file after it was already applied. Do NOT edit migration files that have been applied. Create a new migration instead.

---

### Token / Cookie Issues

**Symptom:** Redirected to `/login` immediately after logging in

**Fixes:**
1. Check browser DevTools → Application → Cookies — there should be a `refreshToken` cookie
2. Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set in `.env`
3. Secrets must be the same between restarts (don't regenerate them after seeding)
4. Clear browser cookies and try logging in again
5. In production/staging: ensure `NODE_ENV=production` so cookies use `Secure: true`

**Symptom:** 401 Unauthorized on all API calls after login

**Fix:** The access token in memory was lost (page refresh). The silent refresh should restore it. If it doesn't: check that the refresh cookie exists and `POST /api/auth/refresh` is returning a valid response.

---

### Theme Not Switching

**Symptom:** Dark mode toggle does nothing

**Fixes:**
1. Check browser DevTools → Elements — does the `<html>` element get `data-theme="dark"` when toggled?
2. Check `localStorage` in DevTools → Application → Local Storage → `erp-theme` value
3. If the value exists but doesn't apply: the `ThemeProvider` may not be wrapping the component. Check `src/app/layout.tsx` includes `ThemeProvider`.
4. Check `globals.css` for `[data-theme="dark"]` block — it must be there.

---

### File Upload Storage Path

**Symptom:** `ENOENT: no such file or directory, open 'storage/applicants/...'`

**Fix:**
1. The `storage/` directory is created automatically by `src/lib/storage.ts` using `fs.mkdirSync(dir, { recursive: true })`
2. Ensure the app has write permissions to the project root directory
3. On Windows: check that antivirus is not blocking file creation in the project folder

**Symptom:** File uploaded but download returns 404

**Fix:**
1. The file URL in the database should be a relative path like `storage/applicants/{id}/documents/{name}.pdf`
2. The download API reads this path relative to `process.cwd()` (the project root)
3. Ensure the file actually exists at `{project-root}/storage/applicants/{id}/documents/{name}.pdf`

---

## Quick Setup Reference

```bash
# 1. Start Docker PostgreSQL
docker compose up -d

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run db:generate

# 4. Apply migrations
npm run db:migrate

# 5. Seed database
npm run db:seed

# 6. Start dev server
npm run dev
```

Then open: http://localhost:3000

Login with: `admin@agency.com` / `SuperAdmin@2026!`

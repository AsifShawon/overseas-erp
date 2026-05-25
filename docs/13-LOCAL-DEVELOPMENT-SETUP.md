# 13 - Local Development Setup

This document covers the supported local workflows for Overseas ERP.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20 LTS or higher | Check with `node --version` |
| npm | 10+ | Bundled with Node.js |
| Docker Desktop | Latest | Required for PostgreSQL and the full container stack |
| Git | Any | For cloning the repo |

Windows users should ensure Docker Desktop is running with WSL2 or Hyper-V enabled before starting.

---

## Workflow Options

Two local workflows are supported:

1. Hybrid development
   Run PostgreSQL in Docker and run the Next.js app with `npm run dev`.
2. Full Docker stack
   Run PostgreSQL, migrations, and the production app in containers with `docker compose up --build`.

Use hybrid development for feature work. Use the full Docker stack when you want a production-like local environment.

---

## Hybrid Development

### 1. Clone the repository

```bash
git clone <repository-url>
cd overseas-erp
```

### 2. Copy environment variables

```bash
cp .env.example .env
```

Minimum required values:

```env
POSTGRES_DB="overseas_erp_dev"
POSTGRES_USER="overseas"
POSTGRES_PASSWORD="overseas_dev_password"
POSTGRES_PORT="5433"
DATABASE_URL="postgresql://overseas:overseas_dev_password@localhost:5433/overseas_erp_dev?schema=public"
DOCKER_DATABASE_URL="postgresql://overseas:overseas_dev_password@postgres:5432/overseas_erp_dev?schema=public"
JWT_ACCESS_SECRET="replace_with_64_char_random_hex_string"
JWT_REFRESH_SECRET="replace_with_64_char_random_hex_string"
JWT_ACCESS_EXPIRES_IN="900"
JWT_REFRESH_EXPIRES_IN="604800"
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="Overseas Manpower ERP"
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run it twice, once for each JWT secret.

### 3. Start PostgreSQL only

```bash
docker compose up -d postgres
```

This exposes PostgreSQL on `localhost:5433`.

### 4. Install dependencies

```bash
npm install
```

### 5. Generate Prisma client

```bash
npm run db:generate
```

### 6. Apply development migrations

```bash
npm run db:migrate
```

### 7. Seed the database

```bash
npm run db:seed
```

Seeded login examples:

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

### 8. Start the development server

```bash
npm run dev
```

The app is available at `http://localhost:3000`.

### 9. Optional Prisma Studio

```bash
npm run db:studio
```

Prisma Studio opens at `http://localhost:5555`.

---

## Full Docker Stack

Run the entire stack in containers:

```bash
docker compose up --build
```

This starts:

- `postgres`: PostgreSQL 16 with persistent data in `overseas_erp_pgdata`
- `migrate`: one-off Prisma migration job using `prisma migrate deploy`
- `app`: production Next.js container on `http://localhost:3000`

Uploaded files are stored in the `overseas_erp_storage` named volume.

### Optional seed container

The seed job is not part of normal startup because the current script is not fully idempotent. Run it manually only when you want demo data loaded:

```bash
docker compose run --rm seed
```

### Stop the stack

```bash
docker compose down
```

To remove database and uploaded-file volumes too:

```bash
docker compose down -v
```

---

## Production Build Without Docker

```bash
npm run build
npm run start
```

The Docker image uses the same production build path, with Next.js standalone output enabled.

---

## Troubleshooting

### Database connection failed

Symptom:
`Error: Can't reach database server at localhost:5433`

Fixes:

1. Ensure Docker Desktop is running.
2. Ensure PostgreSQL is running with `docker compose ps`.
3. If needed, restart it with `docker compose up -d postgres`.
4. Confirm `DATABASE_URL` points to `localhost:5433`.
5. Confirm `prisma.config.ts` is reading the same `DATABASE_URL`.

### Migration issues

If migrations fail locally:

```bash
docker compose down -v
docker compose up -d postgres
npm run db:migrate
npm run db:seed
```

Do not edit previously applied migration files. Create a new migration instead.

### Token or cookie issues

If login immediately redirects back to `/login`:

1. Verify `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set.
2. Clear browser cookies and try again.
3. Ensure the same secrets persist across restarts.
4. In production, ensure `NODE_ENV=production` so secure cookies behave correctly.

### File upload path issues

If uploads fail with a missing `storage/...` path:

1. The app creates directories automatically under `storage/`.
2. In Docker, the path is backed by the `overseas_erp_storage` volume.
3. In hybrid development, ensure the project directory is writable.

If a file uploads but download returns `404`, verify the database path matches the file on disk under `storage/applicants/...`.

---

## Quick Reference

Hybrid development:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Full Docker stack:

```bash
docker compose up --build
docker compose run --rm seed
```

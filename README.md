# Overseas ERP

Overseas ERP is a Next.js 16 and Prisma 7 application for overseas manpower agency operations, including applicants, workflow tracking, documents, accounts, commissions, and reporting.

## Architecture

- App runtime: Next.js route handlers on Vercel or Docker/VPS
- Database: Prisma + PostgreSQL
- Default cloud deployment: Supabase PostgreSQL
- Document storage:
  - `STORAGE_DRIVER="supabase"` for Vercel or Docker/VPS with Supabase Storage
  - `STORAGE_DRIVER="local"` for local development or Docker/VPS with `/app/storage`

Uploaded applicant files are never stored in Postgres. The database stores metadata only:

- `storageProvider`
- `bucket`
- `storagePath`
- `fileName`
- `mimeType`
- `fileSize`

Downloads are served through authenticated app routes and private signed URLs or secure local streaming, depending on the configured storage driver.

## Local Development

1. Copy `.env.example` to `.env`.
2. For Docker PostgreSQL + local storage mode, set:

```env
DATABASE_URL="postgresql://overseas:overseas_dev_password@localhost:5433/overseas_erp_dev?schema=public"
DIRECT_URL="postgresql://overseas:overseas_dev_password@localhost:5433/overseas_erp_dev?schema=public"
STORAGE_DRIVER="local"
LOCAL_STORAGE_ROOT="./storage"
```

3. Start only PostgreSQL:

```bash
docker compose up -d postgres
```

4. Install dependencies and prepare the database:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Open Storage in the Supabase dashboard.
3. Create a private bucket named `applicant-documents`.
4. Keep the bucket private.
5. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
6. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.
7. Copy the pooled Postgres connection string into `DATABASE_URL`.
8. Copy the direct Postgres connection string into `DIRECT_URL`.
9. Add the variables to Vercel or your VPS environment.

Important:

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must stay server-only.
- Do not import `SUPABASE_SERVICE_ROLE_KEY` into client components.
- Do not use public bucket URLs for applicant documents.
- Documents are downloaded through authenticated server routes that generate short-lived signed URLs.

## Vercel Deployment

Build command:

```bash
npm run vercel-build
```

Required environment variables:

```env
DATABASE_URL=""
DIRECT_URL=""
STORAGE_DRIVER="supabase"
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="applicant-documents"
SUPABASE_SIGNED_URL_EXPIRES_IN="300"
JWT_ACCESS_SECRET=""
JWT_REFRESH_SECRET=""
JWT_ACCESS_EXPIRES_IN="900"
JWT_REFRESH_EXPIRES_IN="604800"
NEXT_PUBLIC_APP_NAME="Overseas Manpower ERP"
```

Notes:

- Use the Supabase pooler connection string for `DATABASE_URL` on Vercel.
- Use the direct Supabase connection string for `DIRECT_URL`.
- Include `pgbouncer=true` in the pooled connection string when required by Prisma.
- After changing environment variables in Vercel, redeploy the app.
- Vercel production should not depend on `/app/storage`.

## Full Docker Stack

To run the application and PostgreSQL entirely in Docker:

```bash
docker compose up --build
```

This starts:

- `postgres`: PostgreSQL 16 with a persistent named volume
- `migrate`: one-off Prisma migration job
- `app`: production Next.js container on `http://localhost:3000`

Docker volumes remain enabled:

- `overseas_erp_pgdata`
- `overseas_erp_storage`

## Docker/VPS Modes

Docker or VPS with Supabase PostgreSQL + Supabase Storage:

```env
STORAGE_DRIVER="supabase"
DOCKER_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
```

Docker or VPS with local Postgres + mounted local storage:

```env
STORAGE_DRIVER="local"
DOCKER_DATABASE_URL="postgresql://overseas:overseas_dev_password@postgres:5432/overseas_erp_dev?schema=public"
DIRECT_URL="postgresql://overseas:overseas_dev_password@postgres:5432/overseas_erp_dev?schema=public"
LOCAL_STORAGE_ROOT="/app/storage"
```

Notes:

- Do not use `STORAGE_DRIVER="local"` on Vercel.
- Local storage mode uses the mounted `/app/storage` volume.
- Supabase storage mode works on both Vercel and Docker/VPS.
- Future S3-compatible drivers can be added without changing route handlers because storage calls go through the adapter layer.

## Optional Seed In Docker

Run the seed job manually on a fresh database:

```bash
docker compose run --rm seed
```

Seeded document rows use safe mock metadata paths like `seed-mock/*.pdf`; no real files are inserted into the database.

## Shutdown

```bash
docker compose down
```

To remove the PostgreSQL and file-storage volumes as well:

```bash
docker compose down -v
```

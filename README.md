# Overseas ERP

Overseas ERP is a Next.js 16 and Prisma application for overseas manpower agency operations, including applicants, workflow tracking, documents, accounts, commissions, and reporting.

## Local Development

1. Copy `.env.example` to `.env`.
2. Start only PostgreSQL:

```bash
docker compose up -d postgres
```

3. Install dependencies and prepare the database:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Full Docker Stack

To run the application and PostgreSQL entirely in Docker:

```bash
docker compose up --build
```

This starts:

- `postgres`: PostgreSQL 16 with a persistent named volume
- `migrate`: one-off Prisma migration job
- `app`: production Next.js container on `http://localhost:3000`

The application stores uploaded files in the `overseas_erp_storage` named volume.

## Optional Seed In Docker

The seed job is intentionally not part of normal startup because the current seed script is not fully idempotent.

Run it manually on a fresh database:

```bash
docker compose run --rm seed
```

## Shutdown

```bash
docker compose down
```

To remove the PostgreSQL and file-storage volumes as well:

```bash
docker compose down -v
```

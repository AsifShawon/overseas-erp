// src/lib/db.ts
// PrismaClient singleton for Overseas Manpower ERP
//
// Prisma 7 requires a driver adapter (PrismaPg) for PostgreSQL connections.
// This singleton pattern prevents connection pool exhaustion during Next.js
// hot reloads in development, as described in docs/07-development-rules.md.

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";


function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Please copy .env.example to .env and configure your PostgreSQL connection string."
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Global singleton to prevent exhausting connections during hot reloads
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

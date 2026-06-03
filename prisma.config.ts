import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!url) {
  throw new Error("DIRECT_URL or DATABASE_URL is required");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});

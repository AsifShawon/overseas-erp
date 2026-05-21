// prisma.config.ts
// Prisma 7 configuration file (replaces datasource url in schema.prisma)
// See: https://pris.ly/d/config-datasource

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});

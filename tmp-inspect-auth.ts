import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, roleId: true, isActive: true, isPlatformAdmin: true, mustChangePassword: true },
    orderBy: { email: "asc" },
  });
  const memberships = await prisma.userMembership.findMany({
    select: { id: true, userId: true, companyId: true, roleId: true, status: true, isOwner: true },
    orderBy: { userId: "asc" },
  });
  const companies = await prisma.company.findMany({ select: { id: true, name: true, status: true }, orderBy: { name: "asc" } });
  const roles = await prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  console.log(JSON.stringify({ users, memberships, companies, roles }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

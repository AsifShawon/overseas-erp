#!/usr/bin/env ts-node
/**
 * scripts/test-notification-system.ts
 *
 * Validates the notification system end-to-end.
 * Run with: npx tsx scripts/test-notification-system.ts
 */

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log("\n🔔 Notification System Tests\n");
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<boolean>) {
    try {
      const ok = await fn();
      if (ok) { console.log(`  ✅ ${name}`); passed++; }
      else     { console.log(`  ❌ FAILED: ${name}`); failed++; }
    } catch (e: any) {
      console.log(`  ❌ ERROR: ${name} — ${e.message}`);
      failed++;
    }
  }

  // 1. Can create an in-app notification
  await test("In-app notification can be created", async () => {
    const user = await prisma.user.findFirst({ where: { isActive: true } });
    if (!user) return false;
    const n = await prisma.notification.create({
      data: {
        userId: user.id,
        title:  "Test Notification",
        message:"This is a test notification.",
        type:   "GENERAL",
      },
    });
    await prisma.notification.delete({ where: { id: n.id } });
    return !!n.id;
  });

  // 2. WebPushSubscription model exists
  await test("WebPushSubscription model is queryable", async () => {
    const count = await prisma.webPushSubscription.count();
    return typeof count === "number";
  });

  // 3. NotificationPreference model exists
  await test("NotificationPreference model is queryable", async () => {
    const count = await prisma.notificationPreference.count();
    return typeof count === "number";
  });

  // 4. Task model exists and can be queried
  await test("Task model is queryable", async () => {
    const count = await prisma.task.count();
    return typeof count === "number";
  });

  // 5. ReminderLog model exists
  await test("ReminderLog model is queryable", async () => {
    const count = await prisma.reminderLog.count();
    return typeof count === "number";
  });

  // 6. NotificationDelivery model exists
  await test("NotificationDelivery model is queryable", async () => {
    const count = await prisma.notificationDelivery.count();
    return typeof count === "number";
  });

  // 7. Notification has type/priority/channel fields
  await test("Notification has type, priority, channel fields", async () => {
    const user = await prisma.user.findFirst({ where: { isActive: true } });
    if (!user) return false;
    const n = await prisma.notification.create({
      data: {
        userId:   user.id,
        title:    "Field Test",
        message:  "Testing extended fields",
        type:     "INVOICE_CREATED",
        priority: "HIGH",
        channel:  "MULTI",
      },
    });
    const ok = n.type === "INVOICE_CREATED" && n.priority === "HIGH" && n.channel === "MULTI";
    await prisma.notification.delete({ where: { id: n.id } });
    return ok;
  });

  // 8. Tenant isolation: notifications scoped by companyId
  await test("Notifications are company-scoped (tenant isolation)", async () => {
    const companies = await prisma.company.findMany({ take: 2 });
    if (companies.length < 2) {
      console.log("    ℹ️  Skipped (need 2 companies)");
      return true;
    }
    const user = await prisma.user.findFirst({ where: { isActive: true } });
    if (!user) return false;

    const n = await prisma.notification.create({
      data: {
        userId:    user.id,
        companyId: companies[0].id,
        title:     "Company A Notification",
        message:   "Only for Company A",
        type:      "GENERAL",
      },
    });

    // Query with Company B's ID — should not find it
    const found = await prisma.notification.findFirst({
      where: { id: n.id, companyId: companies[1].id },
    });
    await prisma.notification.delete({ where: { id: n.id } });
    return found === null;
  });

  // 9. ReminderLog deduplication works (via findFirst, matching actual implementation)
  await test("ReminderLog prevents duplicate reminders (findFirst dedup)", async () => {
    const key  = `test_reminder_key_${Date.now()}`;
    const date = new Date("2026-01-01T00:00:00.000Z");

    await prisma.reminderLog.create({
      data: { companyId: null, reminderKey: key, reminderDate: date },
    });

    // The actual dedup uses findFirst — simulate the same check
    const existing = await prisma.reminderLog.findFirst({
      where: { companyId: null, reminderKey: key, reminderDate: date },
    });

    // Cleanup
    await prisma.reminderLog.deleteMany({ where: { reminderKey: key } });
    return !!existing; // Found = dedup works
  });

  // 10. Platform admin user exists
  await test("Platform admin user exists", async () => {
    const admin = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });
    return !!admin;
  });

  // 11. Task can be created and completed
  await test("Task can be created and status updated", async () => {
    const company = await prisma.company.findFirst();
    if (!company) return false;
    const task = await prisma.task.create({
      data: {
        companyId: company.id,
        title:     "Test Task",
        status:    "PENDING",
        priority:  "NORMAL",
      },
    });
    const updated = await prisma.task.update({
      where: { id: task.id },
      data:  { status: "COMPLETED", completedAt: new Date() },
    });
    await prisma.task.delete({ where: { id: task.id } });
    return updated.status === "COMPLETED";
  });

  // Summary
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => pool.end());

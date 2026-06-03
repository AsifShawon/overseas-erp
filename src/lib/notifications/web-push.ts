// src/lib/notifications/web-push.ts
// Web push notification helper using the web-push package.

import webpush from "web-push";
import { prisma } from "@/lib/db";

let vapidConfigured = false;

function ensureVapidConfig() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@example.com";

  if (!publicKey || !privateKey) {
    console.warn("[WebPush] VAPID keys not configured. Web push disabled.");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export function isWebPushConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

export interface WebPushPayload {
  title: string;
  message: string;
  actionUrl?: string;
  icon?: string;
  badge?: string;
  type?: string;
}

/**
 * Send a web push notification to all active subscriptions for a user.
 * Failures are logged and deactivated subscriptions removed. Never throws.
 */
export async function sendWebPushToUser(
  userId: string,
  payload: WebPushPayload
): Promise<void> {
  if (!isWebPushConfigured()) return;

  try {
    ensureVapidConfig();
    const subscriptions = await prisma.webPushSubscription.findMany({
      where: { userId, isActive: true },
    });

    if (subscriptions.length === 0) return;

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.message,
      url: payload.actionUrl || "/notifications",
      type: payload.type || "GENERAL",
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notification
        );
      } catch (err: any) {
        // Subscription expired or invalid — deactivate it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.webPushSubscription
            .update({ where: { id: sub.id }, data: { isActive: false } })
            .catch(() => {});
        }
        console.error("[WebPush] Failed to send to subscription:", sub.endpoint, err.message);
      }
    }
  } catch (err) {
    console.error("[WebPush] sendWebPushToUser error:", err);
  }
}

/**
 * Send web push to all users in an array.
 */
export async function sendWebPushToUsers(
  userIds: string[],
  payload: WebPushPayload
): Promise<void> {
  if (!isWebPushConfigured() || userIds.length === 0) return;
  await Promise.allSettled(userIds.map((uid) => sendWebPushToUser(uid, payload)));
}

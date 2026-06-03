// src/lib/client/web-push-client.ts
// Client-side web push subscription helpers.
// Import this only in client components.

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

/**
 * Register the service worker and subscribe to web push.
 * Returns the subscription or null if unavailable.
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, error: "Web push is not supported in this browser." };
  }

  if (Notification.permission === "denied") {
    return { success: false, error: "Notification permission was denied. Please enable it in browser settings." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, error: "Notification permission not granted." };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
    });

    const subJson = subscription.toJSON();

    const response = await fetch("/api/notifications/web-push/subscribe", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        p256dh:   (subJson.keys as any)?.p256dh,
        auth:     (subJson.keys as any)?.auth,
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.error || "Failed to save subscription." };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to subscribe to push notifications." };
  }
}

/**
 * Unsubscribe from web push.
 */
export async function unsubscribeFromPushNotifications(
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!("serviceWorker" in navigator)) {
      return { success: false, error: "Service worker not supported." };
    }

    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }

    await fetch("/api/notifications/web-push/unsubscribe", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to unsubscribe." };
  }
}

/**
 * Check if user is currently subscribed to push notifications.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

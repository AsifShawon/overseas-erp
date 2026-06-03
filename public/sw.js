// public/sw.js
// Service Worker for VisaTek ERP Web Push Notifications.
// This file must be at the root of the public directory.

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "VisaTek ERP", body: event.data.text(), url: "/notifications" };
  }

  const title   = payload.title   || "VisaTek ERP Notification";
  const options = {
    body:    payload.body    || payload.message || "You have a new notification.",
    icon:    "/favicon.ico",
    badge:   "/favicon.ico",
    data:    { url: payload.url || "/notifications" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";
  event.waitUntil(clients.openWindow(url));
});

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

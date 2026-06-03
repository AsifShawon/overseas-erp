// src/app/api/notifications/web-push/public-key/route.ts
// GET /api/notifications/web-push/public-key — Returns VAPID public key (public endpoint).

import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ configured: false, publicKey: null });
  }
  return NextResponse.json({ configured: true, publicKey });
}

// src/app/api/auth/logout/route.ts
// POST /api/auth/logout

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // Determine if refresh token was present to create an audit log
    const refreshToken = cookieStore.get("refreshToken")?.value;

    // 1. Clear cookie by setting its maxAge to 0 / past date
    cookieStore.set("refreshToken", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // 2. Optional: We can parse the authorization token to log who logged out
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Just a best effort log, we don't block logout on token failure
      const token = authHeader.split(" ")[1];
      const { verifyAccessToken } = await import("@/lib/auth");
      const decoded = await verifyAccessToken(token);
      if (decoded) {
        await prisma.auditLog.create({
          data: {
            userId: decoded.userId,
            roleName: decoded.roleName,
            actionType: "LOGOUT",
            tableName: "User",
            recordId: decoded.userId,
            ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

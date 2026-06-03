// src/app/api/auth/me/route.ts
// GET /api/auth/me

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAccessToken, resolveUserSessionPayload } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 1. Extract Bearer token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token required." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    const decoded = await verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid or expired access token." }, { status: 401 });
    }

    // 3. Fetch user details from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        agentProfile: true,
        applicantProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "User account has been deactivated." }, { status: 401 });
    }

    // 4. Resolve session payload (incorporating memberships and roles)
    const sessionPayload = await resolveUserSessionPayload(user.id);
    if (!sessionPayload) {
      return NextResponse.json(
        { error: "No active company workspace is available for this account." },
        { status: 401 }
      );
    }

    // 5. Return user info
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isPlatformAdmin: sessionPayload.isPlatformAdmin,
        activeCompanyId: sessionPayload.activeCompanyId,
        activeCompanyName: sessionPayload.activeCompanyName,
        membershipId: sessionPayload.membershipId,
        roleName: sessionPayload.roleName,
        agentCode: user.agentProfile?.agentCode || null,
        applicantId: user.applicantProfile?.id || null,
        permissions: sessionPayload.permissions,
        mustChangePassword: user.mustChangePassword,
        companyStatus: sessionPayload.companyStatus,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

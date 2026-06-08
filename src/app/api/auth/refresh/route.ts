// src/app/api/auth/refresh/route.ts
// POST /api/auth/refresh

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyRefreshToken, signAccessToken, signRefreshToken, getRefreshTokenCookieOptions, resolveUserSessionPayload } from "@/lib/auth";
import { getAccessibleBranches } from "@/lib/branch-scope";

export async function POST(request: Request) {
  try {
    // 1. Get refresh token from cookie
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided." }, { status: 401 });
    }

    // 2. Verify refresh token using jose
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 401 });
    }

    // 3. Fetch user from DB to ensure they are active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: true,
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

    // 5. Generate new tokens (Token Rotation)
    const newAccessToken = await signAccessToken(sessionPayload);

    const newRefreshToken = await signRefreshToken({
      userId: user.id,
    });

    // 6. Update the HttpOnly refresh token cookie
    const cookieOpts = getRefreshTokenCookieOptions();
    cookieStore.set(cookieOpts.name, newRefreshToken, {
      expires: cookieOpts.expires,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
    });

    const branches = sessionPayload.activeCompanyId
      ? await getAccessibleBranches(user.id, sessionPayload.activeCompanyId, sessionPayload.permissions)
      : [];

    // 7. Return new access token & user details
    return NextResponse.json({
      accessToken: newAccessToken,
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
        branches,
      },
    });
  } catch (error) {
    console.error("Refresh Token API Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

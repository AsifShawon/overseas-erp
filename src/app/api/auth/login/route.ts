// src/app/api/auth/login/route.ts
// POST /api/auth/login

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signAccessToken, signRefreshToken, getRefreshTokenCookieOptions, resolveUserSessionPayload } from "@/lib/auth";
import * as argon2 from "argon2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // 2. Fetch user from DB with roles and profiles
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        agentProfile: true,
        applicantProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "This account has been deactivated." }, { status: 401 });
    }

    // 3. Verify password hash using argon2
    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 4. Resolve session payload (incorporating memberships and roles)
    const sessionPayload = await resolveUserSessionPayload(user.id);
    if (!sessionPayload) {
      return NextResponse.json(
        { error: "No active company workspace is available for this account." },
        { status: 401 }
      );
    }

    // 5. Create Access & Refresh Tokens
    const accessToken = await signAccessToken(sessionPayload);

    const refreshToken = await signRefreshToken({
      userId: user.id,
    });

    // 6. Store Refresh Token in HttpOnly cookie
    const cookieStore = await cookies();
    const cookieOpts = getRefreshTokenCookieOptions();
    cookieStore.set(cookieOpts.name, refreshToken, {
      expires: cookieOpts.expires,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
    });

    // 7. Record an audit log for successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        roleName: sessionPayload.roleName,
        actionType: "LOGIN_SUCCESS",
        tableName: "User",
        recordId: user.id,
        companyId: sessionPayload.activeCompanyId,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    // 8. Return response
    return NextResponse.json({
      accessToken,
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
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

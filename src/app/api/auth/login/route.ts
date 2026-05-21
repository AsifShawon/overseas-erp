// src/app/api/auth/login/route.ts
// POST /api/auth/login

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signAccessToken, signRefreshToken, getRefreshTokenCookieOptions } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
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

    // 4. Create Access & Refresh Tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      roleName: user.role.name,
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
    });

    // 5. Fetch dynamic permissions from the database
    const permissions = await getUserPermissions(user.id);

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
        roleName: user.role.name,
        actionType: "LOGIN_SUCCESS",
        tableName: "User",
        recordId: user.id,
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
        roleName: user.role.name,
        agentCode: user.agentProfile?.agentCode || null,
        applicantId: user.applicantProfile?.id || null,
        permissions,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

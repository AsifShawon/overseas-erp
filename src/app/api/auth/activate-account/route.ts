// src/app/api/auth/activate-account/route.ts
// Public endpoints for Company Owner account activation

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signAccessToken, signRefreshToken, getRefreshTokenCookieOptions, resolveUserSessionPayload } from "@/lib/auth";
import * as argon2 from "argon2";
import crypto from "crypto";

// Helper to hash token using SHA-256
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * GET /api/auth/activate-account?token=...
 * Public endpoint to validate an activation token and return basic info for UI
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Invalid or expired activation link." }, { status: 400 });
    }

    const tokenHash = hashToken(token);

    const activationToken = await prisma.accountActivationToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
        company: true,
      },
    });

    if (
      !activationToken ||
      activationToken.usedAt !== null ||
      activationToken.expiresAt < new Date()
    ) {
      return NextResponse.json({ error: "Invalid or expired activation link." }, { status: 400 });
    }

    return NextResponse.json({
      email: activationToken.user.email,
      companyName: activationToken.company?.name || null,
    });
  } catch (error) {
    console.error("GET /api/auth/activate-account Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * POST /api/auth/activate-account
 * Public endpoint to set owner password using token
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password, confirmPassword } = body;

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>_+\-\[\]\/\\~`|';]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g., #, @, !, etc.)." }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    let userId = "";

    // Execute in transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      const activationToken = await tx.accountActivationToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (
        !activationToken ||
        activationToken.usedAt !== null ||
        activationToken.expiresAt < new Date()
      ) {
        throw new Error("INVALID_TOKEN");
      }

      userId = activationToken.userId;

      // Hash password using the existing argon2 implementation
      const passwordHash = await argon2.hash(password);

      // Update User password and set active status
      await tx.user.update({
        where: { id: activationToken.userId },
        data: {
          passwordHash,
          isActive: true,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      });

      // Update their memberships from INVITED to ACTIVE
      await tx.userMembership.updateMany({
        where: {
          userId: activationToken.userId,
          status: "INVITED",
        },
        data: {
          status: "ACTIVE",
        },
      });

      // Mark token usedAt
      await tx.accountActivationToken.update({
        where: { id: activationToken.id },
        data: {
          usedAt: new Date(),
        },
      });
    });

    // Login directly
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        agentProfile: true,
        applicantProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const sessionPayload = await resolveUserSessionPayload(user.id);
    if (!sessionPayload) {
      return NextResponse.json(
        { error: "No active company workspace is available for this account." },
        { status: 401 }
      );
    }

    // Create Access & Refresh Tokens
    const accessToken = await signAccessToken(sessionPayload);

    const refreshToken = await signRefreshToken({
      userId: user.id,
    });

    // Store Refresh Token in HttpOnly cookie
    const cookieStore = await cookies();
    const cookieOpts = getRefreshTokenCookieOptions();
    cookieStore.set(cookieOpts.name, refreshToken, {
      expires: cookieOpts.expires,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
    });

    // Record an audit log for successful activation login
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

    return NextResponse.json({
      success: true,
      message: "Account successfully activated.",
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

  } catch (error: any) {
    if (error.message === "INVALID_TOKEN") {
      return NextResponse.json({ error: "Invalid or expired activation token." }, { status: 400 });
    }
    console.error("POST /api/auth/activate-account Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

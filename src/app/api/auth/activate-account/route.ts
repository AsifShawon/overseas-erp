// src/app/api/auth/activate-account/route.ts
// Public endpoints for Company Owner account activation

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

    if (password.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters long." }, { status: 400 });
    }

    const tokenHash = hashToken(token);

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

      // Hash password using the existing argon2 implementation
      const passwordHash = await argon2.hash(password);

      // Update User password and set active status
      await tx.user.update({
        where: { id: activationToken.userId },
        data: {
          passwordHash,
          isActive: true,
          mustChangePassword: false,
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

    return NextResponse.json({
      success: true,
      message: "Account successfully activated. Please log in.",
    });
  } catch (error: any) {
    if (error.message === "INVALID_TOKEN") {
      return NextResponse.json({ error: "Invalid or expired activation token." }, { status: 400 });
    }
    console.error("POST /api/auth/activate-account Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

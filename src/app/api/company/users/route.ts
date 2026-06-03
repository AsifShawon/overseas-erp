// src/app/api/company/users/route.ts
// GET /api/company/users - List users in the active company
// POST /api/company/users/invite - Invite a new company user

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyContext } from "@/lib/auth";
import { sendCompanyUserInvitation } from "@/lib/email/email-service";
import * as argon2 from "argon2";
import crypto from "crypto";
import { z } from "zod";

const InviteUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  roleId: z.string().uuid("Invalid role ID."),
  note: z.string().optional(),
});

/**
 * GET /api/company/users
 * Returns list of memberships for activeCompanyId.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    // Check permission
    if (!ctx.permissions.includes("VIEW_COMPANY_USERS")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const memberships = await prisma.userMembership.findMany({
      where: { companyId: ctx.activeCompanyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            isActive: true,
            createdAt: true,
            passwordChangedAt: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("GET /api/company/users Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

/**
 * POST /api/company/users/invite
 * Invites a new team member.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireCompanyContext(request);
    if (!ctx || !ctx.activeCompanyId) {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }

    // Check permission
    if (!ctx.permissions.includes("INVITE_COMPANY_USER")) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = InviteUserSchema.parse(body);

    const { fullName, email, phone, roleId } = validatedData;
    const targetEmail = email.toLowerCase().trim();

    // 1. Validate the selected role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Selected role not found." }, { status: 400 });
    }

    // Restriction: Cannot assign platform-only or external roles from company setting
    const forbiddenRoles = ["Agent", "Applicant"];
    if (forbiddenRoles.includes(role.name)) {
      return NextResponse.json({ error: `Cannot invite users with the '${role.name}' role from here.` }, { status: 400 });
    }

    // Restriction: Only company owners (isOwner = true in membership) can invite/assign Super Admin (Company Owner)
    const currentMembership = await prisma.userMembership.findUnique({
      where: { id: ctx.membershipId || "" },
    });

    if (role.name === "Super Admin" && (!currentMembership || !currentMembership.isOwner)) {
      return NextResponse.json({ error: "Only company owners can invite or assign the Super Admin role." }, { status: 403 });
    }

    // 2. Check if user already has membership in this company
    const existingMembership = await prisma.userMembership.findFirst({
      where: {
        companyId: ctx.activeCompanyId,
        user: { email: targetEmail },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member of this company." }, { status: 400 });
    }

    // 3. Find or create the User
    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    let isNewUser = false;
    let needsActivation = false;

    if (!user) {
      isNewUser = true;
      needsActivation = true;

      // Create new user with temp unusable password
      const randomUnusablePassword = crypto.randomUUID() + "-" + crypto.randomUUID();
      const passwordHash = await argon2.hash(randomUnusablePassword);

      user = await prisma.user.create({
        data: {
          email: targetEmail,
          fullName,
          phone: phone || null,
          passwordHash,
          roleId: role.id, // Primary role fallback, though memberships override this in SaaS mode
          isActive: true,
        },
      });
    }

    // 4. Create the UserMembership for activeCompanyId
    const membershipStatus = isNewUser ? "INVITED" : "ACTIVE";
    const newMembership = await prisma.userMembership.create({
      data: {
        userId: user.id,
        companyId: ctx.activeCompanyId,
        roleId: role.id,
        status: membershipStatus,
        isOwner: role.name === "Super Admin", // If they are assigned Super Admin, they become owner
      },
      include: {
        company: true,
      },
    });

    // 5. Generate activation token if new user
    let activationLink: string | null = null;
    let emailSent = false;
    let emailWarning: string | null = null;

    if (isNewUser) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await prisma.accountActivationToken.create({
        data: {
          userId: user.id,
          companyId: ctx.activeCompanyId,
          tokenHash,
          type: "COMPANY_USER_INVITATION",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Failsafe SMTP trigger
      try {
        const emailRes = await sendCompanyUserInvitation(
          user.email,
          user.fullName,
          newMembership.company.name,
          rawToken,
          ctx.activeCompanyId,
          user.id
        );
        emailSent = emailRes.sent;
        activationLink = emailRes.activationLink || null;
        if (!emailRes.sent) {
          emailWarning = emailRes.reason || "SMTP not configured.";
        }
      } catch (err: any) {
        console.error("Failsafe: failed to send user invitation email:", err);
        emailWarning = err.message || "Failed to transmit invitation email.";
        activationLink = `/activate-account?token=${rawToken}`;
      }
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        roleName: ctx.roleName,
        actionType: "INVITE_COMPANY_USER",
        tableName: "UserMembership",
        recordId: newMembership.id,
        companyId: ctx.activeCompanyId,
        delta: {
          invitedUserId: user.id,
          invitedUserEmail: user.email,
          roleName: role.name,
          membershipStatus,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      membership: {
        id: newMembership.id,
        status: newMembership.status,
        role: role.name,
        user: {
          email: user.email,
          fullName: user.fullName,
        },
      },
      emailSent,
      emailWarning,
      activationLink, // Will contain either full SMTP app link or local route for manual sharing
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("POST /api/company/users/invite Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

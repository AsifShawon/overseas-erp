import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import * as argon2 from "argon2";
import { z } from "zod";
import crypto from "crypto";

// Zod validation schema for portal access payload
const ProvisionPortalAccessSchema = z.object({
  mode: z.enum(["INVITE_LINK", "TEMP_PASSWORD"]),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().optional().nullable(),
});

/**
 * POST /api/applicants/[id]/portal-access
 * Authorize and provision portal login credentials or activation links for an applicant.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // 1. Fetch the applicant from database
    const applicant = await prisma.applicant.findUnique({
      where: { id },
    });

    if (!applicant) {
      return NextResponse.json({ error: "Applicant record not found." }, { status: 404 });
    }

    // 2. Role-based authorization check
    const permissions = await getUserPermissions(userId);
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    let isAuthorized = isSuperOrOps;

    if (roleName === "Agent") {
      const agent = await prisma.agent.findUnique({
        where: { userId },
      });
      if (agent && applicant.agentId === agent.id) {
        isAuthorized = true;
      }
    } else if (
      roleName === "HR Officer" ||
      permissions.includes("CREATE_APPLICANT") ||
      permissions.includes("UPDATE_APPLICANT")
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    // 3. If applicant already has userId, return existing portal status and do not create duplicate User.
    if (applicant.userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: applicant.userId },
        include: { role: true },
      });
      return NextResponse.json({
        success: true,
        status: "ACTIVE",
        message: "Applicant already has portal access configured.",
        userId: applicant.userId,
        email: existingUser?.email || applicant.email,
        fullName: existingUser?.fullName || applicant.fullName,
        isActive: existingUser?.isActive ?? true,
      });
    }

    // 4. Parse and validate payload
    const body = await request.json().catch(() => ({}));
    const validatedData = ProvisionPortalAccessSchema.parse(body);

    const finalEmail = (validatedData.email || applicant.email || "").trim();
    if (!finalEmail) {
      return NextResponse.json(
        { error: "Email address is required to provision portal access." },
        { status: 400 }
      );
    }

    // 5. Validate email uniqueness to prevent duplicate User records
    const emailConflict = await prisma.user.findUnique({
      where: { email: finalEmail },
    });
    if (emailConflict) {
      return NextResponse.json(
        { error: "A user account with this email address already exists." },
        { status: 400 }
      );
    }

    // 6. Retrieve Applicant role from Role table
    const applicantRole = await prisma.role.findUnique({
      where: { name: "Applicant" },
    });
    if (!applicantRole) {
      return NextResponse.json(
        { error: "Internal Configuration Error: 'Applicant' role is not defined in the system." },
        { status: 500 }
      );
    }

    let tempPasswordPlain: string | undefined = undefined;
    let passwordHash = "";
    let devActivationLink: string | undefined = undefined;

    if (validatedData.mode === "INVITE_LINK") {
      // Create user with a random unusable initial password hash
      const randomUnusablePassword = crypto.randomUUID() + "-" + crypto.randomUUID();
      passwordHash = await argon2.hash(randomUnusablePassword);
      
      // Activation token gap handling: Since ActivationToken model does not exist, return dev activation link in development
      const mockToken = crypto.randomBytes(32).toString("hex");
      if (process.env.NODE_ENV !== "production") {
        devActivationLink = `/activate?token=${mockToken}&email=${encodeURIComponent(finalEmail)}`;
      }
    } else {
      // TEMP_PASSWORD mode: generate strong random temporary password
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let pass = "";
      for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      tempPasswordPlain = pass;
      passwordHash = await argon2.hash(tempPasswordPlain);
    }

    // 7. Start database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create User with role Applicant
      const newUser = await tx.user.create({
        data: {
          email: finalEmail,
          passwordHash,
          fullName: applicant.fullName,
          phone: validatedData.phone || applicant.phone || null,
          roleId: applicantRole.id,
          isActive: true,
        },
      });

      // Link Applicant.userId to newly created User.id
      const updatedApplicant = await tx.applicant.update({
        where: { id },
        data: {
          userId: newUser.id,
          email: finalEmail, // Update candidate record's email if provided/different
        },
      });

      // Create Notification for the newly created user
      await tx.notification.create({
        data: {
          userId: newUser.id,
          title: "Portal Access Provisioned",
          message: "Your applicant portal login access has been successfully configured. You can now log in.",
          isRead: false,
        },
      });

      return { newUser, updatedApplicant };
    });

    // 8. Create AuditLog entry recording this event (raw password and token are strictly excluded)
    await prisma.auditLog.create({
      data: {
        userId,
        roleName,
        actionType: "CREATE_APPLICANT_PORTAL_ACCESS",
        tableName: "User/Applicant",
        recordId: applicant.id,
        delta: {
          mode: validatedData.mode,
          email: finalEmail,
          phone: validatedData.phone || applicant.phone || null,
          userId: result.newUser.id,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    // 9. Return result payload
    return NextResponse.json({
      success: true,
      mode: validatedData.mode,
      userId: result.newUser.id,
      username: finalEmail,
      tempPassword: tempPasswordPlain, // Returned ONLY once in this response
      devActivationLink, // Returned only in development mode
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    console.error("POST /api/applicants/[id]/portal-access Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

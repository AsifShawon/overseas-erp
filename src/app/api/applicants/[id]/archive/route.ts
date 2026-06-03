import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import {
  applicantDetailInclude,
  serializeApplicantDetail,
} from "@/lib/applicant-detail";
import { z } from "zod";

// Zod validation schema for archiving/restoring a candidate
const ArchiveSchema = z.object({
  action: z.enum(["ARCHIVE", "RESTORE"]),
  reason: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { activeCompanyId, userId, roleName, permissions } = await getCompanyContextOrThrow(request);

    // 2. Boundary Check: Applicant and Agent roles are strictly blocked from this mutation
    if (roleName === "Applicant" || roleName === "Agent") {
      return NextResponse.json(
        { error: "Forbidden. Sourcing agents and candidates are not authorized to archive or restore files." },
        { status: 403 }
      );
    }

    // 3. RBAC Checks: Allow Super Admin, Operations Admin, or staff with UPDATE_APPLICANT or ARCHIVE_APPLICANT
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    const hasPermission =
      permissions.includes("ARCHIVE_APPLICANT") ||
      permissions.includes("UPDATE_APPLICANT");

    if (!isSuperOrOps && !hasPermission) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to archive or restore candidate files." },
        { status: 403 }
      );
    }

    // 4. Validate Request Body
    const body = await request.json();
    const validatedData = ArchiveSchema.parse(body);
    const { action, reason } = validatedData;

    // Archive reason is mandatory
    if (action === "ARCHIVE" && (!reason || reason.trim().length < 5)) {
      return NextResponse.json(
        { error: "A valid explanation (minimum 5 characters) is required to soft-archive a candidate file." },
        { status: 400 }
      );
    }

    // 5. Execute DB Transaction
    const updatedApplicant = await prisma.$transaction(async (tx) => {
      // Find applicant within active company
      const applicant = await tx.applicant.findFirst({
        where: { id, companyId: activeCompanyId },
      });

      if (!applicant) {
        throw new Error("Applicant record not found.");
      }

      // Check if state is already modified
      if (action === "ARCHIVE" && applicant.isArchived) {
        throw new Error("Applicant is already archived.");
      }
      if (action === "RESTORE" && !applicant.isArchived) {
        throw new Error("Applicant is already active.");
      }

      const now = new Date();

      // Mutate soft-archive attributes
      const updated = await tx.applicant.update({
        where: { id },
        data: {
          isArchived: action === "ARCHIVE",
          archivedAt: action === "ARCHIVE" ? now : null,
        },
      });

      // Write Audit Log delta
      await tx.auditLog.create({
        data: {
          userId,
          roleName,
          actionType: action === "ARCHIVE" ? "ARCHIVE_APPLICANT" : "RESTORE_APPLICANT",
          tableName: "Applicant",
          recordId: id,
          delta: {
            before: { isArchived: applicant.isArchived, archivedAt: applicant.archivedAt },
            after: { isArchived: updated.isArchived, archivedAt: updated.archivedAt },
            reason: reason || "No explanation provided",
          } as any,
          companyId: activeCompanyId,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      // Retrieve administrative staff users to dispatch system alerts
      const adminUsers = await tx.user.findMany({
        where: {
          memberships: {
            some: {
              companyId: activeCompanyId,
              role: {
                name: { in: ["Super Admin", "Operations Admin"] },
              },
            },
          },
          isActive: true,
        },
        select: { id: true },
      });

      // Alert initiating user
      await tx.notification.create({
        data: {
          userId,
          title: action === "ARCHIVE" ? "Dossier Soft-Archived" : "Dossier Restored",
          message: `Applicant file for "${applicant.fullName}" was successfully ${
            action === "ARCHIVE" ? "soft-archived" : "restored"
          }. Reason: "${reason || "No explanation provided"}".`,
          companyId: activeCompanyId,
        },
      });

      // Alert all other Admins
      for (const admin of adminUsers) {
        if (admin.id !== userId) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              title: action === "ARCHIVE" ? "Candidate File Soft-Archived" : "Candidate File Restored",
              message: `Staff user "${roleName}" has ${
                action === "ARCHIVE" ? "soft-archived" : "restored"
              } candidate "${applicant.fullName}". Reason: "${reason || "None"}".`,
              companyId: activeCompanyId,
            },
          });
        }
      }

      // Fetch and return the fully nested applicant payload
      return tx.applicant.findFirst({
        where: { id, companyId: activeCompanyId },
        include: applicantDetailInclude,
      });
    });

    return NextResponse.json(serializeApplicantDetail(updatedApplicant));
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
    }
    
    // Check specific transaction error messages
    const message = error?.message || "";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("already")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("PATCH /api/applicants/[id]/archive Error:", error);
    return NextResponse.json({ error: "An internal server error occurred while archiving." }, { status: 500 });
  }
}

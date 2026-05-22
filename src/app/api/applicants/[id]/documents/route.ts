// src/app/api/applicants/[id]/documents/route.ts
// POST /api/applicants/[id]/documents - Upload applicant compliance document

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { saveUploadedFile, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } from "@/lib/storage";

// Allowed DocumentType enum from schema
const ALLOWED_DOCUMENT_TYPES = [
  "PASSPORT",
  "PHOTO",
  "CV",
  "MEDICAL_REPORT",
  "POLICE_CLEARANCE",
  "VISA_STICKER",
  "AIR_TICKET",
  "OTHER",
];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Authenticate Request
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // 2. Read applicant info
    const applicant = await prisma.applicant.findUnique({
      where: { id },
    });

    if (!applicant) {
      return NextResponse.json({ error: "Applicant record not found." }, { status: 404 });
    }

    // 3. Enforce boundary scopes
    // Applicant Boundary
    if (roleName === "Applicant") {
      const isOwnProfile = applicant.userId === userId || applicant.id === id;
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        include: { applicantProfile: true },
      });
      if (userProfile?.applicantProfile?.id !== id && !isOwnProfile) {
        return NextResponse.json(
          { error: "Forbidden. You can only upload files to your own profile." },
          { status: 403 }
        );
      }
    }

    // Agent Boundary
    else if (roleName === "Agent") {
      const agent = await prisma.agent.findUnique({
        where: { userId },
      });
      if (!agent || applicant.agentId !== agent.id) {
        return NextResponse.json(
          { error: "Forbidden. Sourcing boundaries restrict uploading files for this candidate." },
          { status: 403 }
        );
      }
    }

    // 4. RBAC check: Non-Super/Ops Admins must hold UPLOAD_DOCUMENT permission
    const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
    if (!isSuperOrOps && roleName !== "Applicant") {
      const permissions = await getUserPermissions(userId);
      if (!permissions.includes("UPLOAD_DOCUMENT")) {
        return NextResponse.json(
          { error: "Forbidden. Insufficient permissions to upload compliance documents." },
          { status: 403 }
        );
      }
    }

    // 5. Parse multipart/form-data
    const formData = await request.formData();
    const documentType = formData.get("documentType") as string | null;
    const file = formData.get("file") as Blob | null;
    const expiryDateStr = formData.get("expiryDate") as string | null;
    const remarks = formData.get("remarks") as string | null;

    // 6. Validate input parameters
    if (!documentType || !ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json({ error: `Invalid document type. Allowed types are: ${ALLOWED_DOCUMENT_TYPES.join(", ")}` }, { status: 400 });
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file was uploaded or file is invalid." }, { status: 400 });
    }

    const originalName = (file as any).name || "uploaded_file";

    // 7. Store in secure private storage helper
    let savedPath = "";
    let sanitizedOriginalName = "";
    try {
      const storageResult = await saveUploadedFile(id, file, originalName, documentType);
      savedPath = storageResult.fileUrl;
      sanitizedOriginalName = storageResult.savedFileName;
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "File upload failed." }, { status: 400 });
    }

    // 8. Commit changes in dynamic database transaction
    const dbExpiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

    await prisma.$transaction(async (tx) => {
      // Create Document Row
      const newDoc = await tx.document.create({
        data: {
          applicantId: id,
          documentType: documentType as any,
          fileName: sanitizedOriginalName,
          fileUrl: savedPath,
          status: "PENDING_VERIFICATION",
          expiryDate: dbExpiryDate,
        },
      });

      // Create Audit Log entry (uploadedById is captured in userId of AuditLog)
      await tx.auditLog.create({
        data: {
          userId,
          roleName,
          actionType: "UPLOAD_DOCUMENT",
          tableName: "Document",
          recordId: newDoc.id,
          delta: {
            originalName: originalName,
            fileName: sanitizedOriginalName,
            fileUrl: savedPath,
            documentType,
            fileSize: file.size,
            expiryDate: dbExpiryDate ? dbExpiryDate.toISOString() : null,
            remarks: remarks || null,
          } as any,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      // Generate alert notifications for relevant staff (Operations Admins and Documentation Officers)
      const staffUsers = await tx.user.findMany({
        where: {
          role: {
            name: {
              in: ["Super Admin", "Operations Admin", "Documentation Officer"],
            },
          },
          isActive: true,
        },
        select: { id: true },
      });

      if (staffUsers.length > 0) {
        await tx.notification.createMany({
          data: staffUsers.map((u) => ({
            userId: u.id,
            title: "New Document Sourced",
            message: `A new ${documentType.replace("_", " ")} document has been uploaded for applicant ${applicant.fullName} and requires verification.`,
          })),
        });
      }
    });

    // 9. Fetch and return complete updated applicant dossier for seamless UI synchronization
    const fullUpdatedApplicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            agentCode: true,
            companyName: true,
          },
        },
        jobOrder: true,
        workflows: {
          orderBy: {
            timestamp: "desc",
          },
        },
        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
        receipts: {
          orderBy: {
            createdAt: "desc",
          },
        },
        ledgerEntries: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    });

    return NextResponse.json(fullUpdatedApplicant);
  } catch (error) {
    console.error("POST /api/applicants/[id]/documents Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

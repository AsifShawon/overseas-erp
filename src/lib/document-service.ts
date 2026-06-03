import { NextResponse } from "next/server";

import {
  DocumentStatus,
  type DocumentType,
  type Prisma,
} from "../../generated/prisma/client";
import type { AccessTokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserPermissions } from "@/lib/rbac";
import {
  getDocumentStorageProvider,
  getLocalFileContentType,
  getStorageProviderByName,
  readLocalDocumentFile,
} from "@/lib/storage";
import { SUPABASE_STORAGE_BUCKET } from "@/lib/supabase/server";
import {
  applicantDetailInclude,
  serializeApplicantDetail,
} from "@/lib/applicant-detail";

export const DOCUMENT_TYPE_VALUES = [
  "PASSPORT",
  "PHOTO",
  "CV",
  "MEDICAL_REPORT",
  "POLICE_CLEARANCE",
  "VISA_STICKER",
  "AIR_TICKET",
  "OTHER",
] as const satisfies readonly DocumentType[];

export type DocumentListItem = {
  id: string;
  applicantId: string;
  applicantName: string;
  documentType: string;
  fileName: string;
  status: string;
  expiryDate: string | null;
  storageProvider: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  verifiedById: string | null;
  verifiedByName: string | null;
  downloadUrl: string;
};

type DocumentWithApplicant = Prisma.DocumentGetPayload<{
  include: {
    applicant: true;
  };
}>;

type DocumentUser = AccessTokenPayload & { activeCompanyId: string };

type UploadDocumentInput = {
  file: File;
  requestedApplicantId?: string | null;
  documentType: string;
  expiryDate?: string | null;
  remarks?: string | null;
  request: Request;
  user: DocumentUser;
};

type UpdateDocumentInput = {
  documentId: string;
  status: "VERIFIED" | "REJECTED";
  expiryDate?: string | null;
  notes?: string | null;
  request: Request;
  user: DocumentUser;
};

type DeleteDocumentInput = {
  documentId: string;
  request: Request;
  user: DocumentUser;
};

type DocumentListFilters = {
  applicantId?: string | null;
  documentType?: string | null;
  status?: string | null;
};

export class DocumentServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "DocumentServiceError";
    this.status = status;
  }
}

function getRequestIpAddress(request: Request): string {
  return request.headers.get("x-forwarded-for") || "127.0.0.1";
}

function isSuperOrOps(roleName: string): boolean {
  return roleName === "Super Admin" || roleName === "Operations Admin";
}

async function getApplicantProfileIdForUser(userId: string): Promise<string | null> {
  const applicant = await prisma.applicant.findUnique({
    where: { userId },
    select: { id: true },
  });

  return applicant?.id ?? null;
}

async function getAgentIdForUser(userId: string): Promise<string | null> {
  const agent = await prisma.agent.findUnique({
    where: { userId },
    select: { id: true },
  });

  return agent?.id ?? null;
}

async function getStaffPermissions(user: DocumentUser): Promise<string[]> {
  if (isSuperOrOps(user.roleName)) {
    return [];
  }

  return getUserPermissions(user.userId);
}

async function resolveApplicantIdForUpload(
  user: DocumentUser,
  requestedApplicantId?: string | null
): Promise<string> {
  if (user.roleName === "Applicant") {
    const applicantId = await getApplicantProfileIdForUser(user.userId);

    if (!applicantId) {
      throw new DocumentServiceError(
        404,
        "No applicant profile is linked to this user account."
      );
    }

    return applicantId;
  }

  if (!requestedApplicantId) {
    throw new DocumentServiceError(400, "Applicant ID is required.");
  }

  return requestedApplicantId;
}

async function assertUploadAccess(
  user: DocumentUser,
  applicant: { id: string; userId: string | null; agentId: string | null }
): Promise<void> {
  if (user.roleName === "Applicant") {
    const ownApplicantId = await getApplicantProfileIdForUser(user.userId);
    if (ownApplicantId !== applicant.id) {
      throw new DocumentServiceError(
        403,
        "Forbidden. You can only upload files to your own profile."
      );
    }
    return;
  }

  if (user.roleName === "Agent") {
    const agentId = await getAgentIdForUser(user.userId);
    if (!agentId || applicant.agentId !== agentId) {
      throw new DocumentServiceError(
        403,
        "Forbidden. Sourcing boundaries restrict uploading files for this candidate."
      );
    }
    return;
  }

  if (isSuperOrOps(user.roleName)) {
    return;
  }

  const permissions = await getStaffPermissions(user);
  if (!permissions.includes("UPLOAD_DOCUMENT")) {
    throw new DocumentServiceError(
      403,
      "Forbidden. Insufficient permissions to upload compliance documents."
    );
  }
}

async function assertVerifyAccess(user: DocumentUser): Promise<void> {
  if (isSuperOrOps(user.roleName) || user.roleName === "Documentation Officer") {
    return;
  }

  const permissions = await getStaffPermissions(user);
  if (!permissions.includes("VERIFY_DOCUMENT")) {
    throw new DocumentServiceError(
      403,
      "Forbidden. Insufficient permissions to verify compliance documents."
    );
  }
}

async function assertDeleteAccess(user: DocumentUser): Promise<void> {
  if (isSuperOrOps(user.roleName)) {
    return;
  }

  const permissions = await getStaffPermissions(user);
  if (!permissions.includes("VERIFY_DOCUMENT")) {
    throw new DocumentServiceError(
      403,
      "Forbidden. Insufficient permissions to delete compliance documents."
    );
  }
}

async function assertDownloadAccess(
  user: DocumentUser,
  applicant: { id: string; userId: string | null; agentId: string | null }
): Promise<void> {
  if (user.roleName === "Applicant") {
    const ownApplicantId = await getApplicantProfileIdForUser(user.userId);
    if (ownApplicantId !== applicant.id) {
      throw new DocumentServiceError(
        403,
        "Forbidden. You can only access your own documents."
      );
    }
    return;
  }

  if (user.roleName === "Agent") {
    const agentId = await getAgentIdForUser(user.userId);
    if (!agentId || applicant.agentId !== agentId) {
      throw new DocumentServiceError(
        403,
        "Forbidden. Sourcing boundaries restrict access to this document."
      );
    }
    return;
  }

  if (isSuperOrOps(user.roleName)) {
    return;
  }

  const permissions = await getStaffPermissions(user);
  if (
    !permissions.includes("VIEW_APPLICANTS") &&
    !permissions.includes("UPLOAD_DOCUMENT") &&
    !permissions.includes("VERIFY_DOCUMENT")
  ) {
    throw new DocumentServiceError(
      403,
      "Forbidden. Insufficient permissions to view compliance files."
    );
  }
}

async function assertListAccess(
  user: DocumentUser,
  filters: DocumentListFilters
): Promise<Prisma.DocumentWhereInput> {
  if (user.roleName === "Applicant") {
    const applicantId = await getApplicantProfileIdForUser(user.userId);
    if (!applicantId) {
      throw new DocumentServiceError(
        404,
        "No applicant profile is linked to this user account."
      );
    }

    if (filters.applicantId && filters.applicantId !== applicantId) {
      throw new DocumentServiceError(
        403,
        "Forbidden. You can only view your own documents."
      );
    }

    return { applicantId };
  }

  if (user.roleName === "Agent") {
    const agentId = await getAgentIdForUser(user.userId);
    if (!agentId) {
      throw new DocumentServiceError(
        403,
        "Forbidden. No agent profile is linked to this user account."
      );
    }

    return {
      applicant: {
        agentId,
      },
    };
  }

  if (!isSuperOrOps(user.roleName)) {
    const permissions = await getStaffPermissions(user);
    if (
      !permissions.includes("VIEW_APPLICANTS") &&
      !permissions.includes("UPLOAD_DOCUMENT") &&
      !permissions.includes("VERIFY_DOCUMENT")
    ) {
      throw new DocumentServiceError(
        403,
        "Forbidden. Insufficient permissions to view documents."
      );
    }
  }

  return {};
}

function validateDocumentType(documentType: string): asserts documentType is DocumentType {
  if (!DOCUMENT_TYPE_VALUES.includes(documentType as DocumentType)) {
    throw new DocumentServiceError(
      400,
      `Invalid document type. Allowed types are: ${DOCUMENT_TYPE_VALUES.join(", ")}`
    );
  }
}

function parseExpiryDate(expiryDate?: string | null): Date | null {
  if (!expiryDate) {
    return null;
  }

  const parsed = new Date(expiryDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new DocumentServiceError(400, "Invalid expiry date.");
  }

  return parsed;
}

async function loadDocumentWithApplicant(
  documentId: string,
  user: DocumentUser
): Promise<DocumentWithApplicant> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      applicant: true,
    },
  });

  if (!document) {
    throw new DocumentServiceError(404, "Document record not found.");
  }

  if (!user.isPlatformAdmin && document.companyId !== user.activeCompanyId) {
    throw new DocumentServiceError(404, "Document record not found.");
  }

  return document;
}

function getDocumentProvider(document: {
  storageProvider: string;
  storagePath: string | null;
  fileUrl: string;
  bucket: string | null;
}) {
  const storageProviderName =
    document.storageProvider === "local" ? "local" : "supabase";
  const provider = getStorageProviderByName(storageProviderName);
  const storagePath = document.storagePath ?? document.fileUrl.replace(/^storage\//, "");
  const bucket =
    document.bucket ??
    (storageProviderName === "supabase" ? SUPABASE_STORAGE_BUCKET : undefined);

  return {
    provider,
    storagePath,
    bucket,
    storageProviderName,
  };
}

export async function fetchApplicantDetail(applicantId: string, user: DocumentUser) {
  const applicant = await prisma.applicant.findFirst({
    where: { id: applicantId, companyId: user.activeCompanyId },
    include: applicantDetailInclude,
  });

  if (!applicant) {
    throw new DocumentServiceError(404, "Applicant record not found.");
  }

  return serializeApplicantDetail(applicant);
}

export async function listDocumentsForUser(
  user: DocumentUser,
  filters: DocumentListFilters
): Promise<DocumentListItem[]> {
  const scopedWhere = await assertListAccess(user, filters);
  const where: Prisma.DocumentWhereInput = {
    ...scopedWhere,
    companyId: user.activeCompanyId, // FORCE TENANT ISOLATION
    ...(filters.applicantId ? { applicantId: filters.applicantId } : {}),
    ...(filters.status ? { status: filters.status as DocumentStatus } : {}),
    ...(filters.documentType
      ? { documentType: filters.documentType as DocumentType }
      : {}),
  };

  const documents = await prisma.document.findMany({
    where,
    include: {
      applicant: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const verifiedByIds = documents
    .map((document) => document.verifiedById)
    .filter((value): value is string => Boolean(value));
  const users = verifiedByIds.length
    ? await prisma.user.findMany({
        where: {
          id: {
            in: verifiedByIds,
          },
        },
        select: {
          id: true,
          fullName: true,
        },
      })
    : [];
  const userNameById = new Map(users.map((item) => [item.id, item.fullName]));

  return documents.map((document) => ({
    id: document.id,
    applicantId: document.applicantId,
    applicantName: document.applicant.fullName,
    documentType: document.documentType,
    fileName: document.fileName,
    status: document.status,
    expiryDate: document.expiryDate ? document.expiryDate.toISOString() : null,
    storageProvider: document.storageProvider,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    verifiedById: document.verifiedById,
    verifiedByName: document.verifiedById
      ? userNameById.get(document.verifiedById) ?? null
      : null,
    downloadUrl: `/api/documents/${document.id}/download`,
  }));
}

export async function uploadDocumentForUser(input: UploadDocumentInput) {
  const applicantId = await resolveApplicantIdForUpload(
    input.user,
    input.requestedApplicantId
  );
  validateDocumentType(input.documentType);
  const documentType = input.documentType as DocumentType;
  const expiryDate = parseExpiryDate(input.expiryDate);

  const applicant = await prisma.applicant.findFirst({
    where: { id: applicantId, companyId: input.user.activeCompanyId },
    select: {
      id: true,
      fullName: true,
      userId: true,
      agentId: true,
    },
  });

  if (!applicant) {
    throw new DocumentServiceError(404, "Applicant record not found.");
  }

  await assertUploadAccess(input.user, applicant);

  const storageProvider = getDocumentStorageProvider();
  let uploadedFile:
    | Awaited<
        ReturnType<typeof storageProvider.uploadApplicantDocumentFile>
      >
    | null = null;

  try {
    uploadedFile = await storageProvider.uploadApplicantDocumentFile({
      file: input.file,
      applicantId,
      documentType,
    });
    const uploadedDocumentFile = uploadedFile;

    const createdDocument = await prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          applicantId,
          documentType,
          fileUrl: uploadedDocumentFile.storagePath,
          fileName: uploadedDocumentFile.fileName,
          status: DocumentStatus.PENDING_VERIFICATION,
          expiryDate,
          storageProvider: uploadedDocumentFile.storageProvider,
          bucket: uploadedDocumentFile.bucket ?? null,
          storagePath: uploadedDocumentFile.storagePath,
          mimeType: uploadedDocumentFile.mimeType ?? input.file.type ?? null,
          fileSize: uploadedDocumentFile.fileSize ?? input.file.size,
          companyId: input.user.activeCompanyId, // SET TENANT ID
        },
      });

      await tx.auditLog.create({
        data: {
          userId: input.user.userId,
          roleName: input.user.roleName,
          actionType: "UPLOAD_DOCUMENT",
          tableName: "Document",
          recordId: document.id,
          delta: {
            originalName: input.file.name,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            storageProvider: document.storageProvider,
            storagePath: document.storagePath,
            bucket: document.bucket,
            documentType: document.documentType,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            expiryDate: expiryDate?.toISOString() ?? null,
            remarks: input.remarks ?? null,
          } as Prisma.InputJsonValue,
          companyId: input.user.activeCompanyId,
          ipAddress: getRequestIpAddress(input.request),
        },
      });

      const staffUsers = await tx.user.findMany({
        where: {
          memberships: {
            some: {
              companyId: input.user.activeCompanyId,
              role: {
                name: {
                  in: ["Super Admin", "Operations Admin", "Documentation Officer"],
                },
              },
            },
          },
          isActive: true,
        },
        select: { id: true },
      });

      if (staffUsers.length > 0) {
        await tx.notification.createMany({
          data: staffUsers.map((staffUser) => ({
            userId: staffUser.id,
            title: "New Document Sourced",
            message: `A new ${documentType.replace(/_/g, " ")} document has been uploaded for applicant ${applicant.fullName} and requires verification.`,
            companyId: input.user.activeCompanyId,
          })),
        });
      }

      return document;
    });

    return createdDocument;
  } catch (error) {
    if (uploadedFile) {
      try {
        await storageProvider.deleteApplicantDocumentFile(uploadedFile.storagePath, {
          bucket: uploadedFile.bucket,
        });
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded document after DB error:", cleanupError);
      }
    }

    throw error;
  }
}

export async function updateDocumentForUser(input: UpdateDocumentInput) {
  await assertVerifyAccess(input.user);

  const document = await loadDocumentWithApplicant(input.documentId, input.user);
  const expiryDate = parseExpiryDate(input.expiryDate);

  const updatedDocument = await prisma.$transaction(async (tx) => {
    const nextDocument = await tx.document.update({
      where: { id: input.documentId },
      data: {
        status: input.status,
        verifiedById: input.user.userId,
        expiryDate,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.user.userId,
        roleName: input.user.roleName,
        actionType: input.status === "VERIFIED" ? "VERIFY_DOCUMENT" : "REJECT_DOCUMENT",
        tableName: "Document",
        recordId: input.documentId,
        delta: {
          before: {
            status: document.status,
            verifiedById: document.verifiedById,
            expiryDate: document.expiryDate?.toISOString() ?? null,
          },
          after: {
            status: input.status,
            verifiedById: input.user.userId,
            expiryDate: expiryDate?.toISOString() ?? null,
          },
          notes: input.notes ?? null,
          verifiedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
        companyId: input.user.activeCompanyId,
        ipAddress: getRequestIpAddress(input.request),
      },
    });

    if (document.applicant.userId) {
      await tx.notification.create({
        data: {
          userId: document.applicant.userId,
          title: `Compliance File: ${input.status === "VERIFIED" ? "Approved" : "Rejected"}`,
          message: `Your document (${document.documentType.replace(/_/g, " ")}) has been reviewed and ${input.status.toLowerCase()}.${input.notes ? ` Notes: ${input.notes}` : ""}`,
          companyId: input.user.activeCompanyId,
        },
      });
    }

    if (document.applicant.agentId) {
      const agent = await tx.agent.findUnique({
        where: { id: document.applicant.agentId },
        select: { userId: true },
      });

      if (agent) {
        await tx.notification.create({
          data: {
            userId: agent.userId,
            title: "Compliance Review Alert",
            message: `Applicant ${document.applicant.fullName}'s ${document.documentType.replace(/_/g, " ")} document was ${input.status.toLowerCase()}.${input.notes ? ` Notes: ${input.notes}` : ""}`,
            companyId: input.user.activeCompanyId,
          },
        });
      }
    }

    return nextDocument;
  });

  return updatedDocument;
}

export async function deleteDocumentForUser(input: DeleteDocumentInput) {
  await assertDeleteAccess(input.user);

  const document = await loadDocumentWithApplicant(input.documentId, input.user);
  const { provider, storagePath, bucket } = getDocumentProvider(document);

  await provider.deleteApplicantDocumentFile(storagePath, { bucket });

  await prisma.$transaction(async (tx) => {
    await tx.document.delete({
      where: { id: input.documentId },
    });

    await tx.auditLog.create({
      data: {
        userId: input.user.userId,
        roleName: input.user.roleName,
        actionType: "DELETE_DOCUMENT",
        tableName: "Document",
        recordId: input.documentId,
        delta: {
          documentType: document.documentType,
          fileName: document.fileName,
          storageProvider: document.storageProvider,
          storagePath: document.storagePath ?? document.fileUrl,
          bucket: document.bucket,
        } as Prisma.InputJsonValue,
        companyId: input.user.activeCompanyId,
        ipAddress: getRequestIpAddress(input.request),
      },
    });
  });

  return {
    id: document.id,
    applicantId: document.applicantId,
  };
}

export async function createDocumentDownloadResponse(
  user: DocumentUser,
  documentId: string
) {
  const document = await loadDocumentWithApplicant(documentId, user);
  await assertDownloadAccess(user, document.applicant);

  const { provider, storagePath, bucket, storageProviderName } =
    getDocumentProvider(document);

  if (storageProviderName === "supabase") {
    const signedUrl = await provider.createDocumentDownloadUrl(storagePath, {
      bucket,
    });

    return NextResponse.redirect(signedUrl);
  }

  const fileBuffer = await readLocalDocumentFile(storagePath);
  const contentType = document.mimeType || getLocalFileContentType(storagePath);

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function createLocalStorageDownloadResponse(
  user: DocumentUser,
  storagePath: string
) {
  const document = await prisma.document.findUnique({
    where: { storagePath },
    include: {
      applicant: true,
    },
  });

  if (!document || (!user.isPlatformAdmin && document.companyId !== user.activeCompanyId)) {
    throw new DocumentServiceError(404, "Document record not found.");
  }

  await assertDownloadAccess(user, document.applicant);

  const fileBuffer = await readLocalDocumentFile(storagePath);
  const contentType = document.mimeType || getLocalFileContentType(storagePath);

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth";
import {
  deleteDocumentForUser,
  DocumentServiceError,
  updateDocumentForUser,
} from "@/lib/document-service";

const UpdateDocumentSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]).optional(),
  expiryDate: z.string().nullable().optional(),
  notes: z.string().optional(),
  remarks: z.string().optional(),
});

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const payload = UpdateDocumentSchema.parse(body);

    if (!payload.status) {
      return NextResponse.json(
        { error: "Document status is required." },
        { status: 400 }
      );
    }

    const document = await updateDocumentForUser({
      user: decoded,
      request,
      documentId: id,
      status: payload.status,
      expiryDate: payload.expiryDate,
      notes: payload.notes ?? payload.remarks,
    });

    return NextResponse.json({
      document: {
        id: document.id,
        applicantId: document.applicantId,
        documentType: document.documentType,
        fileName: document.fileName,
        status: document.status,
        expiryDate: document.expiryDate?.toISOString() ?? null,
        storageProvider: document.storageProvider,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
        verifiedById: document.verifiedById,
        downloadUrl: `/api/documents/${document.id}/download`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }
    if (error instanceof DocumentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("PATCH /api/documents/[id] Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await deleteDocumentForUser({
      user: decoded,
      request,
      documentId: id,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      applicantId: result.applicantId,
    });
  } catch (error) {
    if (error instanceof DocumentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("DELETE /api/documents/[id] Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

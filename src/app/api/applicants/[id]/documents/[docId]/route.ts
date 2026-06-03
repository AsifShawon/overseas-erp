import { NextResponse } from "next/server";
import { z } from "zod";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import {
  deleteDocumentForUser,
  DocumentServiceError,
  fetchApplicantDetail,
  updateDocumentForUser,
} from "@/lib/document-service";

const VerifySchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  remarks: z.string().optional(),
  expiryDate: z.string().nullable().optional(),
});

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const decoded = await getCompanyContextOrThrow(request);

    const body = await request.json();
    const payload = VerifySchema.parse(body);

    await updateDocumentForUser({
      user: decoded,
      request,
      documentId: docId,
      status: payload.status,
      notes: payload.remarks,
      expiryDate: payload.expiryDate,
    });

    const applicant = await fetchApplicantDetail(id, decoded);
    return NextResponse.json(applicant);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }
    if (error instanceof DocumentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("PATCH /api/applicants/[id]/documents/[docId] Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const decoded = await getCompanyContextOrThrow(request);

    await deleteDocumentForUser({
      user: decoded,
      request,
      documentId: docId,
    });

    const applicant = await fetchApplicantDetail(id, decoded);
    return NextResponse.json(applicant);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    if (error instanceof DocumentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("DELETE /api/applicants/[id]/documents/[docId] Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import {
  DocumentServiceError,
  uploadDocumentForUser,
} from "@/lib/document-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const decoded = await getCompanyContextOrThrow(request);

    const formData = await request.formData();
    const applicantId = formData.get("applicantId") as string | null;
    const documentType = formData.get("documentType") as string | null;
    const file = formData.get("file");
    const expiryDate = formData.get("expiryDate") as string | null;
    const remarks = formData.get("remarks") as string | null;

    if (!documentType || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was uploaded or file is invalid." },
        { status: 400 }
      );
    }

    const document = await uploadDocumentForUser({
      user: decoded,
      request,
      requestedApplicantId: applicantId,
      documentType,
      file,
      expiryDate,
      remarks,
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
        downloadUrl: `/api/documents/${document.id}/download`,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    if (error instanceof DocumentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("POST /api/documents/upload Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

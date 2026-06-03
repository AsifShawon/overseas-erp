import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth";
import {
  DOCUMENT_TYPE_VALUES,
  DocumentServiceError,
  listDocumentsForUser,
} from "@/lib/document-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get("applicantId");
    const status = searchParams.get("status");
    const documentType = searchParams.get("documentType");
    const isValidDocumentType = documentType
      ? DOCUMENT_TYPE_VALUES.some((value) => value === documentType)
      : true;

    if (!isValidDocumentType) {
      return NextResponse.json(
        { error: "Invalid document type filter." },
        { status: 400 }
      );
    }

    const documents = await listDocumentsForUser(decoded, {
      applicantId,
      status,
      documentType,
    });

    return NextResponse.json({ documents });
  } catch (error) {
    if (error instanceof DocumentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("GET /api/documents Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

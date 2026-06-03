import { NextResponse } from "next/server";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import {
  DOCUMENT_TYPE_VALUES,
  DocumentServiceError,
  listDocumentsForUser,
} from "@/lib/document-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await getCompanyContextOrThrow(request);

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
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
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

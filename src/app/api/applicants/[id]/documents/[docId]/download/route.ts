import { NextResponse } from "next/server";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import {
  createDocumentDownloadResponse,
  DocumentServiceError,
} from "@/lib/document-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { docId } = await params;
    const decoded = await getCompanyContextOrThrow(request);

    return createDocumentDownloadResponse(decoded, docId);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    if (error instanceof DocumentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("GET /api/applicants/[id]/documents/[docId]/download Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

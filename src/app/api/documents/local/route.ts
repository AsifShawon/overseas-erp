import { NextResponse } from "next/server";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import {
  createLocalStorageDownloadResponse,
  DocumentServiceError,
} from "@/lib/document-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await getCompanyContextOrThrow(request);

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("storagePath");

    if (!storagePath) {
      return NextResponse.json(
        { error: "storagePath is required." },
        { status: 400 }
      );
    }

    return createLocalStorageDownloadResponse(decoded, storagePath);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access or inactive company workspace." }, { status: 401 });
    }
    if (error instanceof DocumentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("GET /api/documents/local Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth";
import {
  createLocalStorageDownloadResponse,
  DocumentServiceError,
} from "@/lib/document-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("storagePath");

    if (!storagePath) {
      return NextResponse.json(
        { error: "storagePath is required." },
        { status: 400 }
      );
    }

    return createLocalStorageDownloadResponse(decoded, storagePath);
  } catch (error) {
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

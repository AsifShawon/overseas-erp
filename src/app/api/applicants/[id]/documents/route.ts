import { NextResponse } from "next/server";
import { getCompanyContextOrThrow } from "@/lib/tenant-scope";
import {
  DocumentServiceError,
  fetchApplicantDetail,
  uploadDocumentForUser,
} from "@/lib/document-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await getCompanyContextOrThrow(request);

    const formData = await request.formData();
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

    await uploadDocumentForUser({
      user: decoded,
      request,
      requestedApplicantId: id,
      documentType,
      file,
      expiryDate,
      remarks,
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

    console.error("POST /api/applicants/[id]/documents Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

// src/app/api/applicants/[id]/documents/[docId]/download/route.ts
// GET /api/applicants/[id]/documents/[docId]/download - Secure authenticated file streaming

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import path from "path";
import fs from "fs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;

    // 1. Authenticate Request
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, roleName } = decoded;

    // 2. Fetch applicant and document info
    const applicant = await prisma.applicant.findUnique({
      where: { id },
    });
    if (!applicant) {
      return NextResponse.json({ error: "Applicant record not found." }, { status: 404 });
    }

    const document = await prisma.document.findUnique({
      where: { id: docId },
    });
    if (!document || document.applicantId !== id) {
      return NextResponse.json({ error: "Document record not found for this applicant." }, { status: 404 });
    }

    // 3. Enforce boundary scoping
    // Applicant Boundary
    if (roleName === "Applicant") {
      const isOwnProfile = applicant.userId === userId || applicant.id === id;
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        include: { applicantProfile: true },
      });
      if (userProfile?.applicantProfile?.id !== id && !isOwnProfile) {
        return NextResponse.json(
          { error: "Forbidden. You can only access your own documents." },
          { status: 403 }
        );
      }
    }

    // Agent Boundary
    else if (roleName === "Agent") {
      const agent = await prisma.agent.findUnique({
        where: { userId },
      });
      if (!agent || applicant.agentId !== agent.id) {
        return NextResponse.json(
          { error: "Forbidden. Sourcing boundaries restrict access to this document." },
          { status: 403 }
        );
      }
    }

    // Staff Boundary: must hold VIEW_APPLICANTS or be Super Admin / Operations Admin
    else {
      const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
      if (!isSuperOrOps) {
        const permissions = await getUserPermissions(userId);
        if (!permissions.includes("VIEW_APPLICANTS")) {
          return NextResponse.json(
            { error: "Forbidden. Insufficient permissions to view compliance files." },
            { status: 403 }
          );
        }
      }
    }

    // 4. Secure File Path Assertion
    const absolutePath = path.join(process.cwd(), document.fileUrl);
    const storageRoot = path.join(process.cwd(), "storage");

    // Guard against path traversal vulnerabilities (e.g. using `..` in documentUrl)
    if (!absolutePath.startsWith(storageRoot)) {
      return NextResponse.json({ error: "Forbidden. Invalid file access path." }, { status: 403 });
    }

    // Check if the file exists on the local private storage
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: "File not found on private storage." }, { status: 404 });
    }

    // 5. Asynchronously read file to memory for streaming
    const fileBuffer = await fs.promises.readFile(absolutePath);

    // 6. Map MIME content type by file extension
    let contentType = "application/octet-stream";
    const ext = path.extname(absolutePath).toLowerCase();
    if (ext === ".pdf") {
      contentType = "application/pdf";
    } else if (ext === ".jpeg" || ext === ".jpg") {
      contentType = "image/jpeg";
    } else if (ext === ".png") {
      contentType = "image/png";
    }

    // 7. Securely stream back file with attachment headers, preserving sanitized original filename
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET /api/applicants/[id]/documents/[docId]/download Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

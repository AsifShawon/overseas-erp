import crypto from "crypto";
import path from "path";

const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export function getFileExtension(fileName: string): string {
  return path.extname(path.basename(fileName)).toLowerCase();
}

export function sanitizeFileName(fileName: string): string {
  const ext = getFileExtension(fileName);
  const baseName = path.basename(fileName, ext);
  const normalizedBaseName = baseName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");

  const safeBaseName = normalizedBaseName || "document";

  return `${safeBaseName}${ext}`;
}

export function validateDocumentFile(file: File): void {
  const extension = getFileExtension(file.name);

  if (file.size <= 0) {
    throw new Error("Uploaded file is empty.");
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds the 10MB limit.");
  }

  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
    throw new Error("Invalid file type. Only PDF, JPG, JPEG, PNG, and WEBP files are allowed.");
  }

  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])) {
    throw new Error("Invalid file extension. Only .pdf, .jpg, .jpeg, .png, and .webp files are allowed.");
  }
}

export function buildApplicantDocumentPath(
  applicantId: string,
  documentType: string,
  fileName: string
): string {
  const safeApplicantId = applicantId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeDocumentType = documentType.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const sanitizedFileName = sanitizeFileName(fileName);
  const fileId = crypto.randomUUID();

  return `applicants/${safeApplicantId}/documents/${safeDocumentType}/${fileId}-${sanitizedFileName}`;
}

export { MAX_DOCUMENT_FILE_SIZE_BYTES };

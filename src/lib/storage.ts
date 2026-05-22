// src/lib/storage.ts
// Private local storage helpers for applicant compliance documents

import path from "path";
import fs from "fs";
import crypto from "crypto";

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const ALLOWED_EXTENSIONS = [".pdf", ".jpeg", ".jpg", ".png"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Returns the absolute directory path where documents for a given applicant are stored.
 */
export function getStorageDir(applicantId: string): string {
  return path.join(process.cwd(), "storage", "applicants", applicantId, "documents");
}

/**
 * Sanitizes original filename to prevent directory traversal or shell escapes.
 */
export function sanitizeFileName(name: string): string {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  // Keep only alphanumeric characters, dashes, and underscores
  const cleanBase = base.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${cleanBase}${ext}`;
}

/**
 * Validates, sanitizes, and stores an uploaded document in the private filesystem.
 * Returns the DB relative fileUrl (storage path) and the sanitized original filename.
 */
export async function saveUploadedFile(
  applicantId: string,
  file: Blob,
  fileName: string,
  documentType: string
): Promise<{ fileUrl: string; savedFileName: string }> {
  // 1. Enforce size validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the 5MB limit.");
  }

  // 2. Enforce MIME-type verification
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only PDF, JPEG, and PNG files are allowed.");
  }

  // 3. Enforce extension verification
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error("Invalid file extension. Only .pdf, .jpeg, .jpg, and .png are allowed.");
  }

  // 4. Sanitize file name
  const sanitizedName = sanitizeFileName(fileName);

  // 5. Generate secure, non-guessable server storage filename using crypto.randomUUID
  const fileUuid = crypto.randomUUID();
  const fileExt = ext === ".jpg" ? ".jpeg" : ext;
  const uniqueName = `${documentType.toLowerCase()}_${fileUuid}${fileExt}`;

  // 6. Create directories securely if they don't exist
  const storageDir = getStorageDir(applicantId);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // 7. Write private file
  const absolutePath = path.join(storageDir, uniqueName);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(absolutePath, buffer);

  // 8. Return relative path for database storage mapping (keeps DB portable and secure)
  const fileUrl = `storage/applicants/${applicantId}/documents/${uniqueName}`;

  return {
    fileUrl,
    savedFileName: sanitizedName,
  };
}

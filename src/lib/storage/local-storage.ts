import "server-only";

import fs from "fs/promises";
import path from "path";

import {
  buildApplicantDocumentPath,
  sanitizeFileName,
  validateDocumentFile,
} from "./documents";
import type { DocumentStorageProvider } from "./types";

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function getLocalStorageRoot(): string {
  if (process.env.LOCAL_STORAGE_ROOT) {
    return process.env.LOCAL_STORAGE_ROOT;
  }

  return process.env.NODE_ENV === "production"
    ? "/app/storage"
    : path.join(/* turbopackIgnore: true */ process.cwd(), "storage");
}

export function resolveLocalStoragePath(storagePath: string): string {
  const root = path.resolve(getLocalStorageRoot());
  const normalizedStoragePath = storagePath.replace(/^\/+/, "");
  const absolutePath = path.resolve(root, normalizedStoragePath);

  if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid local storage path.");
  }

  return absolutePath;
}

export function getLocalFileContentType(storagePath: string): string {
  return MIME_TYPE_BY_EXTENSION[path.extname(storagePath).toLowerCase()] ?? "application/octet-stream";
}

export async function readLocalDocumentFile(storagePath: string): Promise<Buffer> {
  return fs.readFile(resolveLocalStoragePath(storagePath));
}

export const localStorageProvider: DocumentStorageProvider = {
  async uploadApplicantDocumentFile({ file, applicantId, documentType }) {
    validateDocumentFile(file);

    const storagePath = buildApplicantDocumentPath(
      applicantId,
      documentType,
      file.name
    );
    const absolutePath = resolveLocalStoragePath(storagePath);
    const fileName = sanitizeFileName(file.name);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, fileBuffer);

    return {
      storageProvider: "local",
      storagePath,
      fileName,
      mimeType: file.type,
      fileSize: file.size,
    };
  },

  async createDocumentDownloadUrl(storagePath) {
    const baseUrl = (process.env.LOCAL_STORAGE_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
    const relativeUrl = `/api/documents/local?storagePath=${encodeURIComponent(storagePath)}`;

    return baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
  },

  async deleteApplicantDocumentFile(storagePath) {
    try {
      await fs.unlink(resolveLocalStoragePath(storagePath));
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
        throw error;
      }
    }
  },
};

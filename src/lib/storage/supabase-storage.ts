import { getSupabaseAdmin, SUPABASE_STORAGE_BUCKET } from "@/lib/supabase/server";

import {
  buildApplicantDocumentPath,
  sanitizeFileName,
  validateDocumentFile,
} from "./documents";
import type { DocumentStorageProvider } from "./types";

export const supabaseStorageProvider: DocumentStorageProvider = {
  async uploadApplicantDocumentFile({ file, applicantId, documentType }) {
    validateDocumentFile(file);

    const storagePath = buildApplicantDocumentPath(
      applicantId,
      documentType,
      file.name
    );
    const fileName = sanitizeFileName(file.name);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message || "Failed to upload document to Supabase Storage.");
    }

    return {
      storageProvider: "supabase",
      bucket: SUPABASE_STORAGE_BUCKET,
      storagePath,
      fileName,
      mimeType: file.type,
      fileSize: file.size,
    };
  },

  async createDocumentDownloadUrl(storagePath, options) {
    const supabase = getSupabaseAdmin();
    const expiresIn =
      options?.expiresIn ??
      Number(process.env.SUPABASE_SIGNED_URL_EXPIRES_IN ?? "300");
    const bucket = options?.bucket ?? SUPABASE_STORAGE_BUCKET;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Failed to create a signed download URL.");
    }

    return data.signedUrl;
  },

  async deleteApplicantDocumentFile(storagePath, options) {
    const supabase = getSupabaseAdmin();
    const bucket = options?.bucket ?? SUPABASE_STORAGE_BUCKET;
    const { error } = await supabase.storage.from(bucket).remove([storagePath]);

    if (error) {
      throw new Error(error.message || "Failed to remove document from Supabase Storage.");
    }
  },
};

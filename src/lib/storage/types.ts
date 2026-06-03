export type StorageProvider = "supabase" | "local";

export type UploadDocumentParams = {
  file: File;
  applicantId: string;
  documentType: string;
};

export type UploadedDocumentFile = {
  storageProvider: StorageProvider;
  bucket?: string;
  storagePath: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
};

export interface DocumentStorageProvider {
  uploadApplicantDocumentFile(
    params: UploadDocumentParams
  ): Promise<UploadedDocumentFile>;
  createDocumentDownloadUrl(
    storagePath: string,
    options?: { bucket?: string; expiresIn?: number }
  ): Promise<string>;
  deleteApplicantDocumentFile(
    storagePath: string,
    options?: { bucket?: string }
  ): Promise<void>;
}

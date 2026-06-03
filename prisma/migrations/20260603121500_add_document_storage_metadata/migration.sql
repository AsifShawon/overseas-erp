ALTER TABLE "Document"
ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 'supabase',
ADD COLUMN     "bucket" TEXT,
ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "fileSize" INTEGER;

UPDATE "Document"
SET
  "storageProvider" = CASE
    WHEN "fileUrl" LIKE 'storage/%' OR "fileUrl" LIKE '/uploads/%' OR "fileUrl" LIKE 'uploads/%' THEN 'local'
    ELSE 'supabase'
  END,
  "storagePath" = CASE
    WHEN "fileUrl" LIKE 'storage/%' THEN SUBSTRING("fileUrl" FROM 9)
    WHEN "fileUrl" LIKE '/%' THEN SUBSTRING("fileUrl" FROM 2)
    ELSE "fileUrl"
  END;

CREATE UNIQUE INDEX "Document_storagePath_key" ON "Document"("storagePath");
CREATE INDEX "Document_storageProvider_idx" ON "Document"("storageProvider");

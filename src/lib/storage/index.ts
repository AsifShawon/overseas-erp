import type { DocumentStorageProvider, StorageProvider } from "./types";
import { localStorageProvider } from "./local-storage";
import { supabaseStorageProvider } from "./supabase-storage";

export * from "./documents";
export * from "./local-storage";
export * from "./types";

export function getStorageProviderByName(
  driver: StorageProvider
): DocumentStorageProvider {
  if (driver === "supabase") {
    return supabaseStorageProvider;
  }

  if (driver === "local") {
    return localStorageProvider;
  }

  throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
}

export function getDocumentStorageProvider(): DocumentStorageProvider {
  const driver = (process.env.STORAGE_DRIVER ?? "supabase") as StorageProvider;
  return getStorageProviderByName(driver);
}

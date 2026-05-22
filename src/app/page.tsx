"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-bg text-text-theme">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-theme border-t-transparent mx-auto"></div>
        <p className="text-xs text-text-soft">Routing to secure authentication gate...</p>
      </div>
    </div>
  );
}

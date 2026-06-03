"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MockAuthProvider } from "@/context/MockAuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { DialogProvider } from "@/context/DialogContext";
import { LanguageProvider } from "@/i18n/LanguageContext";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Route paths that do NOT use the AppShell frame (e.g. login)
  const isAuthRoute = pathname === "/login" || pathname === "/" || pathname?.startsWith("/apply");

  const renderContent = () => {
    if (isAuthRoute) {
      // Homepage (/), apply pages (/apply/*) manage their own full-page layout.
      // Only /login uses the centered vertically-aligned layout.
      const isFullPageRoute = pathname === "/" || pathname?.startsWith("/apply");
      return (
        <MockAuthProvider>
          <div className={`min-h-screen bg-bg text-text-theme transition-colors duration-200${isFullPageRoute ? "" : " flex flex-col justify-center"}`}>
            {children}
          </div>
        </MockAuthProvider>
      );
    }

    // Wrap all other pages inside the unified dynamic AppShell
    return <AppShell>{children}</AppShell>;
  };

  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <DialogProvider>
            {renderContent()}
          </DialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default ClientLayoutWrapper;

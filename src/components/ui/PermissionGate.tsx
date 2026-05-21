"use client";

import React from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { PermissionCode } from "@/lib/permissions";
import { ErrorState } from "./ErrorState";

interface PermissionGateProps {
  permission: PermissionCode;
  children: React.ReactNode;
  showFallback?: boolean;
  fallbackMessage?: string;
}

export function PermissionGate({
  permission,
  children,
  showFallback = false,
  fallbackMessage = "You do not have authorization to view this panel.",
}: PermissionGateProps) {
  const { hasAccess, activeRoleName } = useMockAuth();

  if (hasAccess(permission)) {
    return <>{children}</>;
  }

  if (showFallback) {
    return (
      <ErrorState
        title="Access Restricted"
        description={`${fallbackMessage} (Active Role: ${activeRoleName})`}
        iconName="ShieldAlert"
      />
    );
  }

  // Hidden entirely if no fallback is requested
  return null;
}

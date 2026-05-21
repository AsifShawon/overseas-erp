"use client";

import React, { createContext, useContext, useState } from "react";
import { MockUser, MOCK_USERS } from "@/lib/mockData";
import { PermissionCode, SYSTEM_ROLES } from "@/lib/permissions";

interface AuthContextType {
  user: MockUser;
  allUsers: MockUser[];
  activeRoleName: string;
  hasAccess: (permission: PermissionCode) => boolean;
  switchRole: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  // Default user is Richard Vance (Super Admin)
  const [currentUser, setCurrentUser] = useState<MockUser>(MOCK_USERS[0]);

  // Sync state if mock user is updated
  const switchRole = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logout = () => {
    // For demo, logging out redirects to login and resets to default or guest
    switchRole("u-applicant");
  };

  const hasAccess = (permission: PermissionCode): boolean => {
    const normalizedKey = currentUser.roleName.toUpperCase().replace(/\s+/g, "_");
    const roleConfig = SYSTEM_ROLES[normalizedKey];
    if (!roleConfig) return false;
    return roleConfig.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        allUsers: MOCK_USERS,
        activeRoleName: currentUser.roleName,
        hasAccess,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
}

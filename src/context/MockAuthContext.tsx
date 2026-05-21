// src/context/MockAuthContext.tsx
// Complete Database-Backed Authentication Context (Phase 2 Upgrade)
// Maintaining compatible API and exports (MockAuthProvider, useMockAuth) for layout integrity

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MockUser, MOCK_USERS } from "@/lib/mockData";
import { PermissionCode } from "@/lib/permissions";
import { Globe2 } from "lucide-react";

// Preset credentials mapped to the original demo user IDs for seamless dropdown switcher support
const PRESET_CREDENTIALS: Record<string, { email: string; password: string }> = {
  "u-super-admin": { email: "admin@agency.com", password: "SuperAdmin@2026!" },
  "u-ops-admin": { email: "ops@agency.com", password: "OpsAdmin@2026!" },
  "u-hr-officer": { email: "hr@agency.com", password: "HrOfficer@2026!" },
  "u-docs-officer": { email: "docs@agency.com", password: "DocsOfficer@2026!" },
  "u-visa-officer": { email: "visa@agency.com", password: "VisaOfficer@2026!" },
  "u-accounts-officer": { email: "accounts@agency.com", password: "Accounts@2026!" },
  "u-agent": { email: "agent@agent.com", password: "AgentKabir@2026!" },
  "u-applicant": { email: "applicant@applicant.com", password: "Applicant@2026!" },
};

interface AuthenticatedUser extends MockUser {
  permissions: PermissionCode[];
}

interface AuthContextType {
  user: AuthenticatedUser;
  accessToken: string | null;
  allUsers: MockUser[];
  activeRoleName: string;
  loading: boolean;
  hasAccess: (permission: PermissionCode) => boolean;
  switchRole: (userId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/";

  // Silent refresh handler to authenticate via HttpOnly cookie
  const handleRefresh = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setCurrentUser(data.user);
        return true;
      }
    } catch (e) {
      console.error("Silent refresh handshake error:", e);
    }
    return false;
  };

  // Perform initial session handshake on mount
  useEffect(() => {
    let mounted = true;

    const performHandshake = async () => {
      const success = await handleRefresh();
      if (!success) {
        setCurrentUser(null);
        setAccessToken(null);
        if (!isAuthRoute) {
          router.push("/login");
        }
      }
      if (mounted) {
        setLoading(false);
      }
    };

    performHandshake();

    // Set up silent refresh interval every 10 minutes to keep access token alive
    const interval = setInterval(async () => {
      if (mounted) {
        const success = await handleRefresh();
        if (!success && !isAuthRoute) {
          router.push("/login");
        }
      }
    }, 10 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Redirect to login if user is logged out and visits a protected route
  useEffect(() => {
    if (!loading && !currentUser && !isAuthRoute) {
      router.push("/login");
    }
  }, [pathname, currentUser, loading]);

  // Authenticate user via email and password
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sign-in attempt failed.");
      }

      setAccessToken(data.accessToken);
      setCurrentUser(data.user);

      if (data.user.roleName === "Applicant") {
        router.push("/applicant/portal");
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setLoading(false);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Terminate user session and clear cookies
  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
    } catch (e) {
      console.error("Error executing logout API request:", e);
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      setLoading(false);
      router.push("/login");
    }
  };

  // Development-only role selector adapter that performs a real database login
  const switchRole = async (userId: string) => {
    const credentials = PRESET_CREDENTIALS[userId];
    if (credentials) {
      await login(credentials.email, credentials.password);
    } else {
      console.warn(`Preset credentials not configured for mock user ${userId}`);
    }
  };

  // Dynamic RBAC Permission Gate
  const hasAccess = (permission: PermissionCode): boolean => {
    if (!currentUser) return false;
    return currentUser.permissions.includes(permission);
  };

  // Render a state-of-the-art loading screen during handshake/loading states
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="relative flex flex-col items-center max-w-sm text-center space-y-6">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-white dark:bg-slate-950 shadow-xl border border-slate-100 dark:border-slate-800">
            <Globe2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Vetting Authority Session
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Performing cryptographic handshake and pulling dynamic RBAC permission rules from PostgreSQL database.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Safe fallback to prevent crash while redirecting unauthenticated users
  if (!currentUser && !isAuthRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
        <Globe2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: currentUser as AuthenticatedUser,
        accessToken,
        allUsers: MOCK_USERS,
        activeRoleName: currentUser?.roleName || "Guest",
        loading,
        hasAccess,
        switchRole,
        login,
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

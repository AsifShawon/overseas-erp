// src/lib/auth.ts
// JWT utility using jose (Zero-dependency, edge-compatible)

import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "dev_access_secret_replace_in_production_with_64_char_string"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_replace_in_production_with_64_char_string"
);

const ACCESS_EXPIRES_IN_SEC = Number(process.env.JWT_ACCESS_EXPIRES_IN || "900");
const REFRESH_EXPIRES_IN_SEC = Number(process.env.JWT_REFRESH_EXPIRES_IN || "604800");

export interface AccessTokenPayload {
  userId: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
  activeCompanyId: string | null;
  activeCompanyName: string | null;
  membershipId: string | null;
  roleId: string;
  roleName: string;
  permissions: string[];
  companyStatus: string | null;
}

export interface RefreshTokenPayload {
  userId: string;
}

/**
 * Sign an Access Token (short-lived)
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ACCESS_EXPIRES_IN_SEC;
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(ACCESS_SECRET);
}

/**
 * Sign a Refresh Token (long-lived)
 */
export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + REFRESH_EXPIRES_IN_SEC;
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(REFRESH_SECRET);
}

/**
 * Verify an Access Token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as AccessTokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Serialize a cookie option for secure, HttpOnly, SameSite=Strict cookies
 */
export function getRefreshTokenCookieOptions() {
  return {
    name: "refreshToken",
    expires: new Date(Date.now() + REFRESH_EXPIRES_IN_SEC * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };
}

/**
 * Authenticate incoming Next.js Request using Authorization Bearer token header.
 */
export async function authenticateRequest(request: Request): Promise<AccessTokenPayload | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    return await verifyAccessToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Returns current authenticated user from token/session.
 */
export async function getCurrentUser(request: Request): Promise<AccessTokenPayload | null> {
  return await authenticateRequest(request);
}

/**
 * Returns decoded session properties.
 */
export async function getCurrentMembership(request: Request) {
  const payload = await authenticateRequest(request);
  if (!payload) return null;
  return {
    userId: payload.userId,
    activeCompanyId: payload.activeCompanyId,
    membershipId: payload.membershipId,
    roleId: payload.roleId,
    roleName: payload.roleName,
    permissions: payload.permissions,
    companyStatus: payload.companyStatus,
    isPlatformAdmin: payload.isPlatformAdmin,
  };
}

/**
 * Requires valid user session.
 */
export async function requireAuth(request: Request): Promise<AccessTokenPayload | null> {
  const payload = await authenticateRequest(request);
  if (!payload) return null;
  return payload;
}

/**
 * Requires valid logged-in user with active company membership in active company.
 */
export async function requireCompanyContext(request: Request) {
  const payload = await authenticateRequest(request);
  if (!payload) return null;

  if (!payload.activeCompanyId) {
    return null;
  }

  // Fetch from DB to support manual status changes (suspended company, suspended membership)
  const membership = await prisma.userMembership.findUnique({
    where: { id: payload.membershipId || "" },
    include: { company: true },
  });

  if (!membership || membership.status !== "ACTIVE" || membership.company.status !== "ACTIVE") {
    return null;
  }

  return {
    ...payload,
    companyStatus: membership.company.status,
  };
}

/**
 * Require the user to be a platform administrator.
 * Returns the database user and decoded token payload, or throws an error/returns null.
 */
export async function requirePlatformAdmin(request: Request) {
  const decoded = await authenticateRequest(request);
  if (!decoded) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive || !user.isPlatformAdmin) {
    return null;
  }

  return { user, decoded };
}

/**
 * Helper to resolve dynamic company membership payload for a user.
 */
export async function resolveUserSessionPayload(userId: string): Promise<AccessTokenPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      agentProfile: true,
      applicantProfile: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Load ACTIVE UserMemberships in ACTIVE Companies
  const memberships = await prisma.userMembership.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
      company: {
        status: "ACTIVE",
      },
    },
    include: {
      company: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  // Decide active company context
  let activeMembership = null;
  if (memberships.length > 0) {
    // Select the first active membership (TODO: Company switcher support)
    activeMembership = memberships[0];
  }

  // If normal user (not platform admin) and no active membership, return null
  if (!user.isPlatformAdmin && !activeMembership) {
    return null;
  }

  let roleId = user.roleId;
  let roleName = user.role.name;
  let permissions: string[] = [];

  if (activeMembership) {
    roleId = activeMembership.roleId;
    roleName = activeMembership.role.name;
    permissions = activeMembership.role.permissions.map((rp) => rp.permission.name);
  } else {
    // Platform admin fallback when no memberships
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: {
        permission: true,
      },
    });
    permissions = rolePermissions.map((rp) => rp.permission.name);
  }

  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    isPlatformAdmin: user.isPlatformAdmin,
    activeCompanyId: activeMembership ? activeMembership.companyId : null,
    activeCompanyName: activeMembership ? activeMembership.company.name : null,
    membershipId: activeMembership ? activeMembership.id : null,
    roleId: roleId,
    roleName: roleName,
    permissions: permissions,
    companyStatus: activeMembership ? activeMembership.company.status : null,
  };
}



// src/lib/auth.ts
// JWT utility using jose (Zero-dependency, edge-compatible)

import { SignJWT, jwtVerify } from "jose";

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
  roleName: string;
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


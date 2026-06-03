// src/lib/notifications/role-targeting.ts
// Helpers to find users belonging to roles/teams within a company for notification targeting.

import { prisma } from "@/lib/db";

/**
 * Find all active user IDs who have a specific roleId within the given company.
 */
export async function getUsersByRoleInCompany(
  companyId: string,
  roleId: string
): Promise<string[]> {
  const memberships = await prisma.userMembership.findMany({
    where: {
      companyId,
      roleId,
      status: "ACTIVE",
    },
    select: { userId: true },
  });
  return memberships.map((m) => m.userId);
}

/**
 * Find all active user IDs who have one of the given role names within the given company.
 */
export async function getUsersByRoleNamesInCompany(
  companyId: string,
  roleNames: string[]
): Promise<string[]> {
  const roles = await prisma.role.findMany({
    where: { name: { in: roleNames } },
    select: { id: true },
  });
  const roleIds = roles.map((r) => r.id);
  if (roleIds.length === 0) return [];

  const memberships = await prisma.userMembership.findMany({
    where: {
      companyId,
      roleId: { in: roleIds },
      status: "ACTIVE",
    },
    select: { userId: true },
  });
  return [...new Set(memberships.map((m) => m.userId))];
}

/**
 * Find company owners and admins (Super Admin, Operations Admin) user IDs.
 */
export async function getCompanyAdminUserIds(companyId: string): Promise<string[]> {
  return getUsersByRoleNamesInCompany(companyId, [
    "Super Admin",
    "Operations Admin",
  ]);
}

/**
 * Find all platform admin user IDs.
 */
export async function getPlatformAdminUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { isPlatformAdmin: true, isActive: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * Find accounts team user IDs in a company.
 */
export async function getAccountsTeamUserIds(companyId: string): Promise<string[]> {
  return getUsersByRoleNamesInCompany(companyId, [
    "Accounts Officer",
    "Super Admin",
    "Operations Admin",
  ]);
}

/**
 * Find HR team user IDs in a company.
 */
export async function getHrTeamUserIds(companyId: string): Promise<string[]> {
  return getUsersByRoleNamesInCompany(companyId, [
    "HR Officer",
    "Super Admin",
    "Operations Admin",
  ]);
}

/**
 * Find documentation team user IDs in a company.
 */
export async function getDocumentationTeamUserIds(companyId: string): Promise<string[]> {
  return getUsersByRoleNamesInCompany(companyId, [
    "Documentation Officer",
    "Super Admin",
    "Operations Admin",
  ]);
}

/**
 * Find visa team user IDs in a company.
 */
export async function getVisaTeamUserIds(companyId: string): Promise<string[]> {
  return getUsersByRoleNamesInCompany(companyId, [
    "Visa Officer",
    "Super Admin",
    "Operations Admin",
  ]);
}

// src/lib/rbac.ts
// Utility to load role permissions dynamically from the database

import { prisma } from "@/lib/db";
import { PermissionCode } from "@/lib/permissions";

/**
 * Load all granular permissions associated with a user's role from the database.
 * Returns an array of PermissionCode strings.
 */
export async function getUserPermissions(userId: string): Promise<PermissionCode[]> {
  try {
    // 1. Fetch user to get their roleId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      return [];
    }

    // 2. Fetch all role permissions for this role, including permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: {
        permission: {
          select: { name: true },
        },
      },
    });

    // 3. Extract and return permission names mapped to the PermissionCode type
    return rolePermissions.map((rp) => rp.permission.name as PermissionCode);
  } catch (error) {
    console.error(`Error loading permissions for user ${userId}:`, error);
    return [];
  }
}

/**
 * Checks if a specific role name in the database contains a given permission.
 * Useful for fast server-side checks.
 */
export async function roleHasPermission(roleName: string, permissionName: PermissionCode): Promise<boolean> {
  try {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) return false;

    return role.permissions.some((rp) => rp.permission.name === permissionName);
  } catch (error) {
    console.error(`Error checking permission ${permissionName} for role ${roleName}:`, error);
    return false;
  }
}

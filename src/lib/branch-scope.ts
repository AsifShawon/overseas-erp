import { requireCompanyContext } from "./auth";
import { prisma } from "./db";

export interface BranchScope {
  userId: string;
  activeCompanyId: string;
  roleName: string;
  roleId: string;
  permissions: string[];
  isAllBranches: boolean;
  branchIds: string[];
  isPlatformAdmin: boolean;
}

/**
 * Resolves the branch access scope for the current logged-in user.
 * Supports parsing selected branch filter from request query parameter or header.
 */
export async function getUserBranchScope(request: Request): Promise<BranchScope | null> {
  const ctx = await requireCompanyContext(request);
  if (!ctx || !ctx.activeCompanyId) {
    return null;
  }

  const isAllBranches =
    ctx.permissions.includes("VIEW_ALL_BRANCH_DATA") ||
    ctx.isPlatformAdmin ||
    ctx.roleName === "Platform Admin" ||
    ctx.roleName === "Super Admin";

  let branchIds: string[] = [];
  const memberships = await prisma.branchMembership.findMany({
    where: {
      userId: ctx.userId,
      companyId: ctx.activeCompanyId,
      status: "ACTIVE",
      branch: {
        status: "ACTIVE",
      },
    },
    select: {
      branchId: true,
    },
  });
  branchIds = memberships.map((m) => m.branchId);

  // Parse selected branch filter from query or header
  let selectedBranchId: string | null = null;
  try {
    const url = new URL(request.url);
    selectedBranchId = url.searchParams.get("branchId") || url.searchParams.get("activeBranchId");
  } catch (e) {
    // Ignore URL parse errors
  }

  if (!selectedBranchId) {
    selectedBranchId = request.headers.get("X-Branch-Id") || request.headers.get("x-branch-id");
  }

  if (selectedBranchId) {
    const branch = await prisma.branch.findFirst({
      where: {
        id: selectedBranchId,
        companyId: ctx.activeCompanyId,
        status: "ACTIVE",
      },
    });

    if (branch) {
      if (isAllBranches || branchIds.includes(selectedBranchId)) {
        return {
          userId: ctx.userId,
          activeCompanyId: ctx.activeCompanyId,
          roleName: ctx.roleName,
          roleId: ctx.roleId,
          permissions: ctx.permissions,
          isAllBranches: false,
          branchIds: [selectedBranchId],
          isPlatformAdmin: !!ctx.isPlatformAdmin,
        };
      } else {
        return {
          userId: ctx.userId,
          activeCompanyId: ctx.activeCompanyId,
          roleName: ctx.roleName,
          roleId: ctx.roleId,
          permissions: ctx.permissions,
          isAllBranches: false,
          branchIds: ["INACCESSIBLE_BRANCH"],
          isPlatformAdmin: !!ctx.isPlatformAdmin,
        };
      }
    }
  }

  // If user has no specific branch assignment restriction, default to company-wide scope
  const effectiveIsAllBranches = isAllBranches || branchIds.length === 0;

  return {
    userId: ctx.userId,
    activeCompanyId: ctx.activeCompanyId,
    roleName: ctx.roleName,
    roleId: ctx.roleId,
    permissions: ctx.permissions,
    isAllBranches: effectiveIsAllBranches,
    branchIds,
    isPlatformAdmin: !!ctx.isPlatformAdmin,
  };
}



/**
 * Requires valid authenticated user context with branch access permissions.
 * Throws an Error "UNAUTHORIZED" or "FORBIDDEN" if context validation fails.
 */
export async function requireBranchContext(request: Request): Promise<BranchScope> {
  const scope = await getUserBranchScope(request);
  if (!scope) {
    throw new Error("UNAUTHORIZED");
  }
  if (!scope.isAllBranches && scope.branchIds.length === 0) {
    throw new Error("FORBIDDEN");
  }
  return scope;
}

/**
 * Checks if the user is authorized to bypass single branch restriction.
 */
export function canAccessAllBranches(user: { permissions: string[] } | BranchScope): boolean {
  return user.permissions.includes("VIEW_ALL_BRANCH_DATA");
}

/**
 * Safely constructs a database where clause scoped by company and authorized branches.
 */
export function buildBranchWhere(
  activeCompanyId: string,
  branchScope: BranchScope,
  extraWhere: any = {}
) {
  const { companyId, branchId, ...rest } = extraWhere;

  if (branchScope.isAllBranches) {
    return {
      companyId: activeCompanyId,
      ...(branchId ? { branchId } : {}),
      ...rest,
    };
  }

  let targetBranchWhere: any;
  if (branchId) {
    const isAllowed = typeof branchId === "string"
      ? branchScope.branchIds.includes(branchId)
      : (Array.isArray(branchId.in) && branchId.in.every((id: string) => branchScope.branchIds.includes(id)));

    if (!isAllowed) {
      targetBranchWhere = { id: "UNAUTHORIZED_BRANCH" };
    } else {
      targetBranchWhere = branchId;
    }
  } else {
    targetBranchWhere = { in: branchScope.branchIds };
  }

  return {
    companyId: activeCompanyId,
    branchId: targetBranchWhere,
    ...rest,
  };
}

/**
 * Asserts record ownership and branch visibility before write/mutation actions.
 * Throws "RECORD_NOT_FOUND" or "FORBIDDEN".
 */
export async function assertRecordBelongsToAccessibleBranch(
  model: any,
  id: string,
  activeCompanyId: string,
  branchScope: BranchScope
) {
  const record = await model.findFirst({
    where: { id, companyId: activeCompanyId },
  });

  if (!record) {
    throw new Error("RECORD_NOT_FOUND");
  }

  if (branchScope.isAllBranches) {
    return record;
  }

  if (!record.branchId || !branchScope.branchIds.includes(record.branchId)) {
    throw new Error("FORBIDDEN");
  }

  return record;
}

/**
 * Validates that the branchId exists, belongs to the active company, and is accessible to the user.
 * Throws an error if validation fails.
 */
export async function validateWriteBranch(
  branchId: string | null | undefined,
  activeCompanyId: string,
  branchScope: BranchScope
): Promise<string> {
  if (!branchId) {
    throw new Error("Branch ID is required.");
  }

  if (!branchScope.isAllBranches && !branchScope.branchIds.includes(branchId)) {
    throw new Error("FORBIDDEN");
  }

  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      companyId: activeCompanyId,
      status: "ACTIVE",
    },
  });

  if (!branch) {
    throw new Error("FORBIDDEN");
  }

  return branchId;
}

/**
 * Resolves the active branch entries accessible to a specific user.
 */
export async function getAccessibleBranches(
  userId: string,
  activeCompanyId: string,
  permissions: string[]
) {
  const isAllBranches = permissions.includes("VIEW_ALL_BRANCH_DATA");
  if (isAllBranches) {
    return await prisma.branch.findMany({
      where: {
        companyId: activeCompanyId,
        status: "ACTIVE",
      },
      select: { id: true, name: true, code: true, isHeadOffice: true },
    });
  } else {
    const branchMemberships = await prisma.branchMembership.findMany({
      where: {
        userId,
        companyId: activeCompanyId,
        status: "ACTIVE",
        branch: { status: "ACTIVE" },
      },
      select: {
        branch: {
          select: { id: true, name: true, code: true, isHeadOffice: true },
        },
      },
    });
    return branchMemberships.map((bm) => bm.branch);
  }
}

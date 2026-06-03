import { requireCompanyContext } from "./auth";
import { prisma } from "./db";

/**
 * Validates the active workspace status and returns the company ID, user ID, roleName, permissions, and membershipId.
 * Throws an Error with message "UNAUTHORIZED" if company context is invalid or suspended.
 */
export async function getCompanyContextOrThrow(request: Request) {
  const ctx = await requireCompanyContext(request);
  if (!ctx) {
    throw new Error("UNAUTHORIZED");
  }
  return {
    ...ctx,
    activeCompanyId: ctx.activeCompanyId as string,
  };
}

/**
 * Merges companyId into the data payload, discarding any client-provided companyId values.
 */
export function withCompanyId<T extends object>(data: T, activeCompanyId: string): T & { companyId: string } {
  const { companyId, ...rest } = data as any;
  return {
    ...rest,
    companyId: activeCompanyId,
  };
}

/**
 * Ensures companyId is included in database where query objects.
 */
export function buildCompanyWhere(activeCompanyId: string, extraWhere: any = {}) {
  const { companyId, ...rest } = extraWhere;
  return {
    companyId: activeCompanyId,
    ...rest,
  };
}

/**
 * Asserts record ownership using composite (id, companyId) parameters before executing updates/deletes.
 * Throws Error "RECORD_NOT_FOUND" if record doesn't belong to company.
 */
export async function assertRecordBelongsToCompany(prismaModel: any, id: string, companyId: string) {
  const record = await prismaModel.findFirst({
    where: { id, companyId },
  });
  if (!record) {
    throw new Error("RECORD_NOT_FOUND");
  }
  return record;
}

/**
 * Resolves the Agent record ID for the logged-in agent user inside the active company.
 * Returns null if agent profile doesn't exist for this company.
 */
export async function getAgentScopeForUser(userId: string, activeCompanyId: string): Promise<string | null> {
  const agent = await prisma.agent.findFirst({
    where: { userId, companyId: activeCompanyId },
    select: { id: true },
  });
  return agent ? agent.id : null;
}

/**
 * Resolves the Applicant record ID for the logged-in candidate user inside the active company.
 * Returns null if applicant profile doesn't exist.
 */
export async function getApplicantScopeForUser(userId: string, activeCompanyId: string): Promise<string | null> {
  const applicant = await prisma.applicant.findFirst({
    where: { userId, companyId: activeCompanyId },
    select: { id: true },
  });
  return applicant ? applicant.id : null;
}

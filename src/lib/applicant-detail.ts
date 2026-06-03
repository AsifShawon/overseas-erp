import type { Prisma } from "../../generated/prisma/client";

export const applicantDetailInclude = {
  agent: {
    select: {
      id: true,
      agentCode: true,
      companyName: true,
    },
  },
  jobOrder: true,
  workflows: {
    orderBy: {
      timestamp: "desc",
    },
  },
  documents: {
    orderBy: {
      createdAt: "desc",
    },
  },
  invoices: {
    orderBy: {
      createdAt: "desc",
    },
  },
  receipts: {
    orderBy: {
      createdAt: "desc",
    },
  },
  ledgerEntries: {
    orderBy: {
      timestamp: "asc",
    },
  },
} satisfies Prisma.ApplicantInclude;

export type ApplicantDetailPayload = Prisma.ApplicantGetPayload<{
  include: typeof applicantDetailInclude;
}>;

export function serializeApplicantDetail(
  applicant: ApplicantDetailPayload | null
): ApplicantDetailPayload | null {
  if (!applicant) {
    return null;
  }

  return {
    ...applicant,
    documents: applicant.documents.map((document) => ({
      ...document,
      fileUrl: `/api/documents/${document.id}/download`,
    })),
  };
}

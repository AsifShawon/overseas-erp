// src/app/api/platform/company-applications/[id]/approve/route.ts
// POST /api/platform/company-applications/[id]/approve - Approve a pending company application

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";
import * as argon2 from "argon2";

async function generateUniqueSlug(tx: any, name: string): Promise<string> {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special characters
    .replace(/[\s_]+/g, "-") // replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // trim hyphens from ends

  if (!slug) {
    slug = "company";
  }

  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const existing = await tx.company.findUnique({
      where: { slug: uniqueSlug },
    });
    if (!existing) {
      break;
    }
    // Append counter to prevent collisions
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requirePlatformAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.companyApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Company application not found." }, { status: 404 });
    }

    if (application.status !== "PENDING") {
      return NextResponse.json({ error: "Only PENDING applications can be approved." }, { status: 400 });
    }

    // Verify Standard SaaS Plan exists
    const plan = await prisma.saaSPlan.findUnique({
      where: { code: "STANDARD" },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Standard SaaS Plan (STANDARD) not found in database. Run db seed first." },
        { status: 500 }
      );
    }

    // Verify Super Admin role exists
    const superAdminRole = await prisma.role.findFirst({
      where: { name: "Super Admin" },
    });

    if (!superAdminRole) {
      return NextResponse.json(
        { error: "Super Admin role not found in database. Run db seed first." },
        { status: 500 }
      );
    }

    // Create Company, Subscription, Settings, and User in a transaction
    const company = await prisma.$transaction(async (tx) => {
      // Generate unique slug inside the transaction using transaction client
      const slug = await generateUniqueSlug(tx, application.companyName);

      // 1. Create the Company
      const newCompany = await tx.company.create({
        data: {
          name: application.companyName,
          slug,
          businessType: application.businessType,
          country: application.country || "Bangladesh",
          city: application.city,
          address: application.address,
          website: application.website,
          ownerName: application.ownerFullName,
          ownerEmail: application.ownerEmail,
          ownerPhone: application.ownerPhone,
          status: "ACTIVE",
        },
      });

      // 2. Create the Company Subscription
      await tx.companySubscription.create({
        data: {
          companyId: newCompany.id,
          planId: plan.id,
          status: "ACTIVE",
          startedAt: new Date(),
        },
      });

      // 3. Create the Company Settings
      await tx.companySettings.create({
        data: {
          companyId: newCompany.id,
          defaultLocale: "bn",
          allowAgentPortal: true,
          allowApplicantPortal: true,
          allowPublicJobs: true,
        },
      });

      // 4. Create or reuse owner User
      let ownerUser = await tx.user.findUnique({
        where: { email: application.ownerEmail },
      });

      if (!ownerUser) {
        // Generate a random temporary password
        const tempPassword = "Welcome@" + Math.random().toString(36).slice(-6) + "!";
        const passwordHash = await argon2.hash(tempPassword);

        ownerUser = await tx.user.create({
          data: {
            email: application.ownerEmail,
            fullName: application.ownerFullName,
            phone: application.ownerPhone,
            passwordHash,
            // TODO: UserMembership model will replace this global roleId mapping in the next phase
            roleId: superAdminRole.id,
            isActive: true,
          },
        });
      } else {
        // Temporarily assign existing company-level Super Admin/Admin role if current User.roleId requires it
        const currentRole = await tx.role.findUnique({
          where: { id: ownerUser.roleId },
        });
        const isCompanyAdmin = currentRole?.name === "Super Admin" || currentRole?.name === "Operations Admin";
        if (!isCompanyAdmin) {
          ownerUser = await tx.user.update({
            where: { id: ownerUser.id },
            data: { roleId: superAdminRole.id },
          });
        }
      }

      // 4b. Create default UserMembership for the company owner
      await tx.userMembership.upsert({
        where: {
          userId_companyId: {
            userId: ownerUser.id,
            companyId: newCompany.id,
          },
        },
        update: {
          roleId: superAdminRole.id,
          status: "ACTIVE",
          isOwner: true,
        },
        create: {
          userId: ownerUser.id,
          companyId: newCompany.id,
          roleId: superAdminRole.id,
          status: "ACTIVE",
          isOwner: true,
        },
      });

      // 5. Update the Company Application
      await tx.companyApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: adminCheck.user.id,
          reviewedAt: new Date(),
          approvedCompanyId: newCompany.id,
        },
      });

      return newCompany;
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/platform/company-applications/[id]/approve Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during approval transaction." },
      { status: 500 }
    );
  }
}

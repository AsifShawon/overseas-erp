// src/app/api/platform/company-applications/public/route.ts
// POST /api/platform/company-applications/public - Public company application endpoint

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CompanyApplicationSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required"),
  ownerFullName: z
    .string()
    .trim()
    .min(1, "Owner full name is required"),
  ownerEmail: z
    .string()
    .trim()
    .email("Invalid email address"),
  ownerPhone: z
    .string()
    .trim()
    .min(1, "Owner phone number is required"),
  businessType: z
    .string()
    .trim()
    .nullable()
    .optional(),
  country: z
    .string()
    .trim()
    .default("Bangladesh"),
  city: z
    .string()
    .trim()
    .nullable()
    .optional(),
  address: z
    .string()
    .trim()
    .nullable()
    .optional(),
  website: z
    .string()
    .trim()
    .nullable()
    .optional(),
  notes: z
    .string()
    .trim()
    .nullable()
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      companyName,
      ownerFullName,
      ownerEmail,
      ownerPhone,
      businessType,
      country,
      city,
      address,
      website,
      notes,
    } = body;

    const cleanCountry = country && country.trim() !== "" ? country : "Bangladesh";

    const parsedData = CompanyApplicationSchema.parse({
      companyName,
      ownerFullName,
      ownerEmail,
      ownerPhone,
      businessType,
      country: cleanCountry,
      city,
      address,
      website,
      notes,
    });

    // Check duplicate pending applications
    const existingPending = await prisma.companyApplication.findFirst({
      where: {
        status: "PENDING",
        OR: [
          { ownerEmail: parsedData.ownerEmail },
          { companyName: parsedData.companyName },
        ],
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "An application from this company or owner email is already pending review." },
        { status: 409 }
      );
    }

    // Create the application in PENDING status
    const application = await prisma.companyApplication.create({
      data: {
        companyName: parsedData.companyName,
        ownerFullName: parsedData.ownerFullName,
        ownerEmail: parsedData.ownerEmail,
        ownerPhone: parsedData.ownerPhone,
        businessType: parsedData.businessType,
        country: parsedData.country,
        city: parsedData.city,
        address: parsedData.address,
        website: parsedData.website,
        notes: parsedData.notes,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { success: true, id: application.id },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }

    console.error("POST /api/platform/company-applications/public Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

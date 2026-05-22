import React from "react";
import { MockApplicant } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { User, Phone, Mail, FileText, Calendar, MapPin, Landmark, Globe2, AlertCircle } from "lucide-react";

interface ApplicantProfileCardProps {
  applicant: MockApplicant;
}

export function ApplicantProfileCard({ applicant }: ApplicantProfileCardProps) {
  return (
    <div className="rounded-xl border border-border-theme bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-theme pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-theme">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-theme">{applicant.fullName}</h2>
            <p className="text-xs text-text-soft font-medium">
              Trade Category: <span className="text-text-muted font-semibold">{applicant.trade}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] rounded bg-bg-muted border border-border-theme text-text-muted px-2 py-0.5 font-bold">
            Passport: {applicant.passportNumber}
          </span>
          <StatusBadge status={applicant.currentStage} />
          {applicant.isArchived && (
            <span className="text-[10px] rounded bg-danger-soft border border-danger-theme/20 text-danger-theme px-2 py-0.5 font-bold">
              Soft Archived
            </span>
          )}
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Contact & Account</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Phone className="h-3.5 w-3.5 text-text-soft" />
              <span>{applicant.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Mail className="h-3.5 w-3.5 text-text-soft" />
              <span>{applicant.email || "No Email Registered"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Landmark className="h-3.5 w-3.5 text-text-soft" />
              <span>
                Portal Account:{" "}
                {applicant.userId ? (
                  <span className="text-success-theme font-semibold">Claimed Access</span>
                ) : (
                  <span className="text-warning-theme font-semibold">Unclaimed (Staff Only)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Identity Documents */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Personal Identity</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Calendar className="h-3.5 w-3.5 text-text-soft" />
              <span>DOB: {applicant.dateOfBirth}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <FileText className="h-3.5 w-3.5 text-text-soft" />
              <span>NID: {applicant.nidNumber || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Globe2 className="h-3.5 w-3.5 text-text-soft" />
              <span>Nationality: {applicant.nationality}</span>
            </div>
          </div>
        </div>

        {/* Address and Emergency */}
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <h4 className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Logistics & Emergency</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-text-muted">
              <MapPin className="h-3.5 w-3.5 text-text-soft shrink-0 mt-0.5" />
              <span className="line-clamp-2">{applicant.address || "No Address Registered"}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-text-muted">
              <AlertCircle className="h-3.5 w-3.5 text-text-soft shrink-0 mt-0.5" />
              <span className="line-clamp-2">{applicant.emergencyContact || "No Emergency Contact"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

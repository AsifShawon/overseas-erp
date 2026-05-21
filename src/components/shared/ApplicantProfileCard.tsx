import React from "react";
import { MockApplicant } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { User, Phone, Mail, FileText, Calendar, MapPin, Landmark } from "lucide-react";

interface ApplicantProfileCardProps {
  applicant: MockApplicant;
}

export function ApplicantProfileCard({ applicant }: ApplicantProfileCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">{applicant.fullName}</h2>
            <p className="text-xs text-slate-400 font-medium">Trade Category: <span className="text-slate-600 dark:text-slate-300 font-semibold">{applicant.trade}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 font-bold">
            Passport: {applicant.passportNumber}
          </span>
          <StatusBadge status={applicant.currentStage} />
          {applicant.isArchived && (
            <span className="text-[10px] rounded bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 font-bold dark:bg-rose-950/20 dark:border-rose-900/20 dark:text-rose-400">
              Soft Archived
            </span>
          )}
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact & Account</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{applicant.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{applicant.email || "No Email Registered"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Landmark className="h-3.5 w-3.5 text-slate-400" />
              <span>Portal Account: {applicant.userId ? <span className="text-emerald-600 font-semibold">Claimed Access</span> : <span className="text-amber-600 font-semibold">Unclaimed (Staff Only)</span>}</span>
            </div>
          </div>
        </div>

        {/* Identity Documents */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personal Identity</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>DOB: {applicant.dateOfBirth}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>NID: {applicant.nidNumber || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Globe2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Nationality: {applicant.nationality}</span>
            </div>
          </div>
        </div>

        {/* Address and Emergency */}
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logistics & Emergency</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{applicant.address || "No Address Registered"}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{applicant.emergencyContact || "No Emergency Contact"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick helper to prevent type errors for Globe2 and AlertCircle
import { Globe2, AlertCircle } from "lucide-react";

import React from "react";
import { MockApplicant } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { User, Phone, Mail, FileText, Calendar, MapPin, Landmark, Globe2, AlertCircle } from "lucide-react";
import { useT } from "@/i18n/useT";

interface ApplicantProfileCardProps {
  applicant: MockApplicant;
}

export function ApplicantProfileCard({ applicant }: ApplicantProfileCardProps) {
  const { t, locale } = useT();

  return (
    <div className="rounded-2xl border border-border-theme bg-surface p-6 md:p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-theme pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-theme">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-text-theme">{applicant.fullName}</h2>
            <p className="text-sm md:text-[15px] text-text-soft font-semibold leading-relaxed mt-0.5">
              {locale === "bn" ? "ট্রেড ক্যাটাগরি: " : "Trade Category: "}<span className="text-text-muted font-bold">{applicant.trade}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs md:text-sm rounded-lg bg-bg-muted border border-border-theme text-text-muted px-3 py-1 font-bold">
            {locale === "bn" ? "পাসপোর্ট: " : "Passport: "}{applicant.passportNumber}
          </span>
          <StatusBadge status={applicant.currentStage} className="text-xs md:text-sm px-2.5 py-1" />
          {applicant.isArchived && (
            <span className="text-xs md:text-sm rounded-lg bg-danger-soft border border-danger-theme/20 text-danger-theme px-3 py-1 font-bold">
              {locale === "bn" ? "আর্কাইভ করা" : "Soft Archived"}
            </span>
          )}
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-xs md:text-sm font-bold text-text-soft uppercase tracking-wider">{locale === "bn" ? "যোগাযোগ ও অ্যাকাউন্ট" : "Contact & Account"}</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm md:text-[15px] text-text-muted leading-relaxed">
              <Phone className="h-4.5 w-4.5 text-text-soft shrink-0" />
              <span>{applicant.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm md:text-[15px] text-text-muted leading-relaxed">
              <Mail className="h-4.5 w-4.5 text-text-soft shrink-0" />
              <span className="break-all">{applicant.email || (locale === "bn" ? "কোনো ইমেল রেজিস্টার্ড নেই" : "No Email Registered")}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm md:text-[15px] text-text-muted leading-relaxed">
              <Landmark className="h-4.5 w-4.5 text-text-soft shrink-0" />
              <span>
                {locale === "bn" ? "পোর্টাল অ্যাকাউন্ট: " : "Portal Account: "}{" "}
                {applicant.userId ? (
                  <span className="text-success-theme font-bold">{locale === "bn" ? "সক্রিয় অ্যাক্সেস" : "Claimed Access"}</span>
                ) : (
                  <span className="text-warning-theme font-bold">{locale === "bn" ? "অনিবন্ধিত (শুধু স্টাফ)" : "Unclaimed (Staff Only)"}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Identity Documents */}
        <div className="space-y-4">
          <h4 className="text-xs md:text-sm font-bold text-text-soft uppercase tracking-wider">{locale === "bn" ? "ব্যক্তিগত পরিচয়" : "Personal Identity"}</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm md:text-[15px] text-text-muted leading-relaxed">
              <Calendar className="h-4.5 w-4.5 text-text-soft shrink-0" />
              <span>{locale === "bn" ? "জন্ম তারিখ: " : "DOB: "}{applicant.dateOfBirth}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm md:text-[15px] text-text-muted leading-relaxed">
              <FileText className="h-4.5 w-4.5 text-text-soft shrink-0" />
              <span>{locale === "bn" ? "এনআইডি: " : "NID: "}{applicant.nidNumber || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm md:text-[15px] text-text-muted leading-relaxed">
              <Globe2 className="h-4.5 w-4.5 text-text-soft shrink-0" />
              <span>{locale === "bn" ? "জাতীয়তা: " : "Nationality: "}{applicant.nationality}</span>
            </div>
          </div>
        </div>

        {/* Address and Emergency */}
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <h4 className="text-xs md:text-sm font-bold text-text-soft uppercase tracking-wider">{locale === "bn" ? "লজিস্টিকস ও জরুরি যোগাযোগ" : "Logistics & Emergency"}</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-sm md:text-[15px] text-text-muted leading-relaxed">
              <MapPin className="h-4.5 w-4.5 text-text-soft shrink-0 mt-0.5" />
              <span className="whitespace-normal">{applicant.address || (locale === "bn" ? "কোনো ঠিকানা রেজিস্টার্ড নেই" : "No Address Registered")}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm md:text-[15px] text-text-muted leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 text-text-soft shrink-0 mt-0.5" />
              <span className="whitespace-normal">{applicant.emergencyContact || (locale === "bn" ? "কোনো জরুরি যোগাযোগ নম্বর নেই" : "No Emergency Contact")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

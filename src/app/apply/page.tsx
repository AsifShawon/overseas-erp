// src/app/apply/page.tsx
// Public Company Application Form Page

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { Globe2, FileText, ArrowRight, Loader2, AlertCircle, Building2 } from "lucide-react";

// In-file translations to keep the public application page self-contained
const translations = {
  bn: {
    title: "কোম্পানি রেজিস্ট্রেশন আবেদন",
    subtitle: "আমাদের SaaS প্ল্যাটফর্ম ব্যবহার করার জন্য আপনার কোম্পানির আবেদন জমা দিন। আমাদের প্ল্যাটফর্ম টিম আবেদনটি পর্যালোচনা করবে এবং অনুমোদনের পর আপনার অ্যাকাউন্ট সক্রিয় করবে।",
    companyName: "কোম্পানির নাম *",
    ownerFullName: "মালিকের সম্পূর্ণ নাম *",
    ownerEmail: "মালিকের ইমেল ঠিকানা *",
    ownerPhone: "মালিকের মোবাইল নম্বর *",
    businessType: "ব্যবসার ধরন",
    country: "দেশ *",
    city: "শহর",
    address: "ঠিকানা",
    website: "ওয়েবসাইট",
    notes: "অতিরিক্ত তথ্য / নোট",
    submitBtn: "আবেদন জমা দিন",
    submitting: "আবেদন জমা হচ্ছে...",
    errorTitle: "আবেদন জমা দিতে ব্যর্থ হয়েছে",
    requiredFieldsHelp: "* চিহ্নিত ক্ষেত্রগুলো পূরণ করা বাধ্যতামূলক।",
    selectBusinessType: "ব্যবসার ধরন নির্বাচন করুন...",
    recruitmentAgency: "ওভারসিজ রিক্রুটমেন্ট এজেন্সি (Overseas Recruitment)",
    manpowerAgency: "ম্যানপাওয়ার এজেন্সি (Manpower Agency)",
    studyAbroad: "স্টাডি অ্যাব্রড এজেন্সি (Study Abroad)",
    workerSending: "ওয়ার্কার সেন্ডিং এজেন্সি (Worker Sending)",
    other: "অন্যান্য (Other)",
    duplicateError: "এই কোম্পানি বা মালিকের ইমেল থেকে একটি আবেদন ইতিমধ্যেই পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।"
  },
  en: {
    title: "Company Registration Application",
    subtitle: "Submit your company application to use our SaaS platform. Our platform team will review it and activate your company account after approval.",
    companyName: "Company Name *",
    ownerFullName: "Owner Full Name *",
    ownerEmail: "Owner Email Address *",
    ownerPhone: "Owner Phone Number *",
    businessType: "Business Type",
    country: "Country *",
    city: "City",
    address: "Address",
    website: "Website",
    notes: "Additional Notes",
    submitBtn: "Submit Application",
    submitting: "Submitting Application...",
    errorTitle: "Submission Failed",
    requiredFieldsHelp: "* Marked fields are required.",
    selectBusinessType: "Select Business Type...",
    recruitmentAgency: "Overseas Recruitment Agency",
    manpowerAgency: "Manpower Agency",
    studyAbroad: "Study Abroad Agency",
    workerSending: "Worker Sending Agency",
    other: "Other",
    duplicateError: "An application from this company or owner email is already pending review."
  }
};

export default function ApplyPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const t = locale === "bn" ? translations.bn : translations.en;

  // Form states
  const [formData, setFormData] = useState({
    companyName: "",
    ownerFullName: "",
    ownerEmail: "",
    ownerPhone: "",
    businessType: "",
    country: "Bangladesh",
    city: "",
    address: "",
    website: "",
    notes: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validations
    if (!formData.companyName.trim()) {
      setError(locale === "bn" ? "কোম্পানির নাম আবশ্যক" : "Company name is required");
      return;
    }
    if (!formData.ownerFullName.trim()) {
      setError(locale === "bn" ? "মালিকের নাম আবশ্যক" : "Owner name is required");
      return;
    }
    if (!formData.ownerEmail.trim()) {
      setError(locale === "bn" ? "মালিকের ইমেল আবশ্যক" : "Owner email is required");
      return;
    }
    if (!formData.ownerPhone.trim()) {
      setError(locale === "bn" ? "মালিকের ফোন নম্বর আবশ্যক" : "Owner phone number is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/platform/company-applications/public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (locale === "bn" ? "আবেদন জমা দিতে ব্যর্থ হয়েছে।" : "Failed to submit application."));
      }

      router.push("/apply/success");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
      {/* Brand Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center">
          <img
            src="/visatek_logo_transparent.png"
            alt="VisaTek Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-text-theme">
          {t.title}
        </h2>
        <p className="mx-auto max-w-xl text-xs text-text-soft font-medium leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Main Form container */}
      <div className="rounded-2xl border border-border-theme bg-surface/80 backdrop-blur-md p-6 lg:p-8 shadow-xl">
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-xs text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <strong className="font-bold block text-[11px] mb-0.5">{t.errorTitle}</strong>
              <p className="text-[10px] text-rose-600/90 dark:text-rose-400/90 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Company Name */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.companyName}
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. VisaTek Global Recruiters"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              />
            </div>

            {/* Owner Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.ownerFullName}
              </label>
              <input
                type="text"
                name="ownerFullName"
                value={formData.ownerFullName}
                onChange={handleChange}
                placeholder="e.g. Mohammad Rahman"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.businessType}
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              >
                <option value="">{t.selectBusinessType}</option>
                <option value="Recruitment Agency">{t.recruitmentAgency}</option>
                <option value="Manpower Agency">{t.manpowerAgency}</option>
                <option value="Study Abroad">{t.studyAbroad}</option>
                <option value="Worker Sending">{t.workerSending}</option>
                <option value="Other">{t.other}</option>
              </select>
            </div>

            {/* Owner Email */}
            <div>
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.ownerEmail}
              </label>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                placeholder="owner@agency.com"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              />
            </div>

            {/* Owner Phone */}
            <div>
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.ownerPhone}
              </label>
              <input
                type="text"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                placeholder="e.g. +8801712345678"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.country}
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. Bangladesh"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.city}
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Dhaka"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.address}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Sector 12, Uttara, Dhaka"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              />
            </div>

            {/* Website */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.website}
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="e.g. https://www.agency.com"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5">
                {t.notes}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Seeking Standard SaaS access for manpower tracking."
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-text-theme disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-theme">
            <span className="text-[10px] text-text-soft font-medium">
              {t.requiredFieldsHelp}
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-6 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>{t.submitting}</span>
                </>
              ) : (
                <>
                  <span>{t.submitBtn}</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

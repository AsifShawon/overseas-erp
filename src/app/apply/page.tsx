// src/app/apply/page.tsx
// Public Company Application Form Page — Polished two-column layout

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import Link from "next/link";
import {
  Globe2,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  ClipboardList,
  ShieldCheck,
  Zap,
  Menu,
  X,
} from "lucide-react";

// ─── Translations ─────────────────────────────────────────────────────────────
const translations = {
  bn: {
    navApply: "আবেদন করুন",
    navLogin: "লগইন",
    pageTitle: "কোম্পানি রেজিস্ট্রেশন আবেদন",
    pageSubtitle: "আমাদের SaaS ERP প্ল্যাটফর্ম ব্যবহার করতে আপনার কোম্পানির তথ্য জমা দিন।",
    // Left panel
    panelTitle: "কীভাবে অনুমোদন প্রক্রিয়া কাজ করে",
    panelSubtitle: "আবেদন জমা দেওয়া থেকে সক্রিয় ওয়ার্কস্পেস পাওয়া পর্যন্ত",
    steps: [
      { label: "আবেদন জমা দিন", desc: "নিচের ফর্মটি পূরণ করুন এবং জমা দিন।" },
      { label: "প্ল্যাটফর্ম রিভিউ", desc: "আমাদের টিম আপনার তথ্য যাচাই করবে।" },
      { label: "অ্যাকাউন্ট সক্রিয়করণ", desc: "অনুমোদনের পর আপনার ওয়ার্কস্পেস তৈরি হবে।" },
      { label: "ERP ব্যবহার শুরু করুন", desc: "লগইন করুন এবং পরিচালনা শুরু করুন।" },
    ],
    benefitsTitle: "আপনি কী পাবেন",
    benefits: [
      "আনলিমিটেড আবেদনকারী ট্র্যাকিং",
      "এজেন্ট পোর্টাল অ্যাক্সেস",
      "ডকুমেন্ট ম্যানেজমেন্ট সিস্টেম",
      "ইনভয়েস ও রসিদ ব্যবস্থাপনা",
      "কমিশন ট্র্যাকিং",
      "ওয়ার্কফ্লো পাইপলাইন ম্যানেজমেন্ট",
    ],
    // Form
    formTitle: "আবেদন ফর্ম",
    companyName: "কোম্পানির নাম",
    ownerFullName: "মালিকের সম্পূর্ণ নাম",
    ownerEmail: "মালিকের ইমেল ঠিকানা",
    ownerPhone: "মালিকের মোবাইল নম্বর",
    businessType: "ব্যবসার ধরন",
    country: "দেশ",
    city: "শহর",
    address: "ঠিকানা",
    website: "ওয়েবসাইট",
    notes: "অতিরিক্ত তথ্য / নোট",
    submitBtn: "আবেদন জমা দিন",
    submitting: "আবেদন জমা হচ্ছে...",
    errorTitle: "আবেদন জমা দিতে ব্যর্থ হয়েছে",
    requiredNote: "* চিহ্নিত ক্ষেত্রগুলো পূরণ করা বাধ্যতামূলক।",
    selectBusinessType: "ব্যবসার ধরন নির্বাচন করুন...",
    businessTypes: [
      { value: "Recruitment Agency", label: "ওভারসিজ রিক্রুটমেন্ট এজেন্সি" },
      { value: "Manpower Agency", label: "ম্যানপাওয়ার এজেন্সি" },
      { value: "Study Abroad", label: "স্টাডি অ্যাব্রড এজেন্সি" },
      { value: "Worker Sending", label: "ওয়ার্কার সেন্ডিং এজেন্সি" },
      { value: "Other", label: "অন্যান্য" },
    ],
    duplicateError: "এই কোম্পানি বা মালিকের ইমেল থেকে একটি আবেদন ইতিমধ্যেই পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।",
    placeholders: {
      companyName: "যেমন: VisaTek Global Recruiters",
      ownerFullName: "যেমন: Mohammad Rahman",
      ownerEmail: "owner@agency.com",
      ownerPhone: "+8801712345678",
      country: "Bangladesh",
      city: "যেমন: Dhaka",
      address: "যেমন: Sector 12, Uttara, Dhaka",
      website: "https://www.agency.com",
      notes: "অতিরিক্ত তথ্য বা বার্তা লিখুন...",
    },
  },
  en: {
    navApply: "Apply",
    navLogin: "Login",
    pageTitle: "Company Registration Application",
    pageSubtitle: "Submit your company details to access our SaaS ERP platform.",
    // Left panel
    panelTitle: "How the approval process works",
    panelSubtitle: "From application submission to an active workspace",
    steps: [
      { label: "Submit Application", desc: "Fill out and submit the form on the right." },
      { label: "Platform Team Reviews", desc: "Our admins verify your business credentials." },
      { label: "Account Activation", desc: "Your private workspace is provisioned on approval." },
      { label: "Start Using ERP", desc: "Login and start managing your operations." },
    ],
    benefitsTitle: "What you get",
    benefits: [
      "Unlimited applicant tracking",
      "Agent portal access",
      "Document management system",
      "Invoice & receipt management",
      "Commission tracking",
      "Workflow pipeline management",
    ],
    // Form
    formTitle: "Application Form",
    companyName: "Company Name",
    ownerFullName: "Owner Full Name",
    ownerEmail: "Owner Email Address",
    ownerPhone: "Owner Phone Number",
    businessType: "Business Type",
    country: "Country",
    city: "City",
    address: "Business Address",
    website: "Website (Optional)",
    notes: "Additional Notes (Optional)",
    submitBtn: "Submit Application",
    submitting: "Submitting Application...",
    errorTitle: "Submission Failed",
    requiredNote: "* Marked fields are required.",
    selectBusinessType: "Select business type...",
    businessTypes: [
      { value: "Recruitment Agency", label: "Overseas Recruitment Agency" },
      { value: "Manpower Agency", label: "Manpower Agency" },
      { value: "Study Abroad", label: "Study Abroad Agency" },
      { value: "Worker Sending", label: "Worker Sending Agency" },
      { value: "Other", label: "Other" },
    ],
    duplicateError: "An application from this company or owner email is already pending review.",
    placeholders: {
      companyName: "e.g. VisaTek Global Recruiters",
      ownerFullName: "e.g. Mohammad Rahman",
      ownerEmail: "owner@agency.com",
      ownerPhone: "+8801712345678",
      country: "Bangladesh",
      city: "e.g. Dhaka",
      address: "e.g. Sector 12, Uttara, Dhaka",
      website: "https://www.agency.com",
      notes: "Any additional information or notes...",
    },
  },
};

// ─── Small public navbar for /apply ──────────────────────────────────────────
function ApplyNav({ locale }: { locale: string }) {
  const t = locale === "bn" ? translations.bn : translations.en;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-theme bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-text-theme">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-theme/10 border border-primary-theme/20">
              <Globe2 className="h-4 w-4 text-primary-theme" />
            </div>
            <span className="text-sm tracking-tight">
              Visa<span className="text-primary-theme">Tek</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-border-theme bg-surface px-4 py-1.5 text-xs font-bold text-text-theme hover:bg-bg transition-colors"
            >
              {t.navLogin}
            </Link>
            <Link
              href="/apply"
              className="rounded-lg bg-primary-theme hover:bg-primary-hover px-4 py-1.5 text-xs font-bold text-white transition-colors"
            >
              {t.navApply}
            </Link>
          </div>

          <button className="sm:hidden p-2 rounded-lg text-text-soft hover:bg-bg" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="sm:hidden border-t border-border-theme bg-surface px-4 py-3 flex gap-2">
          <Link href="/login" className="flex-1 rounded-lg border border-border-theme px-4 py-2 text-xs font-bold text-text-theme text-center hover:bg-bg">{t.navLogin}</Link>
          <Link href="/apply" className="flex-1 rounded-lg bg-primary-theme px-4 py-2 text-xs font-bold text-white text-center">{t.navApply}</Link>
        </div>
      )}
    </header>
  );
}

// ─── Step Progress Indicator ──────────────────────────────────────────────────
function StepIndicator({ steps, locale }: { steps: typeof translations.en.steps; locale: string }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-theme/10 border border-primary-theme/30 text-[10px] font-extrabold text-primary-theme">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="mt-1 h-8 w-px bg-border-theme" />
            )}
          </div>
          <div className="pt-0.5 pb-2">
            <p className="text-xs font-bold text-text-theme">{step.label}</p>
            <p className="text-[11px] text-text-soft mt-0.5 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Apply Page ──────────────────────────────────────────────────────────
export default function ApplyPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const t = locale === "bn" ? translations.bn : translations.en;

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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = locale === "bn" ? "কোম্পানির নাম আবশ্যক" : "Company name is required";
    if (!formData.ownerFullName.trim()) newErrors.ownerFullName = locale === "bn" ? "মালিকের নাম আবশ্যক" : "Owner name is required";
    if (!formData.ownerEmail.trim()) newErrors.ownerEmail = locale === "bn" ? "মালিকের ইমেল আবশ্যক" : "Owner email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
      newErrors.ownerEmail = locale === "bn" ? "বৈধ ইমেল ঠিকানা দিন" : "Enter a valid email address";
    }
    if (!formData.ownerPhone.trim()) newErrors.ownerPhone = locale === "bn" ? "মোবাইল নম্বর আবশ্যক" : "Phone number is required";
    if (!formData.country.trim()) newErrors.country = locale === "bn" ? "দেশ আবশ্যক" : "Country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/platform/company-applications/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (locale === "bn" ? "আবেদন জমা দিতে ব্যর্থ হয়েছে।" : "Failed to submit application."));
      }

      router.push("/apply/success");
    } catch (err: any) {
      setGlobalError(err.message);
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border ${errors[field] ? "border-danger-theme" : "border-border-theme"} bg-input-bg py-2.5 px-4 text-xs outline-none transition-all focus:border-primary-theme focus:bg-surface focus:ring-1 focus:ring-primary-theme text-input-text disabled:opacity-50`;

  const labelClass = "block text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-bg text-text-theme flex flex-col">
      <ApplyNav locale={locale} />

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Page Header */}
        <div className="text-center mb-10 space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/visatek_logo_transparent.png"
              alt="VisaTek Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-theme">
            {t.pageTitle}
          </h1>
          <p className="mx-auto max-w-lg text-sm text-text-soft leading-relaxed">
            {t.pageSubtitle}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Process steps card */}
            <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-extrabold text-text-theme">{t.panelTitle}</h2>
                <p className="text-[11px] text-text-soft mt-0.5">{t.panelSubtitle}</p>
              </div>
              <StepIndicator steps={t.steps} locale={locale} />
            </div>

            {/* Benefits card */}
            <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <h2 className="text-sm font-extrabold text-text-theme">{t.benefitsTitle}</h2>
              </div>
              <ul className="space-y-2">
                {t.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-text-theme font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust note */}
            <div className="rounded-2xl border border-primary-theme/20 bg-primary-soft/5 p-5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary-theme shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-soft leading-relaxed font-medium">
                {locale === "bn"
                  ? "আপনার তথ্য আমাদের প্ল্যাটফর্ম টিম ছাড়া অন্য কেউ দেখতে পাবে না। অনুমোদন ছাড়া কোনো কোম্পানি ERP ব্যবহার করতে পারবে না।"
                  : "Your information is only reviewed by our platform team. No company gains ERP access without explicit admin approval."}
              </p>
            </div>
          </div>

          {/* ── RIGHT PANEL (FORM) ── */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border-theme bg-surface p-6 lg:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-border-theme">
                <ClipboardList className="h-4.5 w-4.5 text-primary-theme" />
                <h2 className="text-sm font-extrabold text-text-theme">{t.formTitle}</h2>
              </div>

              {/* Global Error */}
              {globalError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-danger-theme/20 bg-danger-soft p-4 text-xs text-danger-theme">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block mb-0.5">{t.errorTitle}</strong>
                    <p className="font-medium text-[11px]">{globalError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  {/* Company Name — full width */}
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="companyName">
                      {t.companyName} <span className="text-danger-theme">*</span>
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder={t.placeholders.companyName}
                      disabled={isSubmitting}
                      className={inputClass("companyName")}
                      autoComplete="organization"
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-[10px] font-semibold text-danger-theme">{errors.companyName}</p>
                    )}
                  </div>

                  {/* Owner Full Name */}
                  <div>
                    <label className={labelClass} htmlFor="ownerFullName">
                      {t.ownerFullName} <span className="text-danger-theme">*</span>
                    </label>
                    <input
                      id="ownerFullName"
                      type="text"
                      name="ownerFullName"
                      value={formData.ownerFullName}
                      onChange={handleChange}
                      placeholder={t.placeholders.ownerFullName}
                      disabled={isSubmitting}
                      className={inputClass("ownerFullName")}
                      autoComplete="name"
                    />
                    {errors.ownerFullName && (
                      <p className="mt-1 text-[10px] font-semibold text-danger-theme">{errors.ownerFullName}</p>
                    )}
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className={labelClass} htmlFor="businessType">
                      {t.businessType}
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClass("businessType")}
                    >
                      <option value="">{t.selectBusinessType}</option>
                      {t.businessTypes.map((bt) => (
                        <option key={bt.value} value={bt.value}>{bt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Owner Email */}
                  <div>
                    <label className={labelClass} htmlFor="ownerEmail">
                      {t.ownerEmail} <span className="text-danger-theme">*</span>
                    </label>
                    <input
                      id="ownerEmail"
                      type="email"
                      name="ownerEmail"
                      value={formData.ownerEmail}
                      onChange={handleChange}
                      placeholder={t.placeholders.ownerEmail}
                      disabled={isSubmitting}
                      className={inputClass("ownerEmail")}
                      autoComplete="email"
                    />
                    {errors.ownerEmail && (
                      <p className="mt-1 text-[10px] font-semibold text-danger-theme">{errors.ownerEmail}</p>
                    )}
                  </div>

                  {/* Owner Phone */}
                  <div>
                    <label className={labelClass} htmlFor="ownerPhone">
                      {t.ownerPhone} <span className="text-danger-theme">*</span>
                    </label>
                    <input
                      id="ownerPhone"
                      type="tel"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      placeholder={t.placeholders.ownerPhone}
                      disabled={isSubmitting}
                      className={inputClass("ownerPhone")}
                      autoComplete="tel"
                    />
                    {errors.ownerPhone && (
                      <p className="mt-1 text-[10px] font-semibold text-danger-theme">{errors.ownerPhone}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label className={labelClass} htmlFor="country">
                      {t.country} <span className="text-danger-theme">*</span>
                    </label>
                    <input
                      id="country"
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder={t.placeholders.country}
                      disabled={isSubmitting}
                      className={inputClass("country")}
                    />
                    {errors.country && (
                      <p className="mt-1 text-[10px] font-semibold text-danger-theme">{errors.country}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className={labelClass} htmlFor="city">
                      {t.city}
                    </label>
                    <input
                      id="city"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder={t.placeholders.city}
                      disabled={isSubmitting}
                      className={inputClass("city")}
                    />
                  </div>

                  {/* Address — full width */}
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="address">
                      {t.address}
                    </label>
                    <input
                      id="address"
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder={t.placeholders.address}
                      disabled={isSubmitting}
                      className={inputClass("address")}
                      autoComplete="street-address"
                    />
                  </div>

                  {/* Website — full width */}
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="website">
                      {t.website}
                    </label>
                    <input
                      id="website"
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder={t.placeholders.website}
                      disabled={isSubmitting}
                      className={inputClass("website")}
                      autoComplete="url"
                    />
                  </div>

                  {/* Notes — full width */}
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="notes">
                      {t.notes}
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder={t.placeholders.notes}
                      disabled={isSubmitting}
                      className={`${inputClass("notes")} resize-none`}
                    />
                  </div>
                </div>

                {/* Footer row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border-theme">
                  <span className="text-[10px] text-text-soft font-medium">{t.requiredNote}</span>
                  <button
                    id="apply-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-8 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t.submitting}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.submitBtn}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

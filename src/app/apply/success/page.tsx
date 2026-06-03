// src/app/apply/success/page.tsx
// Public Company Application Success Confirmation Page

"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { CheckCircle2, ArrowLeft } from "lucide-react";

const translations = {
  bn: {
    title: "আবেদন সফলভাবে জমা হয়েছে!",
    message: "আপনার কোম্পানির আবেদনটি আমাদের সিস্টেমে সফলভাবে রেকর্ড করা হয়েছে। আমাদের প্ল্যাটফর্ম টিম তথ্যগুলো পর্যালোচনা করবে এবং অনুমোদন প্রক্রিয়া সম্পন্ন হলে আপনার নিবন্ধিত মালিকের ইমেলে যোগাযোগ করবে।",
    backHome: "হোম পেজে ফিরে যান",
  },
  en: {
    title: "Application Submitted Successfully!",
    message: "Your company application has been successfully recorded in our system. Our platform team will review the details and contact the owner's email address once approval is complete.",
    backHome: "Back to Home / Login",
  }
};

export default function ApplySuccessPage() {
  const { locale } = useLanguage();
  const t = locale === "bn" ? translations.bn : translations.en;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 lg:py-24 flex flex-col items-center justify-center">
      <div className="rounded-2xl border border-border-theme bg-surface/80 backdrop-blur-md p-8 lg:p-12 shadow-xl text-center space-y-6 flex flex-col items-center">
        {/* Success Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text-theme">{t.title}</h2>
          <p className="text-xs text-text-soft leading-relaxed px-2">
            {t.message}
          </p>
        </div>

        <div className="pt-4 border-t border-border-theme w-full flex justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-border-theme hover:bg-surface-soft px-5 py-2.5 text-xs font-bold text-text-theme transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.backHome}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

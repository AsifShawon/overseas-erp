// src/app/apply/success/page.tsx
// Public Company Application Success Confirmation Page — Improved UI

"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  CheckCircle2,
  Home,
  LogIn,
  Clock,
  Building2,
  Zap,
  Globe2,
} from "lucide-react";

const translations = {
  bn: {
    title: "আবেদন সফলভাবে জমা হয়েছে!",
    message: "আপনার কোম্পানির আবেদনটি আমাদের সিস্টেমে সফলভাবে রেকর্ড করা হয়েছে।",
    subMessage: "আমাদের প্ল্যাটফর্ম টিম আপনার তথ্য পর্যালোচনা করবে এবং অনুমোদনের পর মালিকের নিবন্ধিত ইমেলে যোগাযোগ করবে।",
    backHome: "হোম পেজে ফিরুন",
    login: "লগইন করুন",
    steps: [
      { label: "আবেদন জমা", status: "done" },
      { label: "প্ল্যাটফর্ম রিভিউ", status: "pending" },
      { label: "অ্যাকাউন্ট সক্রিয়করণ", status: "pending" },
      { label: "ERP ব্যবহার শুরু", status: "pending" },
    ],
    currentStatusNote: "আপনার আবেদন এখন পর্যালোচনার অপেক্ষায় আছে।",
  },
  en: {
    title: "Application Submitted Successfully!",
    message: "Your company application has been successfully recorded in our system.",
    subMessage: "Our platform team will review your details and contact you at the owner's registered email address once the approval process is complete.",
    backHome: "Back to Home",
    login: "Login",
    steps: [
      { label: "Application Submitted", status: "done" },
      { label: "Platform Review", status: "pending" },
      { label: "Account Activation", status: "pending" },
      { label: "Start Using ERP", status: "pending" },
    ],
    currentStatusNote: "Your application is now awaiting platform review.",
  },
};

export default function ApplySuccessPage() {
  const { locale } = useLanguage();
  const t = locale === "bn" ? translations.bn : translations.en;

  return (
    <div className="min-h-screen bg-bg text-text-theme flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-border-theme bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-text-theme">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-theme/10 border border-primary-theme/20">
              <Globe2 className="h-4 w-4 text-primary-theme" />
            </div>
            <span className="text-sm tracking-tight">
              Visa<span className="text-primary-theme">Tek</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-6">

          {/* Success Card */}
          <div className="rounded-3xl border border-border-theme bg-surface shadow-xl p-8 text-center space-y-6 relative overflow-hidden">
            {/* Top accent gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

            {/* Success icon */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
              <CheckCircle2 className="relative h-10 w-10 text-emerald-500" />
            </div>

            {/* Text content */}
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-text-theme">{t.title}</h1>
              <p className="text-sm font-semibold text-text-theme">{t.message}</p>
              <p className="text-xs text-text-soft leading-relaxed px-4">{t.subMessage}</p>
            </div>

            {/* Status note */}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-2.5">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t.currentStatusNote}</p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/"
                id="success-home-btn"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border-theme bg-bg hover:bg-surface px-5 py-3 text-xs font-bold text-text-theme transition-all duration-200"
              >
                <Home className="h-4 w-4" />
                {t.backHome}
              </Link>
              <Link
                href="/login"
                id="success-login-btn"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-5 py-3 text-xs font-bold text-white shadow-md transition-all duration-200"
              >
                <LogIn className="h-4 w-4" />
                {t.login}
              </Link>
            </div>
          </div>

          {/* Application progress tracker */}
          <div className="rounded-2xl border border-border-theme bg-surface p-6 space-y-4">
            <h2 className="text-xs font-extrabold text-text-theme uppercase tracking-wider">
              {locale === "bn" ? "আবেদন প্রক্রিয়া" : "Application Progress"}
            </h2>
            <div className="space-y-3">
              {t.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  {step.status === "done" ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-theme bg-bg">
                      <span className="text-[9px] font-bold text-text-soft">{i + 1}</span>
                    </div>
                  )}
                  <span className={`text-xs font-semibold ${step.status === "done" ? "text-emerald-600 dark:text-emerald-400" : "text-text-soft"}`}>
                    {step.label}
                  </span>
                  {step.status === "done" && (
                    <span className="ml-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      {locale === "bn" ? "সম্পন্ন" : "Done"}
                    </span>
                  )}
                  {step.status === "pending" && (
                    <span className="ml-auto rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                      {locale === "bn" ? "অপেক্ষমাণ" : "Pending"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border-theme bg-surface p-4 text-center space-y-2">
              <div className="mx-auto h-8 w-8 rounded-lg bg-primary-theme/10 border border-primary-theme/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary-theme" />
              </div>
              <p className="text-[11px] font-semibold text-text-theme">
                {locale === "bn" ? "ওয়ার্কস্পেস তৈরি হবে" : "Workspace will be created"}
              </p>
              <p className="text-[10px] text-text-soft">
                {locale === "bn" ? "অনুমোদনের পর" : "Upon approval"}
              </p>
            </div>
            <div className="rounded-2xl border border-border-theme bg-surface p-4 text-center space-y-2">
              <div className="mx-auto h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-[11px] font-semibold text-text-theme">
                {locale === "bn" ? "স্ট্যান্ডার্ড প্ল্যান" : "Standard Plan"}
              </p>
              <p className="text-[10px] text-text-soft">
                {locale === "bn" ? "সম্পূর্ণ বিনামূল্যে" : "All features included"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

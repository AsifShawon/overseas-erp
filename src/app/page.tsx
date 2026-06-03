// src/app/page.tsx
// Public SaaS Landing Page — Overseas Recruitment ERP
// Auth-aware: authenticated users redirect to /dashboard, guests see the landing page.

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMockAuth } from "@/context/MockAuthContext";
import {
  Globe2,
  Users,
  FileText,
  DollarSign,
  Percent,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Building2,
  ClipboardList,
  Briefcase,
  Menu,
  X,
  ChevronRight,
  Star,
  Zap,
  Lock,
} from "lucide-react";

// ─── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Users,
    title: "Applicant Tracking",
    desc: "End-to-end candidate pipeline from application through deployment with full workflow history.",
    color: "indigo",
  },
  {
    icon: Building2,
    title: "Agent Portal",
    desc: "Dedicated agent accounts with scoped applicant access, commission tracking, and document uploads.",
    color: "violet",
  },
  {
    icon: FileText,
    title: "Document Management",
    desc: "Passport, medical, visa, and police clearance tracking with verification status and expiry alerts.",
    color: "blue",
  },
  {
    icon: DollarSign,
    title: "Accounts & Receipts",
    desc: "Invoice generation, receipt recording, general ledger, and real-time outstanding balance tracking.",
    color: "emerald",
  },
  {
    icon: Percent,
    title: "Commission Tracking",
    desc: "Automated agent commission accrual per placement with payout reference management.",
    color: "amber",
  },
  {
    icon: ClipboardList,
    title: "Workflow / Status Tracking",
    desc: "12-stage compliance pipeline from Applied to Deployed, with transition guards and change history.",
    color: "cyan",
  },
  {
    icon: BarChart3,
    title: "Reports & Dashboard",
    desc: "Live operational dashboards with stage-wise breakdowns, financial summaries, and exportable data.",
    color: "rose",
  },
  {
    icon: Briefcase,
    title: "CRM / Lead Management",
    desc: "Coming soon — manage lead pipelines, employer relationships, and demand forecasting.",
    color: "slate",
    comingSoon: true,
  },
];

// ─── How it works steps ───────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Apply with Company Details",
    desc: "Submit your company registration form with owner details, business type, and contact information. No upfront payment required.",
  },
  {
    step: "02",
    title: "Platform Team Reviews",
    desc: "Our platform administrators review your application, verify business credentials, and prepare your workspace.",
  },
  {
    step: "03",
    title: "Approved Company Gets Workspace",
    desc: "Once approved, your private company workspace is activated with the Standard ERP plan and full feature access.",
  },
  {
    step: "04",
    title: "Start Managing Operations",
    desc: "Log in and immediately start managing applicants, agents, job orders, payments, and documents.",
  },
];

// ─── Roles ───────────────────────────────────────────────────────────────────
const ROLES = [
  { title: "Company Owner / Admin", desc: "Full platform access, user management, and financial oversight." },
  { title: "HR / Recruiting Officer", desc: "Applicant intake, screening, interview scheduling, and job order mapping." },
  { title: "Documentation Officer", desc: "Passport, medical, police clearance, and visa document verification." },
  { title: "Visa Officer", desc: "Embassy packet assembly, visa sticker logging, and consulate slot tracking." },
  { title: "Accounts Officer", desc: "Invoice creation, payment recording, ledger management, and commission payouts." },
  { title: "Agent", desc: "Sourcing partner portal with scoped candidate access and commission visibility." },
  { title: "Applicant", desc: "Personal progress portal with document upload and status tracking." },
];

// ─── Trust items ──────────────────────────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: Lock, title: "Secure Login", desc: "JWT-based authentication with HttpOnly cookies and 2FA support." },
  { icon: ShieldCheck, title: "Role-Based Access", desc: "Granular RBAC — each user sees only what their role permits." },
  { icon: FileText, title: "Document Tracking", desc: "Per-applicant document status, verification audit trail, and expiry alerts." },
  { icon: BarChart3, title: "Activity & Audit History", desc: "Full audit log of every action with timestamps and user attribution." },
  { icon: Building2, title: "Private Company Workspace", desc: "Isolated tenant workspace activated only after platform approval." },
];

// ─── Color map helpers ────────────────────────────────────────────────────────
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20" },
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-500",   border: "border-blue-500/20" },
  emerald:{ bg: "bg-emerald-500/10",text: "text-emerald-500",border: "border-emerald-500/20" },
  amber:  { bg: "bg-amber-500/10",  text: "text-amber-500",  border: "border-amber-500/20" },
  cyan:   { bg: "bg-cyan-500/10",   text: "text-cyan-500",   border: "border-cyan-500/20" },
  rose:   { bg: "bg-rose-500/10",   text: "text-rose-500",   border: "border-rose-500/20" },
  slate:  { bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/20" },
};

// ─── Public Navbar ────────────────────────────────────────────────────────────
function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-theme bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center">
            <img src="/visatek_logo_transparent.png" alt="VisaTek" className="h-9 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-soft">
            <a href="#features" className="hover:text-text-theme transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text-theme transition-colors">How it Works</a>
            <a href="#roles" className="hover:text-text-theme transition-colors">Who Uses It</a>
            <a href="#pricing" className="hover:text-text-theme transition-colors">Pricing</a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-border-theme bg-surface px-4 py-2 text-xs font-bold text-text-theme hover:bg-bg transition-colors"
            >
              Login
            </Link>
            <Link
              href="/apply"
              className="rounded-lg bg-primary-theme hover:bg-primary-hover px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm"
            >
              Apply for Access
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-text-soft hover:text-text-theme hover:bg-bg"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-theme bg-surface px-4 py-4 space-y-3">
          <a href="#features" className="block text-sm font-medium text-text-soft hover:text-text-theme py-1">Features</a>
          <a href="#how-it-works" className="block text-sm font-medium text-text-soft hover:text-text-theme py-1">How it Works</a>
          <a href="#roles" className="block text-sm font-medium text-text-soft hover:text-text-theme py-1">Who Uses It</a>
          <a href="#pricing" className="block text-sm font-medium text-text-soft hover:text-text-theme py-1">Pricing</a>
          <div className="flex gap-2 pt-2 border-t border-border-theme">
            <Link href="/login" className="flex-1 rounded-lg border border-border-theme bg-surface px-4 py-2.5 text-xs font-bold text-text-theme text-center hover:bg-bg transition-colors">
              Login
            </Link>
            <Link href="/apply" className="flex-1 rounded-lg bg-primary-theme hover:bg-primary-hover px-4 py-2.5 text-xs font-bold text-white text-center transition-colors">
              Apply for Access
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Main Landing Page Component ──────────────────────────────────────────────
export default function HomePage() {
  const { user, loading } = useMockAuth();
  const router = useRouter();

  // If authenticated, redirect to the appropriate dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.roleName === "Applicant") {
        router.replace("/applicant/portal");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  // Show spinner while auth is resolving
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-theme border-t-transparent" />
          <p className="text-xs text-text-soft">Checking session...</p>
        </div>
      </div>
    );
  }

  // If auth resolves to a user, show minimal redirect state while useEffect fires
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-theme border-t-transparent" />
      </div>
    );
  }

  // ─── Landing Page (unauthenticated visitors) ────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-text-theme">
      <PublicNav />

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary-theme/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-theme/20 bg-primary-theme/5 px-4 py-1.5 text-xs font-semibold text-primary-theme">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trusted SaaS ERP for Overseas Recruitment
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-theme leading-tight">
              Run your overseas{" "}
              <span className="text-primary-theme">recruitment agency</span>{" "}
              from one secure platform
            </h1>

            {/* Supporting text */}
            <p className="mx-auto max-w-2xl text-lg text-text-soft leading-relaxed">
              Manage applicants, agents, documents, payments, commissions, job orders, and progress
              tracking in one centralized ERP built specifically for Bangladeshi recruitment agencies.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/apply"
                id="hero-apply-btn"
                className="inline-flex items-center gap-2.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-theme/20 hover:shadow-xl hover:shadow-primary-theme/30 transition-all duration-200"
              >
                Apply for Company Access
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                id="hero-login-btn"
                className="inline-flex items-center gap-2 rounded-xl border border-border-theme bg-surface hover:bg-bg px-8 py-3.5 text-sm font-bold text-text-theme transition-all duration-200"
              >
                Login to ERP
              </Link>
            </div>

            {/* Trust note */}
            <p className="text-xs text-text-soft font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-theme" />
              Company access is activated after platform approval. No payment required upfront.
            </p>
          </div>

          {/* Hero visual — stat badges */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: "Workflow Stages", value: "12", icon: ClipboardList, color: "indigo" },
              { label: "Document Types", value: "8+", icon: FileText, color: "blue" },
              { label: "Role Types", value: "7", icon: Users, color: "violet" },
              { label: "Uptime SLA", value: "99.9%", icon: Zap, color: "emerald" },
            ].map((stat) => {
              const c = colorMap[stat.color];
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border-theme bg-surface p-4 text-center shadow-sm"
                >
                  <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.border} border`}>
                    <Icon className={`h-4 w-4 ${c.text}`} />
                  </div>
                  <div className="text-2xl font-extrabold text-text-theme">{stat.value}</div>
                  <div className="text-[10px] font-semibold text-text-soft mt-0.5">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-surface border-y border-border-theme">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-bg px-4 py-1.5 text-xs font-semibold text-text-soft">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              Comprehensive Feature Set
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-theme tracking-tight">
              Everything your agency needs
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft">
              Built from the ground up for overseas recruitment agencies, manpower companies, study abroad consultants, and worker-sending organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature) => {
              const c = colorMap[feature.color];
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`relative rounded-2xl border border-border-theme bg-bg p-5 space-y-3 hover:border-border-strong hover:shadow-sm transition-all duration-200 ${feature.comingSoon ? "opacity-60" : ""}`}
                >
                  {feature.comingSoon && (
                    <span className="absolute top-3 right-3 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-600 uppercase tracking-wide">
                      Soon
                    </span>
                  )}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.border} border`}>
                    <Icon className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <h3 className="text-sm font-bold text-text-theme">{feature.title}</h3>
                  <p className="text-xs text-text-soft leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-surface px-4 py-1.5 text-xs font-semibold text-text-soft">
              <ChevronRight className="h-3.5 w-3.5 text-primary-theme" />
              Simple Onboarding
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-theme tracking-tight">
              How it works
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft">
              From application to a fully operational ERP workspace in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector line */}
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-border-theme to-transparent z-0" />
                )}
                <div className="relative z-10 rounded-2xl border border-border-theme bg-surface p-6 space-y-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-primary-theme/15">{item.step}</span>
                    <CheckCircle2 className="h-5 w-5 text-primary-theme/30" />
                  </div>
                  <h3 className="text-sm font-bold text-text-theme">{item.title}</h3>
                  <p className="text-xs text-text-soft leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/apply"
              id="howitworks-apply-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-200"
            >
              Start Your Application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ROLES SECTION ───────────────────────────────────────────────────── */}
      <section id="roles" className="py-20 bg-surface border-y border-border-theme">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-bg px-4 py-1.5 text-xs font-semibold text-text-soft">
              <Users className="h-3.5 w-3.5 text-primary-theme" />
              Role-Based Operations
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-theme tracking-tight">
              Built for every team member
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft">
              Granular role-based access ensures each staff member sees exactly what they need — nothing more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ROLES.map((role, index) => (
              <div
                key={role.title}
                className="rounded-2xl border border-border-theme bg-bg p-5 space-y-2 hover:border-primary-theme/30 hover:bg-primary-soft/5 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary-theme" />
                  <h3 className="text-xs font-bold text-text-theme">{role.title}</h3>
                </div>
                <p className="text-[11px] text-text-soft leading-relaxed pl-4">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING / PLAN SECTION ──────────────────────────────────────────── */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-surface px-4 py-1.5 text-xs font-semibold text-text-soft">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              Transparent Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-theme tracking-tight">
              One plan. All features.
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft">
              We currently offer a single, fully-featured Standard Plan included with every approved company workspace.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative rounded-3xl border-2 border-primary-theme/30 bg-surface p-8 shadow-xl shadow-primary-theme/5 space-y-6">
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-primary-theme via-violet-500 to-indigo-500" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-text-theme">Standard Plan</h3>
                  <p className="text-xs text-text-soft mt-0.5">All core ERP features included</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary-theme/10 border border-primary-theme/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary-theme" />
                </div>
              </div>

              <div className="rounded-xl bg-bg border border-border-theme p-4 text-center">
                <span className="text-3xl font-extrabold text-text-theme">Included</span>
                <span className="block text-xs text-text-soft mt-1">after platform approval</span>
              </div>

              <ul className="space-y-2.5">
                {[
                  "Unlimited applicant records",
                  "Agent portal access",
                  "Document management & verification",
                  "Invoice, receipt & ledger system",
                  "Commission tracking & payouts",
                  "12-stage workflow pipeline",
                  "Reports & live dashboard",
                  "RBAC with 7 role types",
                  "Audit log & notification system",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-text-theme font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/apply"
                id="pricing-apply-btn"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200"
              >
                Apply for Company Access
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="text-center text-[10px] text-text-soft">
                Billing & payment gateway coming in the next phase. Contact the platform team for enterprise pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST / SECURITY SECTION ────────────────────────────────────────── */}
      <section className="py-20 bg-surface border-y border-border-theme">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-bg px-4 py-1.5 text-xs font-semibold text-text-soft">
              <Lock className="h-3.5 w-3.5 text-primary-theme" />
              Security & Trust
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-theme tracking-tight">
              Built with security at the core
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft">
              Your applicant data, financial records, and documents are protected by enterprise-grade security architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border-theme bg-bg p-5 space-y-3 text-center hover:border-border-strong hover:shadow-sm transition-all duration-200"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary-theme/10 border border-primary-theme/20">
                    <Icon className="h-5 w-5 text-primary-theme" />
                  </div>
                  <h3 className="text-xs font-bold text-text-theme">{item.title}</h3>
                  <p className="text-[11px] text-text-soft leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-theme tracking-tight">
            Ready to digitize your recruitment operations?
          </h2>
          <p className="text-base text-text-soft">
            Join overseas recruitment agencies already managing their complete workflow on VisaTek ERP.
            Apply today and get your workspace activated after review.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/apply"
              id="bottom-apply-btn"
              className="inline-flex items-center gap-2.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-10 py-4 text-sm font-bold text-white shadow-lg shadow-primary-theme/20 hover:shadow-xl transition-all duration-200"
            >
              Apply for Company Access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-text-soft hover:text-text-theme transition-colors"
            >
              Already approved? Login →
            </Link>
          </div>
          <p className="text-xs text-text-soft">
            Company access is activated after platform review. No credit card or upfront payment required.
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-theme bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <img src="/visatek_logo_transparent.png" alt="VisaTek" className="h-8 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-5 text-xs text-text-soft">
              <Link href="/apply" className="hover:text-text-theme transition-colors">Apply</Link>
              <Link href="/login" className="hover:text-text-theme transition-colors">Login</Link>
              <span>© 2026 VisaTek. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
    <div className="min-h-screen bg-bg text-text-theme selection:bg-primary-soft selection:text-primary-theme">
      <PublicNav />

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 lg:py-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-soft/45 via-bg to-bg">
        {/* Dynamic mesh decorative background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary-theme/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 h-[500px] w-[500px] rounded-full bg-brand-red/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-theme/20 bg-surface px-4 py-1.5 text-xs font-bold text-primary-theme shadow-sm">
              <ShieldCheck className="h-4 w-4 text-brand-red" />
              Trusted SaaS ERP for Overseas Recruitment Agencies
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-text-theme leading-[1.15]">
              Run your overseas{" "}
              <span className="bg-gradient-to-r from-primary-theme via-text-theme to-brand-red bg-clip-text text-transparent">
                recruitment agency
              </span>{" "}
              from one secure platform
            </h1>

            {/* Supporting text */}
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-text-soft leading-relaxed">
              Manage applicants, agents, compliance documents, invoices, agent commissions, and real-time operational metrics in one centralized ERP engineered for global recruitment efficiency.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/apply"
                id="hero-apply-btn"
                className="inline-flex items-center gap-2.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-8 py-4 text-xs font-bold text-white shadow-lg shadow-primary-theme/25 hover:shadow-xl hover:shadow-primary-theme/35 hover:-translate-y-0.5 transition-all duration-300"
              >
                Apply for Company Access
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                id="hero-login-btn"
                className="inline-flex items-center gap-2 rounded-xl border border-border-theme bg-surface hover:bg-bg-muted px-8 py-4 text-xs font-bold text-text-theme hover:-translate-y-0.5 shadow-sm transition-all duration-300"
              >
                Login to ERP Portal
              </Link>
            </div>

            {/* Trust note */}
            <p className="text-[11px] text-text-soft font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-red" />
              Tenant workspace is activated after platform authorization. No hidden setup costs.
            </p>
          </div>

          {/* Hero visual — stat badges */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Workflow Stages", value: "12 Stages", icon: ClipboardList, color: "indigo" },
              { label: "Document Verification", value: "8+ Types", icon: FileText, color: "blue" },
              { label: "RBAC Security Profiles", value: "7 Roles", icon: Users, color: "violet" },
              { label: "Platform SLA Uptime", value: "99.9% SLA", icon: Zap, color: "emerald" },
            ].map((stat) => {
              const c = colorMap[stat.color];
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border-theme bg-surface p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.border} border`}>
                    <Icon className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <div className="text-xl font-extrabold text-text-theme">{stat.value}</div>
                  <div className="text-[10px] font-bold text-text-soft uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-surface border-y border-border-theme">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-bg px-4 py-1.5 text-xs font-bold text-text-soft shadow-sm">
              <Star className="h-3.5 w-3.5 text-brand-red fill-brand-red" />
              Enterprise Feature Matrix
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-theme tracking-tight">
              Everything your recruitment business needs
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft leading-relaxed">
              Eliminate manuals and paper folders. Scale up placements with our complete compliance tracking suite.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => {
              const c = colorMap[feature.color];
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`relative rounded-2xl border border-border-theme bg-bg p-6 space-y-4 hover:border-primary-theme/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${feature.comingSoon ? "opacity-75" : ""}`}
                >
                  {feature.comingSoon && (
                    <span className="absolute top-4 right-4 rounded-full bg-brand-red-soft border border-brand-red/20 px-2.5 py-0.5 text-[8px] font-bold text-brand-red uppercase tracking-wider">
                      Upcoming
                    </span>
                  )}
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.border} border`}>
                    <Icon className={`h-5.5 w-5.5 ${c.text}`} />
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
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-surface px-4 py-1.5 text-xs font-bold text-text-soft shadow-sm">
              <ChevronRight className="h-3.5 w-3.5 text-brand-red" />
              Workspace Provisioning Flow
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-theme tracking-tight">
              Onboarding in 4 Simple Steps
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft leading-relaxed">
              Launch your isolated cloud database and custom company workspace immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector line */}
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-border-theme via-border-theme/40 to-transparent z-0" />
                )}
                <div className="relative z-10 rounded-2xl border border-border-theme bg-surface p-6 space-y-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black bg-gradient-to-r from-primary-theme to-brand-red bg-clip-text text-transparent opacity-25">{item.step}</span>
                    <CheckCircle2 className="h-5 w-5 text-brand-red" />
                  </div>
                  <h3 className="text-xs font-extrabold text-text-theme uppercase tracking-wider">{item.title}</h3>
                  <p className="text-xs text-text-soft leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/apply"
              id="howitworks-apply-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-8 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Your Company Application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ROLES SECTION ───────────────────────────────────────────────────── */}
      <section id="roles" className="py-24 bg-surface border-y border-border-theme">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-bg px-4 py-1.5 text-xs font-bold text-text-soft shadow-sm">
              <Users className="h-3.5 w-3.5 text-brand-red" />
              Fine-Grained Audited Roles
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-theme tracking-tight">
              Designed for every operational team member
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft leading-relaxed">
              Segregate tasks seamlessly. Hand off candidates from screening to medicals, visa stamping, and flights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ROLES.map((role, index) => (
              <div
                key={role.title}
                className="rounded-2xl border border-border-theme bg-bg p-6 space-y-3 hover:border-brand-red/30 hover:bg-brand-red-soft/5 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand-red animate-pulse" />
                  <h3 className="text-xs font-extrabold text-text-theme uppercase tracking-wider">{role.title}</h3>
                </div>
                <p className="text-[11px] text-text-soft leading-relaxed pl-4">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING / PLAN SECTION ──────────────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-surface px-4 py-1.5 text-xs font-bold text-text-soft shadow-sm">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              Subscription Plans
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-theme tracking-tight">
              Transparent, simple pricing model
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft leading-relaxed">
              We offer a single, fully unlocked tier. No hidden upgrade caps or per-user seat penalties.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative rounded-3xl border-2 border-primary-theme bg-surface p-8 shadow-xl hover:shadow-2xl transition-all duration-300 space-y-6">
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-primary-theme via-text-theme to-brand-red" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-text-theme uppercase tracking-wider">Standard Plan</h3>
                  <p className="text-[11px] text-text-soft mt-0.5">All enterprise components included</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary-soft border border-primary-theme/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary-theme" />
                </div>
              </div>

              <div className="rounded-xl bg-bg border border-border-theme py-4 text-center">
                <span className="text-4xl font-black text-text-theme">Included</span>
                <span className="block text-[10px] text-text-soft mt-1 font-semibold uppercase tracking-wider">With Authorized Sign-off</span>
              </div>

              <ul className="space-y-3">
                {[
                  "Unlimited candidate files and dossiers",
                  "Dedicated sourcing agent portals",
                  "Visa & compliance documents tracker",
                  "Invoice, collection ledgers & receipts",
                  "Agent placement commissions registry",
                  "12-stage automated pipeline",
                  "Immutable system audits trail",
                  "Fine-grained RBAC with 7 profiles",
                  "Multi-channel notifications system",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs text-text-theme font-semibold">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/apply"
                id="pricing-apply-btn"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-theme hover:bg-primary-hover px-6 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                Apply for Company Access
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="text-center text-[10px] text-text-soft font-semibold leading-normal">
                Tenant billing modules will launch in the next development iteration. Active setups remain completely free during preview.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST / SECURITY SECTION ────────────────────────────────────────── */}
      <section className="py-24 bg-surface border-y border-border-theme">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-theme bg-bg px-4 py-1.5 text-xs font-bold text-text-soft shadow-sm">
              <Lock className="h-3.5 w-3.5 text-primary-theme" />
              Vetting & Compliance
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-theme tracking-tight">
              Enterprise security structure at the core
            </h2>
            <p className="max-w-xl mx-auto text-sm text-text-soft leading-relaxed">
              We encrypt sensitive passport scans and audit trail records so your agency stays compliant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border-theme bg-bg p-6 space-y-4 text-center hover:border-brand-red/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft border border-primary-theme/20">
                    <Icon className="h-5.5 w-5.5 text-primary-theme" />
                  </div>
                  <h3 className="text-xs font-bold text-text-theme uppercase tracking-wider">{item.title}</h3>
                  <p className="text-[11px] text-text-soft leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-brand-red-soft/20 via-bg to-bg">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-black text-text-theme tracking-tight leading-[1.2]">
            Ready to digitize your recruitment operations?
          </h2>
          <p className="text-sm sm:text-base text-text-soft max-w-2xl mx-auto leading-relaxed">
            Transition your teams to VisaTek today. Standard workspaces are activated instantly upon platform administration approval.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/apply"
              id="bottom-apply-btn"
              className="inline-flex items-center gap-2.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-10 py-4 text-xs font-bold text-white shadow-lg shadow-primary-theme/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Apply for Company Access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-text-soft hover:text-text-theme transition-colors"
            >
              Already registered? Login to ERP →
            </Link>
          </div>
          <p className="text-[10px] text-text-soft font-semibold">
            No credit cards required. Workspaces are provisioned onto dedicated database sub-tenants.
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-theme bg-surface py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <img src="/visatek_logo_transparent.png" alt="VisaTek" className="h-9 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-6 text-xs font-bold text-text-soft">
              <Link href="/apply" className="hover:text-text-theme transition-colors">Apply</Link>
              <Link href="/login" className="hover:text-text-theme transition-colors">Login</Link>
              <span className="text-[11px] font-normal text-text-soft/80">© 2026 VisaTek ERP. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

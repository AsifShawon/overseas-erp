// src/app/settings/branches/new/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMockAuth } from "@/context/MockAuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  FileCode,
} from "lucide-react";

export default function NewBranchPage() {
  const { user: authUser, accessToken, loading: authLoading, hasAccess } = useMockAuth();
  const router = useRouter();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isHeadOffice, setIsHeadOffice] = useState(false);

  // Security guard
  useEffect(() => {
    if (!authLoading && (!authUser || !hasAccess("CREATE_BRANCH"))) {
      router.push("/denied");
    }
  }, [authUser, authLoading, router, hasAccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!name || !code) {
      toast.error("Branch name and branch code are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/company/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          code,
          city: city || undefined,
          address: address || undefined,
          phone: phone || undefined,
          email: email || undefined,
          isHeadOffice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create branch office.");
      }

      toast.success(`Branch office "${name}" created successfully.`);
      router.push("/settings/branches");
    } catch (err: any) {
      toast.error(err.message || "Failed to create branch office.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-theme" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back to List */}
      <Link
        href="/settings/branches"
        className="inline-flex items-center gap-1.5 text-xs text-text-soft hover:text-text-theme transition-colors font-semibold"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Branch Offices
      </Link>

      {/* Page Header */}
      <div className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary-theme/10 text-primary-theme border border-primary-theme/20 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-text-theme">Create Branch Office</h2>
          <p className="text-[10px] text-text-soft">
            Add a new physical office location to support regional agent and applicant management.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border-theme bg-surface p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Branch Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="name">
              Branch Name <span className="text-danger-theme">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. Chittagong Branch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
              />
            </div>
          </div>

          {/* Branch Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="code">
              Branch Code <span className="text-danger-theme">*</span>
            </label>
            <div className="relative">
              <FileCode className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
              <input
                id="code"
                type="text"
                required
                placeholder="e.g. CTG (Short unique abbreviation)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
              />
            </div>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="city">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
              <input
                id="city"
                type="text"
                placeholder="e.g. Chittagong"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="email">
              Contact Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
              <input
                id="email"
                type="email"
                placeholder="e.g. ctg@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-theme" htmlFor="phone">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-text-soft" />
              <input
                id="phone"
                type="tel"
                placeholder="e.g. +88031000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-theme text-text-theme"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-text-theme" htmlFor="address">
              Office Address
            </label>
            <input
              id="address"
              type="text"
              placeholder="e.g. Agrabad C/A, Chittagong"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-border-theme bg-bg py-2.5 px-3 text-xs outline-none focus:border-primary-theme text-text-theme"
            />
          </div>
        </div>

        {/* Head Office designation */}
        <div className="flex items-center gap-2 p-3 rounded-xl border border-border-theme bg-bg/50">
          <input
            type="checkbox"
            id="isHeadOffice"
            checked={isHeadOffice}
            onChange={(e) => setIsHeadOffice(e.target.checked)}
            className="rounded border-border-theme text-primary-theme focus:ring-primary-theme h-4 w-4"
          />
          <div className="space-y-0.5">
            <label htmlFor="isHeadOffice" className="text-xs font-bold text-text-theme cursor-pointer block">
              Designate as Head Office (HQ)
            </label>
            <span className="block text-[10px] text-text-soft">
              Warning: Deselects the existing Head Office designation since there can only be one Head Office branch.
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-border-theme flex justify-end gap-3">
          <Link
            href="/settings/branches"
            className="rounded-xl border border-border-theme bg-surface hover:bg-surface-soft px-5 py-2.5 text-xs font-semibold text-text-theme transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-theme hover:bg-primary-hover px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Branch Office"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

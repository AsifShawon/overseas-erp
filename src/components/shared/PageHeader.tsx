import React from "react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border-theme pb-5 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[11px] font-medium text-text-soft">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-text-soft/40">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary-theme">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-text-muted">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-text-theme md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-text-soft max-w-2xl">{description}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

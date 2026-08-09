import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
    <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1 min-w-0">
        {/* Subtle Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-[11px] font-medium text-text-soft mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-text-soft/40 shrink-0" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary-theme transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-text-muted font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-xl font-bold tracking-tight text-text-theme md:text-2xl truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-text-soft max-w-3xl leading-relaxed">{description}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}


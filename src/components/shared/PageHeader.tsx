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
  /**
   * Optional and deliberately subtle. Omit rather than emitting redundant
   * trails like "ERP Hub > Dashboard > Dashboard".
   */
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  // Drop a trailing crumb that merely repeats the page title.
  const trail = breadcrumbs?.filter(
    (c, i, arr) => !(i === arr.length - 1 && c.label === title)
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
        {trail && trail.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-[11px] text-text-soft"
          >
            {trail.map((crumb, idx) => (
              <React.Fragment key={`${crumb.label}-${idx}`}>
                {idx > 0 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 opacity-50"
                  />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-primary-theme"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-text-muted">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-xl font-semibold leading-tight tracking-tight text-text-theme md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl text-xs leading-relaxed text-text-soft">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export default PageHeader;

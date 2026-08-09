"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/useT";
import { formatNumber } from "@/i18n/format";
import { EmptyPanel } from "../ui/PageState";
import { TableSkeleton } from "../ui/Skeleton";
import { SearchInput } from "../ui/SearchInput";

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  cellClassName?: string;
  /** Right-aligns header and cells. Use for money and counts. */
  numeric?: boolean;
  /** Hides the column below the `lg` breakpoint to keep mobile readable. */
  hideOnMobile?: boolean;
  /** Marks the column that identifies the record in the mobile card layout. */
  primary?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchField?: keyof T;
  /** Extra fields to match against the search term alongside `searchField`. */
  extraSearchFields?: (keyof T)[];
  filterComponent?: React.ReactNode;
  onRowClick?: (item: T) => void;
  /** Per-row action cell (kebab menu or single primary action). */
  rowActions?: (item: T) => React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: React.ReactNode;
  pageSize?: number;
  /** Renders row skeletons instead of content. */
  loading?: boolean;
  /** Stable key for each row. Falls back to index. */
  rowKey?: (item: T, index: number) => string;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder,
  searchField,
  extraSearchFields = [],
  filterComponent,
  onRowClick,
  rowActions,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
  pageSize = 10,
  loading = false,
  rowKey,
}: DataTableProps<T>) {
  const { t, locale } = useT();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const resolvedSearchPlaceholder =
    searchPlaceholder || `${t("common.search")}...`;
  const resolvedEmptyTitle = emptyStateTitle || t("common.noRecords");
  const resolvedEmptyDesc =
    emptyStateDescription ||
    (locale === "bn"
      ? "আপনার ফিল্টার বা সার্চ পরিবর্তন করে দেখুন।"
      : "Try adjusting your filters or search query.");

  const filteredData = useMemo(() => {
    if (!searchField || !searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    const fields = [searchField, ...extraSearchFields];
    return data.filter((item) =>
      fields.some((f) => {
        const value = item[f];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, searchField, searchTerm, extraSearchFields]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  /*
   * Clamp during render rather than syncing via an effect — when filtering
   * shrinks the result set the current page can fall out of range, and
   * deriving it avoids a cascading re-render.
   */
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const hasToolbar = Boolean(searchField || filterComponent);
  const primaryColumn = columns.find((c) => c.primary) || columns[0];

  if (loading) {
    return <TableSkeleton rows={Math.min(pageSize, 6)} columns={columns.length} />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-border-theme bg-surface shadow-xs">
      {hasToolbar && (
        <div className="flex flex-col gap-3 border-b border-border-theme p-3.5 sm:flex-row sm:items-center sm:justify-between">
          {searchField && (
            <SearchInput
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setCurrentPage(1);
              }}
              placeholder={resolvedSearchPlaceholder}
              className="sm:max-w-xs"
            />
          )}
          {filterComponent && (
            <div className="flex flex-wrap items-center gap-2">{filterComponent}</div>
          )}
        </div>
      )}

      {paginatedData.length === 0 ? (
        <div className="p-4">
          <EmptyPanel
            title={resolvedEmptyTitle}
            description={resolvedEmptyDesc}
            action={emptyStateAction}
            compact
          />
        </div>
      ) : (
        <>
          {/* ---------- Desktop / tablet: real table ---------- */}
          <div className="hidden overflow-x-auto scrollbar-thin md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-theme bg-bg-muted/60">
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-soft ${
                        col.numeric ? "text-right" : "text-left"
                      } ${col.hideOnMobile ? "hidden lg:table-cell" : ""}`}
                    >
                      {col.header}
                    </th>
                  ))}
                  {rowActions && (
                    <th scope="col" className="w-12 px-4 py-2.5">
                      <span className="sr-only">
                        {locale === "bn" ? "কার্যক্রম" : "Actions"}
                      </span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme">
                {paginatedData.map((item, rowIdx) => (
                  <tr
                    key={rowKey ? rowKey(item, rowIdx) : rowIdx}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(item);
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    className={`transition-colors duration-150 ${
                      onRowClick
                        ? "cursor-pointer hover:bg-bg-muted/60 focus-visible:bg-bg-muted/60"
                        : ""
                    }`}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-4 py-3 align-middle text-xs text-text-theme ${
                          col.numeric ? "text-right tabular-nums-ui" : ""
                        } ${col.hideOnMobile ? "hidden lg:table-cell" : ""} ${
                          col.cellClassName || ""
                        }`}
                      >
                        {col.accessor(item)}
                      </td>
                    ))}
                    {rowActions && (
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rowActions(item)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- Small mobile: stacked record cards ---------- */}
          <div className="divide-y divide-border-theme md:hidden">
            {paginatedData.map((item, rowIdx) => (
              <div
                key={rowKey ? rowKey(item, rowIdx) : rowIdx}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`p-4 ${onRowClick ? "cursor-pointer active:bg-bg-muted/60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {primaryColumn.accessor(item)}
                  </div>
                  {rowActions && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {rowActions(item)}
                    </div>
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  {columns
                    .filter((c) => c !== primaryColumn)
                    .map((col, colIdx) => (
                      <div key={colIdx} className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-soft">
                          {col.header}
                        </dt>
                        <dd
                          className={`mt-0.5 truncate text-xs text-text-theme ${
                            col.numeric ? "tabular-nums-ui" : ""
                          }`}
                        >
                          {col.accessor(item)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            ))}
          </div>
        </>
      )}

      {filteredData.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-border-theme px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-text-soft">
            {t("common.showingEntries", {
              from: formatNumber(startIndex + 1, locale),
              to: formatNumber(
                Math.min(startIndex + pageSize, totalItems),
                locale
              ),
              total: formatNumber(totalItems, locale),
            })}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label={locale === "bn" ? "পূর্ববর্তী পৃষ্ঠা" : "Previous page"}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border-theme text-text-soft transition-colors hover:bg-bg-muted disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-1 text-xs font-medium text-text-theme">
                {locale === "bn"
                  ? `পৃষ্ঠা ${formatNumber(page, locale)} / ${formatNumber(totalPages, locale)}`
                  : `Page ${page} of ${totalPages}`}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label={locale === "bn" ? "পরবর্তী পৃষ্ঠা" : "Next page"}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border-theme text-text-soft transition-colors hover:bg-bg-muted disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

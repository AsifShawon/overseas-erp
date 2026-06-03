"use client";

import React, { useState } from "react";
import { EmptyState } from "../ui/EmptyState";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/useT";
import { formatNumber } from "@/i18n/format";

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchField?: keyof T;
  filterComponent?: React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder,
  searchField,
  filterComponent,
  onRowClick,
  emptyStateTitle,
  emptyStateDescription,
}: DataTableProps<T>) {
  const { t, locale } = useT();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const resolvedSearchPlaceholder = searchPlaceholder || t("common.search") + "...";
  const resolvedEmptyTitle = emptyStateTitle || t("common.noRecords");
  const resolvedEmptyDesc = emptyStateDescription || (locale === "bn" ? "প্রদর্শন করার মতো কোনো রেকর্ড নেই।" : "Try adjusting your filters or search query to find what you are looking for.");

  // Filter Data
  const filteredData = data.filter((item) => {
    if (!searchField || !searchTerm) return true;
    const value = item[searchField];
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Paginate Data
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="rounded-xl border border-border-theme bg-surface shadow-sm overflow-hidden">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-4 border-b border-border-theme p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-soft">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={resolvedSearchPlaceholder}
            className="w-full rounded-xl border border-border-theme bg-bg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-theme focus:ring-2 focus:ring-primary-theme/20 text-text-theme"
          />
        </div>
        {filterComponent && <div className="flex items-center gap-3">{filterComponent}</div>}
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto scrollbar-thin">
        {paginatedData.length === 0 ? (
          <div className="p-8">
            <EmptyState title={resolvedEmptyTitle} description={resolvedEmptyDesc} />
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm leading-relaxed">
            <thead>
              <tr className="border-b border-border-theme bg-bg-muted font-bold text-text-theme">
                {columns.map((col, idx) => (
                  <th key={idx} className="px-6 py-4 text-[14px] md:text-[15px] font-bold tracking-wide uppercase/none whitespace-nowrap">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme">
              {paginatedData.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors duration-200 ${
                    onRowClick ? "cursor-pointer hover:bg-bg-muted" : ""
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4.5 text-[14px] md:text-[15px] font-medium text-text-theme ${col.cellClassName || ""}`}>
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between border-t border-border-theme px-6 py-4.5">
          <span className="text-[13px] md:text-sm font-semibold text-text-soft">
            {t("common.showingEntries", {
              from: formatNumber(startIndex + 1, locale),
              to: formatNumber(Math.min(startIndex + itemsPerPage, totalItems), locale),
              total: formatNumber(totalItems, locale),
            })}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="rounded-lg border border-border-theme p-2 text-text-soft hover:bg-bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs md:text-sm font-semibold text-text-theme">
              {locale === "bn"
                ? `পৃষ্ঠা ${formatNumber(currentPage, locale)} / ${formatNumber(totalPages, locale)}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-border-theme p-2 text-text-soft hover:bg-bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

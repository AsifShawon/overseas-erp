import { NextResponse } from "next/server";

/**
 * Escapes a single value for CSV conformity:
 * - Null/Undefined -> empty string
 * - Objects -> serialized JSON
 * - Double-quotes inside values -> double double-quotes ("")
 * - If value contains commas, quotes, or newlines -> wrap in double-quotes.
 */
export function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = "";
  if (typeof value === "object") {
    if (value instanceof Date) {
      str = value.toISOString();
    } else {
      str = JSON.stringify(value);
    }
  } else {
    str = String(value);
  }

  // Mitigate CSV / Spreadsheet Formula Injection (neutralize characters: =, +, -, @, tab, cr, lf)
  const trimmed = str.trimStart();
  const injectionChars = ["=", "+", "-", "@", "\t", "\r", "\n"];
  if (trimmed.length > 0 && injectionChars.some((char) => trimmed.startsWith(char))) {
    str = `'${str}`;
  }

  // If string contains comma, double-quote, or newline characters, we must double-quote it.
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Compiles headers and multi-dimensional rows into standard CSV text.
 */
export function buildCsv(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

/**
 * Returns a NextResponse with the appropriate CSV content-type and filename download headers.
 * Prepends the UTF-8 Byte Order Mark (BOM) to ensure clean loading of foreign characters in Microsoft Excel.
 */
export function csvResponse(filename: string, csvText: string): NextResponse {
  const bom = "\ufeff";
  return new NextResponse(bom + csvText, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

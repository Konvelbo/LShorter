/**
 * Utility functions for producing clean, RFC-4180 compliant CSV files with semicolon
 * delimiters (";") and UTF-8 BOM, optimized for Microsoft Excel (French & European locale),
 * Google Sheets, and standard spreadsheet processors without ghost columns or padding artifacts.
 */

export function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  // Standard CSV escaping: if value contains semicolon, double-quote, or newline, wrap in quotes
  if (
    str.includes(";") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvTableOptions {
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Formats a clean rectangular CSV table with UTF-8 BOM and semicolon delimiters.
 * Ensures each column is in its exact cell without ghost quotation columns or whitespace padding.
 */
export function formatCleanCsvTable(options: CsvTableOptions): string {
  const { headers, rows } = options;
  const BOM = "\uFEFF";
  const lines: string[] = [];

  // Header row (Row 1 in Excel)
  lines.push(headers.map(escapeCsvField).join(";"));

  // Data rows (Row 2+ in Excel)
  rows.forEach((row) => {
    lines.push(row.map(escapeCsvField).join(";"));
  });

  return BOM + lines.join("\r\n");
}

/**
 * High-fidelity Excel and CSV Export Utility for LShorter Analytics
 *
 * Generates beautifully styled, spacious Excel workbooks (.xls) that open
 * natively in Microsoft Excel, Apple Numbers, and LibreOffice with:
 * - Wide column spacing (no truncated text)
 * - Generous cell padding (10px - 20px)
 * - Branded header banner & modern typography (Segoe UI)
 * - Alternating zebra striping and clear borders
 */

export interface ExcelColumnDef {
  header: string;
  width?: number; // width in pixels
  align?: "left" | "center" | "right";
}

export interface ExportTableOptions {
  filename: string;
  reportTitle: string;
  reportSubtitle?: string;
  columns: ExcelColumnDef[];
  rows: (string | number)[][];
}

/**
 * Exports data as a richly formatted Excel workbook (.xls)
 * Opens directly in Microsoft Excel with generous column widths and styling.
 */
export function exportToExcelWorkbook({
  filename,
  reportTitle,
  reportSubtitle,
  columns,
  rows,
}: ExportTableOptions): void {
  // Ensure extension is .xls
  const safeFilename = filename.endsWith(".xls") ? filename : `${filename}.xls`;

  const colWidthsHtml = columns
    .map((col) => {
      const w = col.width || 220;
      return `<col style="width: ${w}px; min-width: ${w}px;" />`;
    })
    .join("\n      ");

  const headerCellsHtml = columns
    .map((col) => {
      const align = col.align || "left";
      return `<th style="background-color: #0F172A; color: #FFFFFF; font-weight: 700; font-size: 13px; font-family: 'Segoe UI', Calibri, Arial, sans-serif; padding: 12px 24px; border: 1px solid #334155; text-align: ${align}; white-space: nowrap;">${escapeHtml(
        col.header
      )}</th>`;
    })
    .join("\n      ");

  const rowsHtml = rows
    .map((row, rowIdx) => {
      const isEven = rowIdx % 2 === 0;
      const bg = isEven ? "#FFFFFF" : "#F8FAFC";
      const cells = row
        .map((cellVal, colIdx) => {
          const col = columns[colIdx] || { align: "left" };
          const align = col.align || "left";
          const valStr = String(cellVal ?? "");
          const isKpiBadge =
            valStr === "KPI" || valStr === "Verified" || valStr === "HTTP 302";

          return `<td style="background-color: ${bg}; color: #1E293B; font-size: 12px; font-family: 'Segoe UI', Calibri, Arial, sans-serif; padding: 10px 20px; border: 1px solid #E2E8F0; text-align: ${align}; white-space: nowrap;">${
            isKpiBadge
              ? `<span style="font-weight: 600; color: #0066FF;">${escapeHtml(
                  valStr
                )}</span>`
              : escapeHtml(valStr)
          }</td>`;
        })
        .join("\n      ");

      return `<tr>\n      ${cells}\n    </tr>`;
    })
    .join("\n    ");

  const totalCols = columns.length;

  const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Analytics Report</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:Print>
              <x:ValidPrinterInfo/>
            </x:Print>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 0; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 0; }
  </style>
</head>
<body>
  <table border="0" cellpadding="0" cellspacing="0">
    <colgroup>
      ${colWidthsHtml}
    </colgroup>
    <!-- Title Banner -->
    <tr>
      <td colspan="${totalCols}" style="background-color: #0066FF; color: #FFFFFF; font-size: 16px; font-weight: bold; font-family: 'Segoe UI', Calibri, Arial, sans-serif; padding: 16px 24px; border: 1px solid #0055D4;">
        ${escapeHtml(reportTitle)}
      </td>
    </tr>
    ${
      reportSubtitle
        ? `<tr>
      <td colspan="${totalCols}" style="background-color: #F1F5F9; color: #475569; font-size: 11px; font-family: 'Segoe UI', Calibri, Arial, sans-serif; padding: 8px 24px; border: 1px solid #E2E8F0;">
        ${escapeHtml(reportSubtitle)} • Generated on ${new Date().toLocaleString()}
      </td>
    </tr>`
        : ""
    }
    <!-- Spacing Row -->
    <tr style="height: 12px;">
      <td colspan="${totalCols}" style="background-color: #FFFFFF; border: none; height: 12px;"></td>
    </tr>
    <!-- Table Headers -->
    <thead>
      <tr>
        ${headerCellsHtml}
      </tr>
    </thead>
    <!-- Table Data Rows -->
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([htmlContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  triggerDownload(blob, safeFilename);
}

/**
 * Fallback / Alternative CSV export with padded columns
 */
export function exportToPaddedCSV({
  filename,
  columns,
  rows,
}: ExportTableOptions): void {
  const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  const headers = columns.map((c) => c.header);
  const csvLines = [
    headers.join(";"),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "").replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(";")
    ),
  ];

  const csvContent = "\uFEFF" + csvLines.join("\r\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, safeFilename);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

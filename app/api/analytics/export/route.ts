import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCountryName } from "@/lib/utils";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

function escapeXml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface ExportLink {
  slug: string;
  title: string;
  shortUrl: string;
  targetUrl: string;
  domainName: string;
  clicksCount: number;
  uniqueClicks: number;
  conversionsCount: number;
  ctr: string;
  revenue: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  tags: string;
  isPasswordProtected: string;
  isCloaked: string;
  hideReferrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

interface ExportClickEvent {
  id: string;
  slug: string;
  timestamp: string;
  country: string;
  countryCode: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  referrer: string;
  customerName: string;
  customerEmail: string;
  isUnique: string;
  revenue: number;
}

function generateExcelXml(
  links: ExportLink[],
  events: ExportClickEvent[],
  summary: {
    userName: string;
    userEmail: string;
    totalLinks: number;
    totalClicks: number;
    uniqueClicks: number;
    totalConversions: number;
    totalRevenue: number;
    avgCtr: string;
    exportDate: string;
    period: string;
  },
): string {
  // ─── Sheet 1: Links Performance ─────────────────────────────────────────
  const linkWidths = [
    120, 190, 190, 260, 95, 95, 95, 90, 110, 80, 140, 120, 140, 90, 80, 85, 110,
    110, 110,
  ];
  const linkColsXml = linkWidths
    .map((w) => `    <Column ss:AutoFitWidth="1" ss:Width="${w}"/>`)
    .join("\n");

  const linkHeaders = [
    "Slug / Identifier",
    "Link Title",
    "Domain & Short URL",
    "Destination URL",
    "Total Clicks",
    "Unique Clicks",
    "Conversions",
    "CTR (%)",
    "Revenue ($)",
    "Status",
    "Created At (UTC)",
    "Expires At",
    "Tags",
    "Password Gate",
    "Cloaking",
    "Hide Referrer",
    "UTM Source",
    "UTM Medium",
    "UTM Campaign",
  ];

  const linkHeaderRow =
    `    <Row ss:Height="26">\n` +
    linkHeaders
      .map(
        (col) =>
          `     <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col)}</Data></Cell>`,
      )
      .join("\n") +
    `\n    </Row>`;

  let linkDataRows = "";
  if (links.length === 0) {
    linkDataRows = `    <Row ss:Height="24">\n     <Cell ss:StyleID="DataCellLeft" ss:MergeAcross="18"><Data ss:Type="String">No links recorded for this account.</Data></Cell>\n    </Row>`;
  } else {
    linkDataRows = links
      .map((l) => {
        return `    <Row ss:Height="22">
     <Cell ss:StyleID="DataCellBold"><Data ss:Type="String">${escapeXml(l.slug)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(l.title)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(l.shortUrl)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(l.targetUrl)}</Data></Cell>
     <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${l.clicksCount}</Data></Cell>
     <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${l.uniqueClicks}</Data></Cell>
     <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${l.conversionsCount}</Data></Cell>
     <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(l.ctr)}</Data></Cell>
     <Cell ss:StyleID="MoneyCell"><Data ss:Type="Number">${l.revenue.toFixed(2)}</Data></Cell>
     <Cell ss:StyleID="${l.status === "Active" || l.status === "Actif" ? "BadgeActive" : "BadgeInactive"}"><Data ss:Type="String">${escapeXml(l.status)}</Data></Cell>
     <Cell ss:StyleID="DateCell"><Data ss:Type="String">${escapeXml(l.createdAt)}</Data></Cell>
     <Cell ss:StyleID="DateCell"><Data ss:Type="String">${escapeXml(l.expiresAt)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(l.tags)}</Data></Cell>
     <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(l.isPasswordProtected)}</Data></Cell>
     <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(l.isCloaked)}</Data></Cell>
     <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(l.hideReferrer)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(l.utmSource)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(l.utmMedium)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(l.utmCampaign)}</Data></Cell>
    </Row>`;
      })
      .join("\n");
  }

  // ─── Sheet 2: Clicks & Events Log ────────────────────────────────
  const eventWidths = [
    120, 130, 150, 140, 120, 110, 120, 110, 180, 150, 170, 85, 100,
  ];
  const eventColsXml = eventWidths
    .map((w) => `    <Column ss:AutoFitWidth="1" ss:Width="${w}"/>`)
    .join("\n");

  const eventHeaders = [
    "Event / Click ID",
    "Short Link (Slug)",
    "Timestamp (UTC)",
    "Country",
    "City",
    "Device Type",
    "Browser",
    "Operating System (OS)",
    "Traffic Source / Referrer",
    "Customer / Full Name",
    "Customer / Email",
    "Unique Visitor",
    "Value / Revenue ($)",
  ];

  const eventHeaderRow =
    `    <Row ss:Height="26">\n` +
    eventHeaders
      .map(
        (col) =>
          `     <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col)}</Data></Cell>`,
      )
      .join("\n") +
    `\n    </Row>`;

  let eventDataRows = "";
  if (events.length === 0) {
    eventDataRows = `    <Row ss:Height="24">\n     <Cell ss:StyleID="DataCellLeft" ss:MergeAcross="12"><Data ss:Type="String">No clicks recorded for the selected period.</Data></Cell>\n    </Row>`;
  } else {
    eventDataRows = events
      .map((ev) => {
        return `    <Row ss:Height="22">
     <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ev.id)}</Data></Cell>
     <Cell ss:StyleID="DataCellBold"><Data ss:Type="String">${escapeXml(ev.slug)}</Data></Cell>
     <Cell ss:StyleID="DateCell"><Data ss:Type="String">${escapeXml(ev.timestamp)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ev.country)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ev.city)}</Data></Cell>
     <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ev.device)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ev.browser)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ev.os)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ev.referrer)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ev.customerName)}</Data></Cell>
     <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ev.customerEmail)}</Data></Cell>
     <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ev.isUnique)}</Data></Cell>
     <Cell ss:StyleID="MoneyCell"><Data ss:Type="Number">${ev.revenue.toFixed(2)}</Data></Cell>
    </Row>`;
      })
      .join("\n");
  }

  // ─── Sheet 3: Synthèse & Métriques ──────────────────────────────────────────
  const summaryRows = `
    <Row ss:Height="28">
     <Cell ss:StyleID="TitleHeader" ss:MergeAcross="1"><Data ss:Type="String">Rapport de Synthèse Global - LShorter Analytics</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Utilisateur &amp; Compte :</Data></Cell>
     <Cell ss:StyleID="SummaryValue"><Data ss:Type="String">${escapeXml(summary.userName)} (${escapeXml(summary.userEmail)})</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Période Analysée :</Data></Cell>
     <Cell ss:StyleID="SummaryValue"><Data ss:Type="String">${escapeXml(summary.period)}</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Date d'Extraction du Rapport :</Data></Cell>
     <Cell ss:StyleID="SummaryValue"><Data ss:Type="String">${escapeXml(summary.exportDate)}</Data></Cell>
    </Row>
    <Row ss:Height="24">
     <Cell ss:StyleID="Header" ss:MergeAcross="1"><Data ss:Type="String">Indicateurs Clés de Performance (KPIs)</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Nombre Total de Liens Actifs</Data></Cell>
     <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${summary.totalLinks}</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Volume Total de Clics</Data></Cell>
     <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${summary.totalClicks}</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Total Clics Uniques</Data></Cell>
     <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${summary.uniqueClicks}</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Total des Conversions</Data></Cell>
     <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${summary.totalConversions}</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Taux Moyen de Conversion / CTR</Data></Cell>
     <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(summary.avgCtr)}</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Revenus Totaux Traqués (€)</Data></Cell>
     <Cell ss:StyleID="MoneyCell"><Data ss:Type="Number">${summary.totalRevenue.toFixed(2)}</Data></Cell>
    </Row>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1F2937"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="TitleHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#FF6600"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#141416" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4D4D8"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#FF6600" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SummaryLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#374151"/>
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SummaryValue">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111827"/>
  </Style>
  <Style ss:ID="DataCellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1F2937"/>
  </Style>
  <Style ss:ID="DataCellBold">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FF6600"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FF6600"/>
  </Style>
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1F2937"/>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1F2937"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="MoneyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#059669"/>
   <NumberFormat ss:Format="#,##0.00 &quot;€&quot;"/>
  </Style>
  <Style ss:ID="DateCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#4B5563"/>
  </Style>
  <Style ss:ID="BadgeActive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#166534"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="BadgeInactive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#991B1B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#991B1B"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Performance des Liens">
  <Table ss:DefaultRowHeight="20">
${linkColsXml}
${linkHeaderRow}
${linkDataRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Journal des Clics &amp; Trafic">
  <Table ss:DefaultRowHeight="20">
${eventColsXml}
${eventHeaderRow}
${eventDataRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Synthèse &amp; Métriques">
  <Table ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="1" ss:Width="250"/>
   <Column ss:AutoFitWidth="1" ss:Width="300"/>
${summaryRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

function generateCsv(
  links: ExportLink[],
  events: ExportClickEvent[],
  summary: {
    userName: string;
    userEmail: string;
    totalLinks: number;
    totalClicks: number;
    uniqueClicks: number;
    totalConversions: number;
    totalRevenue: number;
    avgCtr: string;
    exportDate: string;
    period: string;
  },
): string {
  const BOM = "\uFEFF";
  const padCell = (val: any, width: number = 28) => {
    const clean = String(val ?? "—")
      .replace(/"/g, '""')
      .replace(/\r?\n/g, " ");
    return `"  ${clean.padEnd(width, " ")}  "`;
  };

  const lines: string[] = [];

  // Section 1: Synthèse
  lines.push(`"=== ACCOUNT GLOBAL SUMMARY ==="`);
  lines.push(
    `${padCell("Account Holder", 28)} ; ${padCell(summary.userName, 42)}`,
  );
  lines.push(
    `${padCell("Email Address", 28)} ; ${padCell(summary.userEmail, 42)}`,
  );
  lines.push(
    `${padCell("Export Timestamp", 28)} ; ${padCell(summary.exportDate, 42)}`,
  );
  lines.push(
    `${padCell("Reporting Period", 28)} ; ${padCell(summary.period, 42)}`,
  );
  lines.push(
    `${padCell("Total Active Links", 28)} ; ${padCell(summary.totalLinks, 42)}`,
  );
  lines.push(
    `${padCell("Total Clicks", 28)} ; ${padCell(summary.totalClicks, 42)}`,
  );
  lines.push(
    `${padCell("Unique Visitors", 28)} ; ${padCell(summary.uniqueClicks, 42)}`,
  );
  lines.push(
    `${padCell("Attributed Conversions", 28)} ; ${padCell(summary.totalConversions, 42)}`,
  );
  lines.push(`${padCell("Average CTR", 28)} ; ${padCell(summary.avgCtr, 42)}`);
  lines.push(
    `${padCell("Total Revenue ($)", 28)} ; ${padCell("$" + summary.totalRevenue.toFixed(2), 42)}`,
  );
  lines.push("");

  // Section 2: Links Performance
  lines.push(`"=== SHORT LINKS PERFORMANCE REPORT ==="`);
  const linkColSpecs = [
    { label: "SLUG / IDENTIFIER", width: 24 },
    { label: "LINK TITLE", width: 36 },
    { label: "SHORT URL", width: 38 },
    { label: "DESTINATION TARGET URL", width: 64 },
    { label: "TOTAL CLICKS", width: 16 },
    { label: "UNIQUE CLICKS", width: 16 },
    { label: "CONVERSIONS", width: 16 },
    { label: "CTR (%)", width: 14 },
    { label: "REVENUE ($)", width: 16 },
    { label: "STATUS", width: 14 },
    { label: "CREATED AT (UTC)", width: 24 },
    { label: "EXPIRES AT", width: 24 },
    { label: "TAGS", width: 28 },
    { label: "PASSWORD GATE", width: 16 },
    { label: "CLOAKING", width: 14 },
    { label: "HIDE REFERRER", width: 16 },
    { label: "UTM SOURCE", width: 24 },
    { label: "UTM MEDIUM", width: 24 },
    { label: "UTM CAMPAIGN", width: 28 },
  ];

  lines.push(linkColSpecs.map((c) => padCell(c.label, c.width)).join(" ; "));
  lines.push(
    linkColSpecs.map((c) => padCell("-".repeat(c.width), c.width)).join(" ; "),
  );

  if (links.length === 0) {
    lines.push(padCell("No links recorded", 64));
  } else {
    links.forEach((l) => {
      const rowVals = [
        l.slug,
        l.title,
        l.shortUrl,
        l.targetUrl,
        l.clicksCount,
        l.uniqueClicks,
        l.conversionsCount,
        l.ctr,
        `$${l.revenue.toFixed(2)}`,
        l.status,
        l.createdAt,
        l.expiresAt,
        l.tags,
        l.isPasswordProtected,
        l.isCloaked,
        l.hideReferrer,
        l.utmSource,
        l.utmMedium,
        l.utmCampaign,
      ];
      lines.push(
        rowVals
          .map((v, idx) => padCell(v, linkColSpecs[idx].width))
          .join(" ; "),
      );
    });
  }
  lines.push("");

  // Section 3: Clicks Log
  lines.push(`"=== DETAILED EDGE CLICKS & TELEMETRY LOG ==="`);
  const eventColSpecs = [
    { label: "EVENT ID", width: 22 },
    { label: "SHORT LINK SLUG", width: 28 },
    { label: "TIMESTAMP (UTC)", width: 24 },
    { label: "COUNTRY", width: 30 },
    { label: "CITY / POP", width: 26 },
    { label: "DEVICE TYPE", width: 18 },
    { label: "BROWSER", width: 22 },
    { label: "OPERATING SYSTEM", width: 22 },
    { label: "REFERRER SOURCE URL", width: 44 },
    { label: "CUSTOMER NAME", width: 32 },
    { label: "CUSTOMER EMAIL", width: 38 },
    { label: "UNIQUE", width: 12 },
    { label: "REVENUE ($)", width: 16 },
  ];

  lines.push(eventColSpecs.map((c) => padCell(c.label, c.width)).join(" ; "));
  lines.push(
    eventColSpecs.map((c) => padCell("-".repeat(c.width), c.width)).join(" ; "),
  );

  if (events.length === 0) {
    lines.push(padCell("No click events recorded for this period", 64));
  } else {
    events.forEach((ev) => {
      const evVals = [
        ev.id,
        ev.slug,
        ev.timestamp,
        ev.country,
        ev.city,
        ev.device,
        ev.browser,
        ev.os,
        ev.referrer,
        ev.customerName,
        ev.customerEmail,
        ev.isUnique,
        `$${ev.revenue.toFixed(2)}`,
      ];
      lines.push(
        evVals
          .map((v, idx) => padCell(v, eventColSpecs[idx].width))
          .join(" ; "),
      );
    });
  }

  return BOM + lines.join("\r\n");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paramUserId = searchParams.get("userId");
  const linkId = searchParams.get("linkId") || "";
  const range =
    searchParams.get("range") || searchParams.get("period") || "30d";
  const format = searchParams.get("format") || "excel";

  // Map range to Cloudflare period format
  const periodParam =
    range === "day" || range === "1d"
      ? "1d"
      : range === "week" || range === "7d"
        ? "7d"
        : range === "year" || range === "365d"
          ? "365d"
          : "30d";

  const periodLabel =
    periodParam === "1d"
      ? "Last 24 Hours"
      : periodParam === "7d"
        ? "Last 7 Days"
        : periodParam === "365d"
          ? "Last 12 Months (Year)"
          : "Last 30 Days (Month)";

  // 1. Authenticate user
  const session = await auth().catch(() => null);
  const userId = session?.user?.id || paramUserId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Authentication required to export your data." },
      { status: 401 },
    );
  }

  const userName = session?.user?.name || "LShorter User";
  const userEmail = session?.user?.email || "—";

  try {
    // 2. Fetch real links and analytics from Cloudflare Worker
    const linksWorkerUrl = new URL(`${WORKER_URL}/api/v1/links`);
    linksWorkerUrl.searchParams.set("userId", userId);

    const analyticsWorkerUrl = new URL(`${WORKER_URL}/api/v1/analytics`);
    analyticsWorkerUrl.searchParams.set("userId", userId);
    analyticsWorkerUrl.searchParams.set("period", periodParam);
    if (linkId && linkId !== "all") {
      analyticsWorkerUrl.searchParams.set("linkId", linkId);
    }

    const [workerLinksRes, workerAnalyticsRes] = await Promise.all([
      fetch(linksWorkerUrl.toString(), {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
          "X-User-Id": userId,
        },
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : { success: true, data: [] }))
        .catch(() => ({ success: true, data: [] })),

      fetch(analyticsWorkerUrl.toString(), {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
          "X-User-Id": userId,
        },
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : { success: true, data: {} }))
        .catch(() => ({ success: true, data: {} })),
    ]);

    const workerList = Array.isArray(workerLinksRes?.data)
      ? workerLinksRes.data
      : Array.isArray((workerLinksRes?.data as any)?.data)
        ? (workerLinksRes.data as any).data
        : [];

    const mergedLinksMap = new Map<string, any>();

    // Traitement direct et exclusif des liens issus du Worker
    workerList.forEach((wl: any) => {
      if (!wl?.slug) return;
      const key = String(wl.slug).toLowerCase();

      const clicks = wl.clicks_count ?? wl.clicksCount ?? wl.clicks ?? 0;
      const unique =
        wl.unique_clicks ??
        wl.uniqueClicks ??
        (Number(clicks) > 0 ? clicks : 0);
      const conversions = wl.conversions_count ?? wl.conversionsCount ?? 0;
      const revenue = wl.revenue ?? 0;
      const domain = wl.domain_name || wl.domainName || "lsho.cc";
      const target = wl.target_url || wl.targetUrl || "";

      mergedLinksMap.set(key, {
        id: wl.id || `link_${wl.slug}`,
        slug: wl.slug,
        domainName: domain,
        targetUrl: target,
        shortUrl: wl.short_url || wl.shortUrl || `https://${domain}/${wl.slug}`,
        title:
          wl.title ||
          wl.meta_title ||
          wl.og_title ||
          wl.metaTitle ||
          wl.ogTitle ||
          wl.slug,
        clicksCount: Number(clicks),
        uniqueClicks: Number(unique),
        conversionsCount: Number(conversions),
        revenue: Number(revenue),
        isActive: wl.is_active !== undefined ? wl.is_active !== 0 : true,
        createdAt: wl.created_at || wl.createdAt || new Date().toISOString(),
        expiresAt: wl.expires_at || wl.expiresAt || "",
        tags: wl.tags
          ? typeof wl.tags === "string"
            ? JSON.parse(wl.tags)
            : wl.tags
          : [],
        isPasswordProtected: Boolean(
          wl.password || wl.has_password || wl.is_password_protected,
        ),
        isCloaked: Boolean(wl.is_cloaked || wl.isCloaked),
        hideReferrer: Boolean(wl.hide_referrer || wl.hideReferrer),
        utmSource: wl.utm_source || wl.utmSource || "",
        utmMedium: wl.utm_medium || wl.utmMedium || "",
        utmCampaign: wl.utm_campaign || wl.utmCampaign || "",
      });
    });

    let allLinks = Array.from(mergedLinksMap.values());

    // Filter links if specific link was chosen
    if (linkId && linkId !== "all") {
      allLinks = allLinks.filter(
        (l) =>
          l.slug === linkId || l.id === linkId || l.shortUrl.includes(linkId),
      );
    }

    // Format Link rows for export
    const exportLinks: ExportLink[] = allLinks.map((l) => {
      const clicks = Number(l.clicksCount) || 0;
      const unique = Number(l.uniqueClicks) || (clicks > 0 ? clicks : 0);
      const convs = Number(l.conversionsCount) || 0;
      const ctr =
        clicks > 0 ? ((unique / clicks) * 100).toFixed(2) + " %" : "0.00 %";
      const tagsStr = Array.isArray(l.tags)
        ? l.tags.join(", ")
        : l.tags
          ? String(l.tags)
          : "—";

      let formattedCreated = l.createdAt;
      try {
        const d = new Date(l.createdAt);
        if (!isNaN(d.getTime())) {
          formattedCreated = d.toISOString().replace("T", " ").substring(0, 19);
        }
      } catch {}

      return {
        slug: l.slug,
        title: l.title || l.slug,
        shortUrl: l.shortUrl,
        targetUrl: l.targetUrl,
        domainName: l.domainName,
        clicksCount: clicks,
        uniqueClicks: unique,
        conversionsCount: convs,
        ctr,
        revenue: Number(l.revenue) || 0,
        status: l.isActive ? "Actif" : "Inactif",
        createdAt: formattedCreated,
        expiresAt: l.expiresAt ? l.expiresAt : "Aucune",
        tags: tagsStr || "—",
        isPasswordProtected: l.isPasswordProtected ? "Oui" : "Non",
        isCloaked: l.isCloaked ? "Oui" : "Non",
        hideReferrer: l.hideReferrer ? "Oui" : "Non",
        utmSource: l.utmSource || "—",
        utmMedium: l.utmMedium || "—",
        utmCampaign: l.utmCampaign || "—",
      };
    });

    // 4. Extract Real Click & Traffic Events
    const rawAnalytics = workerAnalyticsRes?.data || {};
    const rawEvents =
      rawAnalytics.liveClickEvents ||
      rawAnalytics.live_click_events ||
      rawAnalytics.recentEvents ||
      rawAnalytics.events ||
      [];

    const exportEvents: ExportClickEvent[] = Array.isArray(rawEvents)
      ? rawEvents.map((ev: any, idx: number) => {
          const cCode = (
            ev.country_code ||
            ev.countryCode ||
            ev.country ||
            "XX"
          ).toUpperCase();
          const countryFull =
            cCode !== "XX"
              ? `${getCountryName(cCode)} (${cCode})`
              : "Inconnu (XX)";

          let formattedTime = ev.timestamp || new Date().toISOString();
          try {
            const d = new Date(ev.timestamp);
            if (!isNaN(d.getTime())) {
              formattedTime = d
                .toISOString()
                .replace("T", " ")
                .substring(0, 19);
            }
          } catch {}

          const rawName =
            ev.customerName ||
            ev.customerFullName ||
            ev.fullName ||
            ev.customer_name ||
            ev.userName ||
            ev.name;
          const rawEmail =
            ev.customerEmail || ev.email || ev.customer_email || ev.userEmail;

          return {
            id: ev.id || `clk_${idx + 1}`,
            slug: ev.slug || "lien",
            timestamp: formattedTime,
            country: countryFull,
            countryCode: cCode,
            city: ev.city || "—",
            device: ev.device || "Desktop",
            browser: ev.browser || "Chrome",
            os: ev.os || "—",
            referrer: ev.referrer || ev.source || "Direct",
            customerName: rawName ? String(rawName) : "—",
            customerEmail: rawEmail ? String(rawEmail) : "—",
            isUnique: ev.isUnique !== false ? "Oui" : "Non",
            revenue:
              Number(
                ev.conversionAmount || ev.conversion_amount || ev.revenue,
              ) || 0,
          };
        })
      : [];

    // Filter events if specific linkId
    const filteredEvents =
      linkId && linkId !== "all"
        ? exportEvents.filter((ev) => ev.slug === linkId)
        : exportEvents;

    // 5. Aggregate Summary KPIs
    const sumTotalClicks = exportLinks.reduce(
      (acc, l) => acc + l.clicksCount,
      0,
    );
    const sumUniqueClicks = exportLinks.reduce(
      (acc, l) => acc + l.uniqueClicks,
      0,
    );
    const sumConversions = exportLinks.reduce(
      (acc, l) => acc + l.conversionsCount,
      0,
    );
    const sumRevenue = exportLinks.reduce((acc, l) => acc + l.revenue, 0);

    const totalClicksFinal =
      rawAnalytics.totalClicks ?? rawAnalytics.total_clicks ?? sumTotalClicks;
    const uniqueClicksFinal =
      rawAnalytics.uniqueClicks ??
      rawAnalytics.unique_clicks ??
      sumUniqueClicks;
    const totalConversionsFinal =
      rawAnalytics.conversions ??
      rawAnalytics.total_conversions ??
      sumConversions;
    const totalRevenueFinal =
      rawAnalytics.totalRevenue ?? rawAnalytics.total_revenue ?? sumRevenue;
    const avgCtrFinal =
      totalClicksFinal > 0
        ? ((uniqueClicksFinal / totalClicksFinal) * 100).toFixed(2) + " %"
        : "0.00 %";

    const summary = {
      userName,
      userEmail,
      totalLinks: exportLinks.length,
      totalClicks: totalClicksFinal,
      uniqueClicks: uniqueClicksFinal,
      totalConversions: totalConversionsFinal,
      totalRevenue: totalRevenueFinal,
      avgCtr: avgCtrFinal,
      exportDate:
        new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      period: periodLabel,
    };

    const dateFileStr = new Date().toISOString().split("T")[0];

    // 6. Return XML Excel (.xls)
    if (format === "excel" || format === "xls") {
      const xmlContent = generateExcelXml(exportLinks, filteredEvents, summary);
      return new NextResponse(xmlContent, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="lshorter_analytics_export_${dateFileStr}.xls"`,
        },
      });
    }

    // 7. Return CSV (.csv)
    const csvContent = generateCsv(exportLinks, filteredEvents, summary);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lshorter_analytics_export_${dateFileStr}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[Export API Route Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message || "Erreur lors de l'exportation des données réelles.",
      },
      { status: 500 },
    );
  }
}

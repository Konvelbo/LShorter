import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCountryName } from "@/lib/utils";
import { resolveCountryInfo } from "@/lib/country-flags";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { ZipArchive } from "@/lib/export/zip-archive";
import { formatCleanCsvTable } from "@/lib/export/spaced-csv";
import { generateTableExcelXml } from "@/lib/export/excel-xml";
import { parseQuery, analyticsExportQuerySchema } from "@/lib/api-schemas";

function escapeXml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface ExportLink {
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

export interface ExportClickEvent {
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

export interface ExportDomain {
  domain: string;
  status: string;
  isVerified: string;
  rootRedirect: string;
  notFoundRedirect: string;
  createdAt: string;
}

export interface ExportSummary {
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
}

function generateExcelXml(
  links: ExportLink[],
  events: ExportClickEvent[],
  summary: ExportSummary,
): string {
  // Sheet 1: Links Performance with wide columns
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
    "Destination Masking",
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

  // Sheet 2: Clicks & Events Log
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

  // Sheet 3: Synthèse & Métriques
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
     <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Revenus Totaux Traqués ($)</Data></Cell>
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
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1F2937"/>
  </Style>
  <Style ss:ID="DataCellBold">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111827"/>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111827"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="MoneyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#16A34A"/>
   <NumberFormat ss:Format="$#,##0.00"/>
  </Style>
  <Style ss:ID="DateCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#4B5563"/>
  </Style>
  <Style ss:ID="BadgeActive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="BadgeInactive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Synthèse &amp; KPIs">
  <Table ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="1" ss:Width="260"/>
   <Column ss:AutoFitWidth="1" ss:Width="260"/>
${summaryRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Performance des Liens">
  <Table ss:DefaultRowHeight="20">
${linkColsXml}
${linkHeaderRow}
${linkDataRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Journal des Clics &amp; Evénements">
  <Table ss:DefaultRowHeight="20">
${eventColsXml}
${eventHeaderRow}
${eventDataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

function aggregateCounts(
  events: ExportClickEvent[],
  extractor: (ev: ExportClickEvent) => string,
): { name: string; count: number; percentage: string }[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const ev of events) {
    const val = extractor(ev).trim() || "Inconnu";
    map.set(val, (map.get(val) || 0) + 1);
    total++;
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) + " %" : "0.0 %",
    }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { data: qp, error: qpError } = parseQuery(searchParams, analyticsExportQuerySchema);
  if (qpError) return qpError;

  const paramUserId = qp.userId || null;
  const linkId = qp.linkId || "";
  const range = qp.range || qp.period || "30d";
  const format = qp.format || "excel";

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
      ? "Dernières 24 Heures"
      : periodParam === "7d"
        ? "7 Derniers Jours"
        : periodParam === "365d"
          ? "Année Complète (365 jours)"
          : "30 Derniers Jours (Mois)";

  // 1. Authenticate user strictly via session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Authentification requise pour exporter vos données." },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  const userName = session?.user?.name || "LShorter User";
  const userEmail = session?.user?.email || "—";

  try {
    // 2. Fetch real links, analytics, and custom domains in parallel from Cloudflare Worker
    const linksWorkerUrl = new URL(`${WORKER_URL}/api/v1/links`);
    linksWorkerUrl.searchParams.set("userId", userId);

    const analyticsWorkerUrl = new URL(`${WORKER_URL}/api/v1/analytics`);
    analyticsWorkerUrl.searchParams.set("userId", userId);
    analyticsWorkerUrl.searchParams.set("period", periodParam);
    if (linkId && linkId !== "all") {
      analyticsWorkerUrl.searchParams.set("linkId", linkId);
    }

    const domainsWorkerUrl = new URL(`${WORKER_URL}/api/v1/domains`);
    domainsWorkerUrl.searchParams.set("userId", userId);

    const [workerLinksRes, workerAnalyticsRes, workerDomainsRes] =
      await Promise.all([
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

        fetch(domainsWorkerUrl.toString(), {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
            "X-User-Id": userId,
          },
          cache: "no-store",
        })
          .then((r) => (r.ok ? r.json() : { success: true, data: [] }))
          .catch(() => ({ success: true, data: [] })),
      ]);

    const workerList = Array.isArray(workerLinksRes?.data)
      ? workerLinksRes.data
      : Array.isArray((workerLinksRes?.data as any)?.data)
        ? (workerLinksRes.data as any).data
        : [];

    const mergedLinksMap = new Map<string, any>();

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

    if (linkId && linkId !== "all") {
      allLinks = allLinks.filter(
        (l) =>
          l.slug === linkId || l.id === linkId || l.shortUrl.includes(linkId),
      );
    }

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
          const geo = resolveCountryInfo({
            countryCode: ev.country_code || ev.countryCode || ev.country,
            countryName: ev.countryName || ev.country_name,
            city: ev.city,
          });
          const cCode = geo.countryCode;
          const countryFull =
            cCode !== "XX"
              ? `${geo.countryName} (${cCode})`
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
            city: geo.city,
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

    const filteredEvents =
      linkId && linkId !== "all"
        ? exportEvents.filter((ev) => ev.slug === linkId)
        : exportEvents;

    // 5. Extract Custom Domains
    const rawDomains = Array.isArray(workerDomainsRes?.data)
      ? workerDomainsRes.data
      : Array.isArray((workerDomainsRes?.data as any)?.data)
        ? (workerDomainsRes.data as any).data
        : [];

    const exportDomains: ExportDomain[] = rawDomains.map((dom: any) => ({
      domain: dom.domain || dom.domain_name || "—",
      status: dom.status || (dom.is_verified ? "Actif" : "En attente DNS"),
      isVerified: dom.is_verified || dom.isVerified ? "Vérifié" : "Non vérifié",
      rootRedirect: dom.root_redirect || dom.rootRedirect || "—",
      notFoundRedirect: dom.not_found_redirect || dom.notFoundRedirect || "—",
      createdAt: dom.created_at || dom.createdAt || "—",
    }));

    // 6. Aggregate Summary KPIs
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

    const exportDateStr =
      new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
    const dateFileStr = new Date().toISOString().split("T")[0];

    const summary: ExportSummary = {
      userName,
      userEmail,
      totalLinks: exportLinks.length,
      totalClicks: totalClicksFinal,
      uniqueClicks: uniqueClicksFinal,
      totalConversions: totalConversionsFinal,
      totalRevenue: totalRevenueFinal,
      avgCtr: avgCtrFinal,
      exportDate: exportDateStr,
      period: periodLabel,
    };

    // --- Master CSV Tables ---
    const masterLinkHeaders = [
      "Slug / Identifiant",
      "Titre du Lien",
      "URL Courte",
      "URL de Destination (Cible)",
      "Domaine",
      "Clics Totaux",
      "Clics Uniques",
      "Conversions",
      "Taux CTR (%)",
      "Revenu ($)",
      "Statut",
      "Date Création (UTC)",
      "Date Expiration",
      "Tags",
      "Protection Mot de Passe",
      "Masquage (Cloaking)",
      "Masquer Referrer",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
    ];

    const masterLinkRows = exportLinks.map((l) => [
      l.slug,
      l.title,
      l.shortUrl,
      l.targetUrl,
      l.domainName,
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
    ]);

    const masterCsvContent = formatCleanCsvTable({
      headers: masterLinkHeaders,
      rows: masterLinkRows,
    });

    const masterEventHeaders = [
      "ID du Clic",
      "Slug du Lien",
      "Horodatage (UTC)",
      "Code Pays",
      "Nom du Pays",
      "Ville / Edge PoP",
      "Type d'Appareil",
      "Navigateur Web",
      "Système d'Exploitation (OS)",
      "Source de Trafic / Referrer",
      "Nom du Client",
      "Email du Client",
      "Visiteur Unique",
      "Revenu Attribué ($)",
    ];

    const masterEventRows = filteredEvents.map((ev) => [
      ev.id,
      ev.slug,
      ev.timestamp,
      ev.countryCode,
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
    ]);

    const masterEventsCsvContent = formatCleanCsvTable({
      headers: masterEventHeaders,
      rows: masterEventRows,
    });

    // 7. FORMAT: Return ZIP Archive with clean subfolders & formatted files
    if (format === "zip") {
      const zip = new ZipArchive();

      // --- A) Root Master Files ---
      zip.addFile("events_and_clicks_master.csv", masterCsvContent);
      zip.addFile(
        "events_and_clicks_raw_telemetry.csv",
        masterEventsCsvContent,
      );

      // Provide multi-sheet XML Excel workbook with wide auto-sized columns & colored styles
      const excelXmlWorkbook = generateExcelXml(
        exportLinks,
        filteredEvents,
        summary,
      );
      zip.addFile("events_and_clicks_master_excel.xls", excelXmlWorkbook);

      // Telemetry Excel workbook with wide columns
      const streamXmlCols = [
        { header: "ID du Clic", width: 160, align: "Center" as const },
        { header: "Slug du Lien", width: 160 },
        { header: "Horodatage (UTC)", width: 180, align: "Center" as const },
        { header: "Code Pays", width: 120, align: "Center" as const },
        { header: "Nom du Pays", width: 220 },
        { header: "Ville / Edge PoP", width: 180 },
        { header: "Type d'Appareil", width: 140, align: "Center" as const },
        { header: "Navigateur Web", width: 160 },
        { header: "Système d'Exploitation (OS)", width: 180 },
        { header: "Source de Trafic / Referrer", width: 260 },
        { header: "Nom du Client", width: 200 },
        { header: "Email du Client", width: 240 },
        { header: "Visiteur Unique", width: 140, align: "Center" as const },
        { header: "Revenu Attribué ($)", width: 160, isMoney: true, align: "Right" as const },
      ];
      zip.addFile(
        "events_and_clicks_raw_telemetry.xls",
        generateTableExcelXml("Journal des Clics", streamXmlCols, masterEventRows),
      );

      // --- B) README / INDEX ---
      const readme = [
        "================================================================================",
        "             LSHORTER — EXPORTATION OFFICIELLE DES DONNEES (ARCHIVE ZIP)         ",
        "================================================================================",
        "",
        `Titulaire du compte : ${summary.userName} (${summary.userEmail})`,
        `Identifiant Unique : ${userId}`,
        `Date d'extraction  : ${summary.exportDate}`,
        `Période couverte   : ${summary.period}`,
        `Nombre de liens    : ${summary.totalLinks}`,
        `Volume de clics    : ${summary.totalClicks} (${summary.uniqueClicks} uniques)`,
        `Conversions traquées: ${summary.totalConversions}`,
        `Chiffre d'affaires : $${summary.totalRevenue.toFixed(2)}`,
        "",
        "--------------------------------------------------------------------------------",
        "STRUCTURE DES SOUS-DOSSIERS ET CONTENU DES FICHIERS CSV & EXCEL",
        "--------------------------------------------------------------------------------",
        "",
        "📁 / (Racine de l'archive) :",
        "  ├── events_and_clicks_master.csv          : Directoire complet de vos liens courts & statistiques (format CSV standard).",
        "  ├── events_and_clicks_master_excel.xls    : Classeur Excel multi-onglets avec colonnes larges pré-formatées (140-260px).",
        "  ├── events_and_clicks_raw_telemetry.csv   : Journal chronologique de chaque clic individuel (format CSV standard).",
        "  ├── events_and_clicks_raw_telemetry.xls   : Journal chronologique au format Excel avec colonnes larges et alignées.",
        "  └── README_ARCHIVE.txt                    : Ce document explicatif et d'indexation.",
        "",
        "📁 links/ (Page Liens Courts) :",
        "  ├── links_directory.csv                   : Directoire exhaustif (format CSV).",
        "  └── links_directory.xls                   : Directoire au format Excel avec colonnes larges (140 à 320 px).",
        "",
        "📁 analytics/ (Module Analytique Multi-Pages) :",
        "  ├── overview/                             : Métriques globales et historique quotidien (.csv & .xls).",
        "  ├── geography/                            : Répartition géographique par pays et villes (.csv & .xls).",
        "  ├── devices/                              : Analyse technologique : appareils, navigateurs, OS (.csv & .xls).",
        "  ├── sources/                              : Origine et canaux d'acquisition du trafic (.csv & .xls).",
        "  ├── revenue/                              : Ventes et conversions attribuées (.csv & .xls).",
        "  └── live_stream/                          : Flux télémétrique en temps réel (.csv & .xls).",
        "",
        "📁 domains/ (Page Domaines Personnalisés) :",
        "  ├── custom_domains.csv                    : Directoire des noms de domaine connectés (format CSV).",
        "  └── custom_domains.xls                    : Directoire au format Excel avec colonnes larges (140 à 280 px).",
        "",
        "--------------------------------------------------------------------------------",
        "NOTE TECHNIQUE SUR LA LARGEUR DES COLONNES :",
        "- Les fichiers .xls (Excel) s'ouvrent directement avec des colonnes larges et aérées (140 à 320 px),",
        "  des en-têtes stylisés en couleur et sans aucune troncature de texte.",
        "- Les fichiers .csv utilisent le standard universel UTF-8 avec séparateur point-virgule (;).",
        "================================================================================",
      ].join("\r\n");
      zip.addFile("README_ARCHIVE.txt", readme);

      // --- C) Subfolder: links/ ---
      const linksCsv = formatCleanCsvTable({
        headers: masterLinkHeaders,
        rows: masterLinkRows,
      });
      zip.addFile("links/links_directory.csv", linksCsv);

      const linkXmlCols = [
        { header: "Slug / Identifiant", width: 140 },
        { header: "Titre du Lien", width: 220 },
        { header: "URL Courte", width: 220 },
        { header: "URL de Destination (Cible)", width: 320 },
        { header: "Domaine", width: 120 },
        { header: "Clics Totaux", width: 100, isNumber: true, align: "Right" as const },
        { header: "Clics Uniques", width: 100, isNumber: true, align: "Right" as const },
        { header: "Conversions", width: 100, isNumber: true, align: "Right" as const },
        { header: "Taux CTR (%)", width: 100, align: "Center" as const },
        { header: "Revenu ($)", width: 110, isMoney: true, align: "Right" as const },
        { header: "Statut", width: 100, align: "Center" as const },
        { header: "Date Création (UTC)", width: 160, align: "Center" as const },
        { header: "Date Expiration", width: 140, align: "Center" as const },
        { header: "Tags", width: 160 },
        { header: "Protection Mot de Passe", width: 140, align: "Center" as const },
        { header: "Masquage (Cloaking)", width: 140, align: "Center" as const },
        { header: "Masquer Referrer", width: 130, align: "Center" as const },
        { header: "UTM Source", width: 140 },
        { header: "UTM Medium", width: 140 },
        { header: "UTM Campaign", width: 160 },
      ];
      zip.addFile("links/links_directory.xls", generateTableExcelXml("Liens Courts", linkXmlCols, masterLinkRows));

      // --- D) Subfolder: analytics/overview/ ---
      const overviewKpiRows = [
        ["Nombre Total de Liens Actifs", summary.totalLinks, "Nombre de liens configurés sur le compte"],
        ["Volume Total de Clics", summary.totalClicks, "Nombre total de redirections exécutées à l'Edge"],
        ["Visiteurs Uniques Vérifiés", summary.uniqueClicks, "Visiteurs uniques dédupliqués sur la période"],
        ["Conversions Traquées", summary.totalConversions, "Actions ou objectifs convertis via les liens"],
        ["Taux de Clic Moyen (CTR)", summary.avgCtr, "Ratio clics uniques / clics totaux"],
        ["Chiffre d'Affaires Généré ($)", `$${summary.totalRevenue.toFixed(2)}`, "Valeur marchande cumulée attribuée"],
        ["Titulaire du Compte", summary.userName, "Nom du compte propriétaire"],
        ["Email", summary.userEmail, "Adresse email du compte"],
        ["Période Analysée", summary.period, "Période temporelle sélectionnée"],
        ["Date d'Extraction", summary.exportDate, "Horodatage UTC de la génération du rapport"],
      ];
      const overviewKpisCsv = formatCleanCsvTable({
        headers: ["Indicateur de Performance (KPI)", "Valeur Mesurée", "Description"],
        rows: overviewKpiRows,
      });
      zip.addFile("analytics/overview/overview_kpis.csv", overviewKpisCsv);

      const kpiXmlCols = [
        { header: "Indicateur de Performance (KPI)", width: 240 },
        { header: "Valeur Mesurée", width: 160, align: "Center" as const },
        { header: "Description", width: 340 },
      ];
      zip.addFile("analytics/overview/overview_kpis.xls", generateTableExcelXml("Indicateurs KPIs", kpiXmlCols, overviewKpiRows));

      // Timeline day by day
      const dailyMap = new Map<string, { clicks: number; unique: number; conversions: number }>();
      const rawDays = rawAnalytics.clicksByDay || rawAnalytics.clicks_by_day || [];
      if (Array.isArray(rawDays) && rawDays.length > 0) {
        rawDays.forEach((d: any) => {
          const dt = d.date || d.day || d.timestamp || "";
          if (dt) {
            dailyMap.set(dt, {
              clicks: Number(d.clicks || d.count || 0),
              unique: Number(d.uniqueClicks || d.unique || 0),
              conversions: Number(d.conversions || 0),
            });
          }
        });
      }
      if (dailyMap.size === 0 && filteredEvents.length > 0) {
        filteredEvents.forEach((ev) => {
          const dt = ev.timestamp.substring(0, 10);
          const current = dailyMap.get(dt) || { clicks: 0, unique: 0, conversions: 0 };
          current.clicks += 1;
          if (ev.isUnique === "Oui") current.unique += 1;
          if (ev.revenue > 0) current.conversions += 1;
          dailyMap.set(dt, current);
        });
      }

      const dailyRows = Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, stats]) => [
          date,
          stats.clicks,
          stats.unique || stats.clicks,
          stats.conversions,
          stats.clicks > 0
            ? (((stats.unique || stats.clicks) / stats.clicks) * 100).toFixed(1) + " %"
            : "0.0 %",
        ]);

      const dailyClicksCsv = formatCleanCsvTable({
        headers: ["Date (AAAA-MM-JJ)", "Volume de Clics", "Visiteurs Uniques", "Conversions", "Taux CTR Quotidien (%)"],
        rows: dailyRows,
      });
      zip.addFile("analytics/overview/daily_clicks.csv", dailyClicksCsv);

      const dailyXmlCols = [
        { header: "Date (AAAA-MM-JJ)", width: 160, align: "Center" as const },
        { header: "Volume de Clics", width: 130, isNumber: true, align: "Right" as const },
        { header: "Visiteurs Uniques", width: 140, isNumber: true, align: "Right" as const },
        { header: "Conversions", width: 120, isNumber: true, align: "Right" as const },
        { header: "Taux CTR Quotidien (%)", width: 160, align: "Center" as const },
      ];
      zip.addFile("analytics/overview/daily_clicks.xls", generateTableExcelXml("Clics Quotidiens", dailyXmlCols, dailyRows));

      // --- E) Subfolder: analytics/geography/ ---
      const countryStats = aggregateCounts(filteredEvents, (ev) => ev.countryCode || "XX");
      const countryRows = countryStats.map((c) => {
        const full = c.name !== "XX" ? getCountryName(c.name) : "Inconnu";
        return [c.name, full, c.count, c.percentage];
      });

      const countriesCsv = formatCleanCsvTable({
        headers: ["Code Pays (ISO2)", "Nom du Pays", "Volume de Clics", "Part du Trafic (%)"],
        rows: countryRows,
      });
      zip.addFile("analytics/geography/top_countries.csv", countriesCsv);

      const countryXmlCols = [
        { header: "Code Pays (ISO2)", width: 130, align: "Center" as const },
        { header: "Nom du Pays", width: 220 },
        { header: "Volume de Clics", width: 140, isNumber: true, align: "Right" as const },
        { header: "Part du Trafic (%)", width: 150, align: "Center" as const },
      ];
      zip.addFile("analytics/geography/top_countries.xls", generateTableExcelXml("Top Pays", countryXmlCols, countryRows));

      const cityStats = aggregateCounts(filteredEvents, (ev) =>
        ev.city && ev.city !== "—" ? `${ev.city} (${ev.countryCode})` : "Edge PoP Inconnu",
      );
      const cityRows = cityStats.map((c) => [c.name, c.count, c.percentage]);

      const citiesCsv = formatCleanCsvTable({
        headers: ["Ville / Nœud Edge PoP", "Volume de Clics", "Part du Trafic (%)"],
        rows: cityRows,
      });
      zip.addFile("analytics/geography/top_cities.csv", citiesCsv);

      const cityXmlCols = [
        { header: "Ville / Nœud Edge PoP", width: 240 },
        { header: "Volume de Clics", width: 140, isNumber: true, align: "Right" as const },
        { header: "Part du Trafic (%)", width: 150, align: "Center" as const },
      ];
      zip.addFile("analytics/geography/top_cities.xls", generateTableExcelXml("Top Villes", cityXmlCols, cityRows));

      // --- F) Subfolder: analytics/devices/ ---
      const deviceStats = aggregateCounts(filteredEvents, (ev) => ev.device || "Desktop");
      const deviceRows = deviceStats.map((d) => [d.name, d.count, d.percentage]);
      const devicesCsv = formatCleanCsvTable({
        headers: ["Type d'Appareil", "Volume de Clics", "Part de Marché (%)"],
        rows: deviceRows,
      });
      zip.addFile("analytics/devices/device_types.csv", devicesCsv);

      const devXmlCols = [
        { header: "Type d'Appareil", width: 200 },
        { header: "Volume de Clics", width: 140, isNumber: true, align: "Right" as const },
        { header: "Part de Marché (%)", width: 160, align: "Center" as const },
      ];
      zip.addFile("analytics/devices/device_types.xls", generateTableExcelXml("Appareils", devXmlCols, deviceRows));

      const browserStats = aggregateCounts(filteredEvents, (ev) => ev.browser || "Chrome");
      const browserRows = browserStats.map((b) => [b.name, b.count, b.percentage]);
      const browsersCsv = formatCleanCsvTable({
        headers: ["Navigateur Web", "Volume de Clics", "Part du Trafic (%)"],
        rows: browserRows,
      });
      zip.addFile("analytics/devices/browsers.csv", browsersCsv);

      const browserXmlCols = [
        { header: "Navigateur Web", width: 200 },
        { header: "Volume de Clics", width: 140, isNumber: true, align: "Right" as const },
        { header: "Part du Trafic (%)", width: 160, align: "Center" as const },
      ];
      zip.addFile("analytics/devices/browsers.xls", generateTableExcelXml("Navigateurs", browserXmlCols, browserRows));

      const osStats = aggregateCounts(filteredEvents, (ev) => ev.os || "Inconnu");
      const osRows = osStats.map((o) => [o.name, o.count, o.percentage]);
      const osCsv = formatCleanCsvTable({
        headers: ["Système d'Exploitation (OS)", "Volume de Clics", "Part du Trafic (%)"],
        rows: osRows,
      });
      zip.addFile("analytics/devices/operating_systems.csv", osCsv);

      const osXmlCols = [
        { header: "Système d'Exploitation (OS)", width: 220 },
        { header: "Volume de Clics", width: 140, isNumber: true, align: "Right" as const },
        { header: "Part du Trafic (%)", width: 160, align: "Center" as const },
      ];
      zip.addFile("analytics/devices/operating_systems.xls", generateTableExcelXml("Systèmes OS", osXmlCols, osRows));

      // --- G) Subfolder: analytics/sources/ ---
      const sourceStats = aggregateCounts(filteredEvents, (ev) => ev.referrer || "Direct");
      const sourceRows = sourceStats.map((s) => [s.name, s.count, s.percentage]);
      const sourcesCsv = formatCleanCsvTable({
        headers: ["Canal / Source de Trafic (Referrer)", "Volume de Clics", "Part du Trafic (%)"],
        rows: sourceRows,
      });
      zip.addFile("analytics/sources/traffic_sources.csv", sourcesCsv);

      const sourceXmlCols = [
        { header: "Canal / Source de Trafic (Referrer)", width: 280 },
        { header: "Volume de Clics", width: 140, isNumber: true, align: "Right" as const },
        { header: "Part du Trafic (%)", width: 160, align: "Center" as const },
      ];
      zip.addFile("analytics/sources/traffic_sources.xls", generateTableExcelXml("Sources de Trafic", sourceXmlCols, sourceRows));

      // --- H) Subfolder: analytics/revenue/ ---
      const conversionEvents = filteredEvents.filter((ev) => ev.revenue > 0);
      const conversionRows = conversionEvents.map((ev) => [
        ev.id,
        ev.slug,
        ev.timestamp,
        `$${ev.revenue.toFixed(2)}`,
        ev.customerName,
        ev.customerEmail,
        ev.country,
      ]);
      const revenueCsv = formatCleanCsvTable({
        headers: ["ID Evénement", "Slug du Lien", "Date & Heure (UTC)", "Montant Revenu ($)", "Nom du Client", "Email du Client", "Pays"],
        rows: conversionRows,
      });
      zip.addFile("analytics/revenue/conversions_and_revenue.csv", revenueCsv);

      const revXmlCols = [
        { header: "ID Evénement", width: 160, align: "Center" as const },
        { header: "Slug du Lien", width: 180 },
        { header: "Date & Heure (UTC)", width: 180, align: "Center" as const },
        { header: "Montant Revenu ($)", width: 150, isMoney: true, align: "Right" as const },
        { header: "Nom du Client", width: 220 },
        { header: "Email du Client", width: 260 },
        { header: "Pays", width: 180 },
      ];
      zip.addFile("analytics/revenue/conversions_and_revenue.xls", generateTableExcelXml("Ventes & Revenus", revXmlCols, conversionRows));

      // --- I) Subfolder: analytics/live_stream/ ---
      const streamRows = filteredEvents.map((ev) => [
        ev.id,
        ev.slug,
        ev.timestamp,
        ev.country,
        ev.city,
        ev.device,
        ev.browser,
        ev.os,
        ev.referrer,
        ev.isUnique,
        `$${ev.revenue.toFixed(2)}`,
      ]);
      const streamCsv = formatCleanCsvTable({
        headers: ["ID du Clic", "Slug du Lien", "Horodatage (UTC)", "Pays", "Ville / Edge PoP", "Appareil", "Navigateur", "Système (OS)", "Source / Referrer", "Visiteur Unique", "Revenu Attribué ($)"],
        rows: streamRows,
      });
      zip.addFile("analytics/live_stream/raw_click_events.csv", streamCsv);

      zip.addFile("analytics/live_stream/raw_click_events.xls", generateTableExcelXml("Flux Temps Réel", streamXmlCols, streamRows));

      // --- J) Subfolder: domains/ ---
      const domainRows = exportDomains.map((d) => [
        d.domain,
        d.status,
        d.isVerified,
        d.rootRedirect,
        d.notFoundRedirect,
        d.createdAt,
      ]);
      const domainsCsv = formatCleanCsvTable({
        headers: ["Nom de Domaine", "Statut", "Vérification DNS", "Redirection Racine", "Redirection 404", "Date de Configuration"],
        rows: domainRows,
      });
      zip.addFile("domains/custom_domains.csv", domainsCsv);

      const domainXmlCols = [
        { header: "Nom de Domaine", width: 220 },
        { header: "Statut", width: 140, align: "Center" as const },
        { header: "Vérification DNS", width: 160, align: "Center" as const },
        { header: "Redirection Racine", width: 280 },
        { header: "Redirection 404", width: 280 },
        { header: "Date de Configuration", width: 180, align: "Center" as const },
      ];
      zip.addFile("domains/custom_domains.xls", generateTableExcelXml("Domaines", domainXmlCols, domainRows));

      // Build binary zip buffer
      const zipBuffer = zip.toBuffer();

      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="lshorter_data_${userId}_${dateFileStr}.zip"`,
          "Content-Length": String(zipBuffer.length),
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // 8. FORMAT: Return XML Excel (.xls)
    if (format === "excel") {
      const xmlContent = generateExcelXml(exportLinks, filteredEvents, summary);
      return new NextResponse(xmlContent, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="lshorter_analytics_export_${dateFileStr}.xls"`,
        },
      });
    }

    // 9. FORMAT: Return Master Clean CSV (.csv)
    return new NextResponse(masterCsvContent, {
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

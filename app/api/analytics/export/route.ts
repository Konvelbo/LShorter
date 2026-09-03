import { NextResponse } from "next/server";

const WORKER_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.QUICKLINK_API_URL || "https://lshorter-api.fiatechnologiecam.workers.dev";
const MASTER_KEY = process.env.QUICKLINK_MASTER_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("linkId") || "";

  // UTF-8 BOM for Microsoft Excel compatibility
  const BOM = "\uFEFF";

  // Build clean, Excel-compatible CSV with semicolon separator (standard for Excel)
  const rows = [
    ["ID Evenement", "Lien Court", "Type d'Evenement", "Montant", "Devise", "ID Client", "Email Client", "Nom Client", "ID Clic", "Date de Conversion (UTC)"],
    ["evt_99b12c4", "promo-ete-2026", "Achat Produit (Purchase)", "49.00", "EUR", "usr_123", "jean.dupont@gmail.com", "Jean Dupont", "clk_9918a", "2026-08-31 08:52:14"],
    ["evt_88a31b2", "black-friday-early", "Accès VIP (Subscription)", "120.00", "EUR", "usr_456", "kouame.a@orange.ci", "Kouamé Armand", "clk_9916c", "2026-08-31 08:50:12"],
    ["evt_77c44d1", "promo-ete-2026", "Abonnement Pro", "65.00", "USD", "usr_789", "sarah.m@uscompany.com", "Sarah Miller", "clk_9913f", "2026-08-31 08:42:02"],
    ["evt_66d21e0", "newsletter-juillet", "Lead Qualifie", "15.00", "EUR", "usr_321", "alice@acme.corp", "Alice Martin", "clk_9915d", "2026-08-31 08:35:10"],
    ["evt_55e10f9", "app-android-beta", "In-App Purchase", "29.99", "EUR", "usr_654", "thomas.b@gmail.com", "Thomas Bernard", "clk_9914e", "2026-08-31 08:20:45"],
    ["evt_44f09a8", "promo-ete-2026", "Achat Produit (Purchase)", "99.00", "EUR", "usr_888", "marc.d@free.fr", "Marc Durand", "clk_9912g", "2026-08-31 08:12:00"],
    ["evt_33a88b7", "black-friday-early", "Achat Produit (Purchase)", "149.00", "EUR", "usr_999", "claire.v@wanadoo.fr", "Claire Vallet", "clk_9911h", "2026-08-31 07:55:22"]
  ];

  // Filter if linkId is specified
  const filteredRows = linkId
    ? [rows[0], ...rows.slice(1).filter((r) => r[1].includes(linkId) || linkId === "all")]
    : rows;

  const csvBody = filteredRows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  const fullCsvContent = BOM + csvBody;

  return new NextResponse(fullCsvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lshorter_analytics_export_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

// ============================================================================
// Standard PDF 1.4 Binary Invoice Generator (Pure TypeScript, Zero-Dependency)
// ============================================================================

export interface InvoicePdfData {
  invoiceNumber: string;
  date: string;
  planId: 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  planName: string;
  amountPaid: number;
  periodStart: string;
  periodEnd: string;
  currency?: string;
  status?: string;
  companyName?: string;
  customerName?: string;
  customerEmail?: string;
  taxId?: string;
  billingAddress?: string;
  overageClicks?: number;
  overageAmount?: number;
  batchesOverage?: number;
}

/**
 * Escapes characters for PDF string literals.
 */
function escapePdfText(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
}

/**
 * Generates a clean, modern, executive Light Mode PDF 1.4 invoice in pure TypeScript.
 * Coordinates strictly respect the US Letter MediaBox [0 0 612 792].
 */
export function generateInvoicePdf(data: InvoicePdfData): Buffer {
  const currency = data.currency || "EUR";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "EUR " : `${currency} `;
  const status = (data.status || "PAID").toUpperCase();
  const company = data.companyName || data.customerName || "LShorter Customer";
  // Configurable Issuer Identity (Supports env variables or clean digital SaaS branding)
  const issuerName = process.env.BILLING_COMPANY_NAME || "LShorter Global Infrastructure";
  const issuerAddress = process.env.BILLING_COMPANY_ADDRESS || "Digital Infrastructure & Global Edge Network";
  const issuerTaxId = process.env.BILLING_TAX_ID || "";
  const issuerSub = issuerTaxId
    ? `Identifiant Fiscal / Tax ID : ${issuerTaxId}`
    : "Plateforme de routage SaaS & Télémétrie Edge";
  const issuerContact = `Support : billing@lsho.cc  |  https://lsho.cc`;

  const address = data.billingAddress || "Compte Client vérifié / Adresse numérique";
  const vat = data.taxId
    ? `N TVA / Tax ID : ${data.taxId}`
    : "TVA Client : Exoneration / Autoliquidation B2B (Art. 283-2 CGI)";
  const email = data.customerEmail || "customer@lsho.cc";

  const baseAmount = data.overageAmount ? Math.max(0, data.amountPaid - data.overageAmount) : data.amountPaid;
  const subtotalHt = data.amountPaid.toFixed(2);
  const vatRate = "0.00%";
  const taxAmount = "0.00";
  const totalTtc = data.amountPaid.toFixed(2);

  // Plan quota details for invoice line item description
  const planUpper = String(data.planId || "PRO").toUpperCase();
  const quotaSummary =
    planUpper === "ENTERPRISE"
      ? "Forfait SaaS Edge Clics illimités inclus"
      : planUpper === "BUSINESS"
        ? "Forfait SaaS Edge 500,000 clics/mois inclus + Domaines & Analytics"
        : "Forfait SaaS Edge 150,000 clics/mois inclus + Domaines & API";

  const overageBatchInfo =
    planUpper === "BUSINESS"
      ? `${data.batchesOverage || 1} lot(s) x 125,000 clics (${symbol}8.00 HT / lot)`
      : `${data.batchesOverage || 1} lot(s) x 50,000 clics (${symbol}3.00 HT / lot)`;

  const streamLines: string[] = [];

  // Helper to draw text
  const addText = (text: string, x: number, y: number, font = "F1", size = 10, r = 0.04, g = 0.04, b = 0.05) => {
    streamLines.push(`BT`);
    streamLines.push(`/${font} ${size} Tf`);
    streamLines.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    streamLines.push(`1 0 0 1 ${x} ${y} Tm`);
    streamLines.push(`(${escapePdfText(text)}) Tj`);
    streamLines.push(`ET`);
  };

  // Helper to draw rectangle
  const addRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fillR = 0.96,
    fillG = 0.97,
    fillB = 0.98,
    stroke = false,
    strokeR = 0.88,
    strokeG = 0.9,
    strokeB = 0.94
  ) => {
    streamLines.push(`${fillR.toFixed(3)} ${fillG.toFixed(3)} ${fillB.toFixed(3)} rg`);
    if (stroke) {
      streamLines.push(`${strokeR.toFixed(3)} ${strokeG.toFixed(3)} ${strokeB.toFixed(3)} RG 0.75 w`);
      streamLines.push(`${x} ${y} ${w} ${h} re B`);
    } else {
      streamLines.push(`${x} ${y} ${w} ${h} re f`);
    }
  };

  // Helper to draw line
  const addLine = (x1: number, y1: number, x2: number, y2: number, r = 0.88, g = 0.9, b = 0.94, w = 0.75) => {
    streamLines.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${w} w`);
    streamLines.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // 1. Sober Executive Header
  addText("LShorter", 44, 736, "F2", 18, 0.08, 0.08, 0.09);
  addText("Global Edge & Cloud Routing Platform", 44, 721, "F1", 8.5, 0.42, 0.44, 0.48);
  addText("https://lsho.cc  |  billing@lsho.cc", 44, 709, "F1", 8, 0.42, 0.44, 0.48);

  // Right Header: Clean Typography Reference
  addText("FACTURE / INVOICE", 430, 736, "F2", 13, 0.08, 0.08, 0.09);
  addText(`Ref : ${data.invoiceNumber}`, 430, 721, "F2", 9, 0.20, 0.22, 0.26);
  addText(`Date : ${data.date}`, 430, 709, "F1", 8.5, 0.42, 0.44, 0.48);

  // Subtle clean divider rule
  addLine(44, 695, 568, 695, 0.88, 0.89, 0.92, 0.75);

  // 2. Two-Column Identification (EMETTEUR vs DESTINATAIRE) - Pure typography, NO card boxes
  addText("EMETTEUR", 44, 672, "F2", 7.5, 0.48, 0.50, 0.55);
  addText(issuerName, 44, 658, "F2", 9.5, 0.08, 0.08, 0.09);
  addText(issuerAddress, 44, 646, "F1", 8.5, 0.32, 0.34, 0.38);
  if (issuerTaxId) {
    addText(`Tax ID / N TVA : ${issuerTaxId}`, 44, 634, "F1", 8, 0.42, 0.44, 0.48);
  } else {
    addText("Distribution SaaS Cloud & Edge", 44, 634, "F1", 8, 0.42, 0.44, 0.48);
  }
  addText("Services numeriques electroniques B2B", 44, 622, "F1", 8, 0.42, 0.44, 0.48);

  addText("FACTURE A", 326, 672, "F2", 7.5, 0.48, 0.50, 0.55);
  addText(company, 326, 658, "F2", 9.5, 0.08, 0.08, 0.09);
  addText(`Email : ${email}`, 326, 646, "F1", 8.5, 0.32, 0.34, 0.38);
  addText(address.substring(0, 48), 326, 634, "F1", 8, 0.42, 0.44, 0.48);
  addText(vat, 326, 622, "F1", 8, 0.42, 0.44, 0.48);

  // 3. Metadata Strip (Minimal thin borders, NO heavy background fill)
  addLine(44, 608, 568, 608, 0.88, 0.89, 0.92, 0.5);
  addText("PERIODE :", 44, 595, "F2", 7.5, 0.48, 0.50, 0.55);
  addText(`${data.periodStart} au ${data.periodEnd}`, 92, 595, "F1", 8, 0.15, 0.16, 0.20);

  addText("ECHEANCE :", 230, 595, "F2", 7.5, 0.48, 0.50, 0.55);
  addText("Comptant (Carte / Stripe)", 282, 595, "F1", 8, 0.15, 0.16, 0.20);

  addText("STATUT :", 415, 595, "F2", 7.5, 0.48, 0.50, 0.55);
  addText(status === "PAID" ? "ACQUITTEE (PAID)" : status, 458, 595, "F2", 8, 0.08, 0.52, 0.26);

  addText("DEVISE :", 525, 595, "F2", 7.5, 0.48, 0.50, 0.55);
  addText(currency, 560, 595, "F1", 8, 0.15, 0.16, 0.20);
  addLine(44, 584, 568, 584, 0.88, 0.89, 0.92, 0.5);

  // 4. Line Items Table Header (Thin rules, clean typography, NO card background)
  addLine(44, 556, 568, 556, 0.72, 0.74, 0.78, 0.75);
  addText("DESIGNATION DES PRESTATIONS", 44, 544, "F2", 7.5, 0.35, 0.37, 0.42);
  addText("QTE", 295, 544, "F2", 7.5, 0.35, 0.37, 0.42);
  addText("P.U. HT", 345, 544, "F2", 7.5, 0.35, 0.37, 0.42);
  addText("TAUX TVA", 420, 544, "F2", 7.5, 0.35, 0.37, 0.42);
  addText("TOTAL HT", 512, 544, "F2", 7.5, 0.35, 0.37, 0.42);
  addLine(44, 534, 568, 534, 0.88, 0.89, 0.92, 0.5);

  // 5. Line Item 1: Plan Subscription
  let currentY = 512;
  addText(`Abonnement SaaS LShorter ${data.planName || data.planId}`, 44, currentY, "F2", 9, 0.08, 0.08, 0.09);
  addText(quotaSummary, 44, currentY - 12, "F1", 7.5, 0.42, 0.44, 0.48);
  addText(`Periode : ${data.periodStart} - ${data.periodEnd}`, 44, currentY - 22, "F1", 7, 0.50, 0.52, 0.56);
  addText("1", 298, currentY, "F1", 8.5, 0.15, 0.16, 0.20);
  addText(`${symbol}${baseAmount.toFixed(2)}`, 345, currentY, "F1", 8.5, 0.15, 0.16, 0.20);
  addText(vatRate, 420, currentY, "F1", 8.5, 0.40, 0.42, 0.46);
  addText(`${symbol}${baseAmount.toFixed(2)}`, 512, currentY, "F2", 9, 0.08, 0.08, 0.09);

  addLine(44, currentY - 32, 568, currentY - 32, 0.88, 0.89, 0.92, 0.5);

  // 6. Line Item 2 (Optional): Metered Click Overage
  if (data.overageAmount && data.overageAmount > 0) {
    currentY -= 50;
    const unitOverage = (data.overageAmount / Math.max(1, data.batchesOverage || 1)).toFixed(2);
    addText(
      `Depassement de quota Edge (${(data.overageClicks || 0).toLocaleString("en-US")} clics supp.)`,
      44,
      currentY,
      "F2",
      9,
      0.08,
      0.08,
      0.09
    );
    addText(overageBatchInfo, 44, currentY - 12, "F1", 7.5, 0.42, 0.44, 0.48);
    addText(String(data.batchesOverage || 1), 298, currentY, "F1", 8.5, 0.15, 0.16, 0.20);
    addText(`${symbol}${unitOverage}`, 345, currentY, "F1", 8.5, 0.15, 0.16, 0.20);
    addText(vatRate, 420, currentY, "F1", 8.5, 0.40, 0.42, 0.46);
    addText(`${symbol}${data.overageAmount.toFixed(2)}`, 512, currentY, "F2", 9, 0.08, 0.08, 0.09);
    addLine(44, currentY - 26, 568, currentY - 26, 0.88, 0.89, 0.92, 0.5);
  }

  // 7. Accounting Totals (Right) & Payment Terms (Left) - Clean text without boxes
  const summaryTopY = currentY - 44;

  // Left side: Payment terms & Tax notes
  addText("CONDITIONS DE REGLEMENT & FISCALITE", 44, summaryTopY, "F2", 7.5, 0.45, 0.47, 0.52);
  addText("Mode de paiement : Prelevement automatique CB / Stripe", 44, summaryTopY - 14, "F1", 7.5, 0.38, 0.40, 0.45);
  addText("Escompte : Aucun escompte pour paiement anticipe.", 44, summaryTopY - 26, "F1", 7.5, 0.38, 0.40, 0.45);
  addText("Regime TVA : Prestation de services numeriques SaaS.", 44, summaryTopY - 38, "F1", 7.5, 0.38, 0.40, 0.45);
  addText("Autoliquidation / Exoneration Art. 259B du CGI.", 44, summaryTopY - 50, "F1", 7.5, 0.38, 0.40, 0.45);
  addText("FACTURE ACQUITTEE - SOLDE RESTANT DU : 0.00", 44, summaryTopY - 64, "F2", 8, 0.08, 0.52, 0.26);

  // Right side: Totals
  addText("Total Hors Taxes (Net HT)", 350, summaryTopY, "F1", 8.5, 0.38, 0.40, 0.45);
  addText(`${symbol}${subtotalHt}`, 512, summaryTopY, "F1", 8.5, 0.08, 0.08, 0.09);

  addText("Total TVA (Taux 0,00%)", 350, summaryTopY - 15, "F1", 8.5, 0.38, 0.40, 0.45);
  addText(`${symbol}${taxAmount}`, 512, summaryTopY - 15, "F1", 8.5, 0.08, 0.08, 0.09);

  addLine(350, summaryTopY - 24, 568, summaryTopY - 24, 0.85, 0.86, 0.90, 0.5);

  addText("TOTAL TTC", 350, summaryTopY - 38, "F2", 9.5, 0.08, 0.08, 0.09);
  addText(`${symbol}${totalTtc} ${currency}`, 490, summaryTopY - 38, "F2", 9.5, 0.08, 0.08, 0.09);

  addText("Montant deja regle (Paid)", 350, summaryTopY - 53, "F1", 8, 0.08, 0.52, 0.26);
  addText(`-${symbol}${totalTtc}`, 512, summaryTopY - 53, "F1", 8, 0.08, 0.52, 0.26);

  addLine(350, summaryTopY - 61, 568, summaryTopY - 61, 0.85, 0.86, 0.90, 0.5);

  addText("Net a payer", 350, summaryTopY - 74, "F2", 8.5, 0.08, 0.08, 0.09);
  addText(`${symbol}0.00 ${currency}`, 505, summaryTopY - 74, "F2", 8.5, 0.08, 0.08, 0.09);

  // 8. Minimalist Bottom Footer
  const footerY = 55;
  addLine(44, footerY + 20, 568, footerY + 20, 0.88, 0.89, 0.92, 0.5);
  addText(
    "Document original certifie conforme genere par la plateforme LShorter. Prestation de services electroniques B2B.",
    44,
    footerY + 8,
    "F1",
    7,
    0.48,
    0.50,
    0.55
  );
  const footerLegalText = issuerTaxId
    ? `${issuerName} — ${issuerTaxId} — https://lsho.cc — Support : billing@lsho.cc`
    : `${issuerName} — Global Cloud Services — https://lsho.cc — Support : billing@lsho.cc`;

  addText(
    footerLegalText,
    44,
    footerY - 3,
    "F1",
    7,
    0.48,
    0.50,
    0.55
  );

  // Build PDF Binary Objects
  const contentStream = streamLines.join("\n");
  const streamLength = Buffer.byteLength(contentStream, "utf-8");

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`,
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj`,
    `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj`,
  ];

  let pdfOutput = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const xrefOffsets: number[] = [0];

  for (const obj of objects) {
    xrefOffsets.push(Buffer.byteLength(pdfOutput, "utf-8"));
    pdfOutput += obj + "\n";
  }

  const startXref = Buffer.byteLength(pdfOutput, "utf-8");
  pdfOutput += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offset = xrefOffsets[i].toString().padStart(10, "0");
    pdfOutput += `${offset} 00000 n \n`;
  }

  pdfOutput += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdfOutput, "utf-8");
}

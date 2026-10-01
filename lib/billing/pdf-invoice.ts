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
  const address = data.billingAddress || "10 Rue de la Republique, 75001 Paris, France";
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

  // 1. Brand Royal Blue Top Accent Bar (#465FFF -> R: 0.275, G: 0.373, B: 1.000)
  addRect(0, 784, 612, 8, 0.275, 0.373, 1.0, false);

  // 2. Legal Commercial Header
  addRect(44, 722, 30, 30, 0.275, 0.373, 1.0, false);
  addText("L", 54, 731, "F2", 16, 1.0, 1.0, 1.0);

  addText("LShorter Cloud Infrastructure SAS", 82, 740, "F2", 14, 0.04, 0.04, 0.05);
  addText("RCS Paris B 912 485 301  |  SIRET : 912 485 301 00018  |  TVA : FR 48 912485301", 82, 726, "F1", 7.5, 0.38, 0.4, 0.45);

  // Right Header: Official Invoice Badge & Sequential Number
  addText("FACTURE / INVOICE", 425, 740, "F2", 14, 0.04, 0.04, 0.05);
  addText(`Ref : ${data.invoiceNumber}`, 425, 725, "F2", 9.5, 0.275, 0.373, 1.0);

  addLine(44, 708, 568, 708, 0.88, 0.9, 0.94, 0.75);

  // 3. Statutory Metadata Strip (4 Legal Columns)
  addRect(44, 656, 524, 40, 0.976, 0.98, 0.992, true);

  addText("DATE D'EMISSION", 54, 681, "F2", 7, 0.44, 0.44, 0.48);
  addText(data.date, 54, 666, "F2", 9, 0.04, 0.04, 0.05);

  addText("PERIODE FACTUREE", 175, 681, "F2", 7, 0.44, 0.44, 0.48);
  addText(`${data.periodStart} au ${data.periodEnd}`, 175, 666, "F1", 9, 0.04, 0.04, 0.05);

  addText("ECHEANCE & REGLEMENT", 325, 681, "F2", 7, 0.44, 0.44, 0.48);
  addText("Comptant (Carte / Stripe)", 325, 666, "F1", 8.5, 0.04, 0.04, 0.05);

  addText("STATUT COMPTABLE", 468, 681, "F2", 7, 0.44, 0.44, 0.48);
  addText(status === "PAID" ? "ACQUITTEE (PAID)" : status, 468, 666, "F2", 8.5, 0.06, 0.62, 0.38);

  // 4. Two-Column Legal Party Identification (EMETTEUR vs DESTINATAIRE)
  addRect(44, 552, 252, 92, 0.985, 0.988, 0.995, true);
  addText("EMETTEUR (VENDEUR / PRESTATAIRE)", 54, 630, "F2", 7.5, 0.275, 0.373, 1.0);
  addText("LShorter Cloud Infrastructure SAS", 54, 615, "F2", 9.5, 0.04, 0.04, 0.05);
  addText("60 Rue Francois 1er, 75008 Paris, France", 54, 602, "F1", 8.5, 0.3, 0.32, 0.36);
  addText("SIRET : 912 485 301 00018  |  Code NAF : 6201Z", 54, 590, "F1", 8, 0.3, 0.32, 0.36);
  addText("N TVA Intracom. : FR 48 912485301", 54, 578, "F1", 8, 0.3, 0.32, 0.36);
  addText("Capital social : 10 000,00 EUR  |  billing@lsho.cc", 54, 565, "F1", 7.5, 0.44, 0.44, 0.48);

  addRect(316, 552, 252, 92, 0.985, 0.988, 0.995, true);
  addText("FACTURE A (CLIENT / ACHETEUR)", 326, 630, "F2", 7.5, 0.275, 0.373, 1.0);
  addText(company, 326, 615, "F2", 9.5, 0.04, 0.04, 0.05);
  addText(address.substring(0, 48), 326, 602, "F1", 8.5, 0.3, 0.32, 0.36);
  addText(`Email : ${email}`, 326, 590, "F1", 8, 0.3, 0.32, 0.36);
  addText(vat, 326, 578, "F1", 8, 0.3, 0.32, 0.36);
  addText(`Devise de facturation : ${currency}`, 326, 565, "F1", 7.5, 0.44, 0.44, 0.48);

  // 5. Normalized Accounting Line Items Table Header
  addRect(44, 514, 524, 24, 0.94, 0.955, 0.985, true);
  addText("DESIGNATION DES PRESTATIONS", 52, 523, "F2", 7.5, 0.15, 0.18, 0.25);
  addText("QTE", 295, 523, "F2", 7.5, 0.15, 0.18, 0.25);
  addText("P.U. HT", 335, 523, "F2", 7.5, 0.15, 0.18, 0.25);
  addText("TAUX TVA", 405, 523, "F2", 7.5, 0.15, 0.18, 0.25);
  addText("MONTANT TVA", 455, 523, "F2", 7.5, 0.15, 0.18, 0.25);
  addText("TOTAL HT", 518, 523, "F2", 7.5, 0.15, 0.18, 0.25);

  // 6. Line Item 1: Plan Subscription
  let currentY = 490;
  addText(`Abonnement SaaS LShorter ${data.planName || data.planId}`, 52, currentY, "F2", 9.5, 0.04, 0.04, 0.05);
  addText(quotaSummary, 52, currentY - 12, "F1", 7.5, 0.42, 0.44, 0.48);
  addText(`Periode : ${data.periodStart} - ${data.periodEnd}`, 52, currentY - 22, "F1", 7, 0.5, 0.52, 0.56);
  addText("1", 298, currentY, "F1", 9, 0.04, 0.04, 0.05);
  addText(`${symbol}${baseAmount.toFixed(2)}`, 335, currentY, "F1", 9, 0.04, 0.04, 0.05);
  addText(vatRate, 410, currentY, "F1", 8.5, 0.3, 0.32, 0.36);
  addText(`${symbol}0.00`, 462, currentY, "F1", 8.5, 0.3, 0.32, 0.36);
  addText(`${symbol}${baseAmount.toFixed(2)}`, 515, currentY, "F2", 9.5, 0.04, 0.04, 0.05);

  addLine(44, currentY - 32, 568, currentY - 32, 0.88, 0.9, 0.94, 0.75);

  // 7. Line Item 2 (Optional): Metered Click Overage
  if (data.overageAmount && data.overageAmount > 0) {
    currentY -= 52;
    const unitOverage = (data.overageAmount / Math.max(1, data.batchesOverage || 1)).toFixed(2);
    addText(
      `Depassement de quota Edge (${(data.overageClicks || 0).toLocaleString("en-US")} clics supp.)`,
      52,
      currentY,
      "F2",
      9,
      0.04,
      0.04,
      0.05
    );
    addText(overageBatchInfo, 52, currentY - 12, "F1", 7.5, 0.42, 0.44, 0.48);
    addText(String(data.batchesOverage || 1), 298, currentY, "F1", 9, 0.04, 0.04, 0.05);
    addText(`${symbol}${unitOverage}`, 335, currentY, "F1", 9, 0.04, 0.04, 0.05);
    addText(vatRate, 410, currentY, "F1", 8.5, 0.3, 0.32, 0.36);
    addText(`${symbol}0.00`, 462, currentY, "F1", 8.5, 0.3, 0.32, 0.36);
    addText(`${symbol}${data.overageAmount.toFixed(2)}`, 515, currentY, "F2", 9.5, 0.04, 0.04, 0.05);
    addLine(44, currentY - 26, 568, currentY - 26, 0.88, 0.9, 0.94, 0.75);
  }

  // 8. Accounting & VAT Breakdown Box (Right) + Payment Certification Box (Left)
  const boxTopY = currentY - 46;

  // Left Box: Payment & Tax Regime Notice
  addRect(44, boxTopY - 96, 260, 96, 0.985, 0.988, 0.995, true);
  addText("CONDITIONS DE REGLEMENT & FISCALITE", 54, boxTopY - 16, "F2", 7.5, 0.15, 0.18, 0.25);
  addText("Mode de paiement : Prelevement automatique CB / Stripe", 54, boxTopY - 30, "F1", 7.5, 0.3, 0.32, 0.36);
  addText("Escompte : Aucun escompte pour paiement anticipe.", 54, boxTopY - 42, "F1", 7.5, 0.3, 0.32, 0.36);
  addText("Regime TVA : Prestation de services numeriques SaaS.", 54, boxTopY - 54, "F1", 7.5, 0.3, 0.32, 0.36);
  addText("Autoliquidation / Exoneration Art. 259B & 283-2 du CGI.", 54, boxTopY - 66, "F1", 7.5, 0.3, 0.32, 0.36);
  addText("FACTURE ACQUITTEE — SOLDE RESTANT DU : 0.00", 54, boxTopY - 82, "F2", 8, 0.06, 0.62, 0.38);

  // Right Box: Accounting Totals HT / TVA / TTC
  addRect(324, boxTopY - 96, 244, 96, 0.976, 0.98, 0.992, true);
  addText("Total Hors Taxes (Net HT)", 336, boxTopY - 18, "F1", 8.5, 0.3, 0.32, 0.36);
  addText(`${symbol}${subtotalHt}`, 498, boxTopY - 18, "F2", 8.5, 0.04, 0.04, 0.05);

  addText("Total TVA (Taux 0,00%)", 336, boxTopY - 34, "F1", 8.5, 0.3, 0.32, 0.36);
  addText(`${symbol}${taxAmount}`, 498, boxTopY - 34, "F1", 8.5, 0.04, 0.04, 0.05);

  addLine(336, boxTopY - 44, 556, boxTopY - 44, 0.85, 0.87, 0.91, 0.75);

  addText("TOTAL TTC (Total Due)", 336, boxTopY - 58, "F2", 9.5, 0.04, 0.04, 0.05);
  addText(`${symbol}${totalTtc} ${currency}`, 482, boxTopY - 58, "F2", 10, 0.275, 0.373, 1.0);

  addText("Montant deja regle (Paid)", 336, boxTopY - 74, "F1", 8, 0.06, 0.62, 0.38);
  addText(`-${symbol}${totalTtc}`, 495, boxTopY - 74, "F2", 8, 0.06, 0.62, 0.38);

  addText("Net a payer (Balance Due)", 336, boxTopY - 88, "F2", 8.5, 0.04, 0.04, 0.05);
  addText(`${symbol}0.00 ${currency}`, 490, boxTopY - 88, "F2", 8.5, 0.04, 0.04, 0.05);

  // 9. Mandatory Legal Mentions Footer (Article L441-9 & L441-10 Code de Commerce)
  const footerY = 78;
  addLine(44, footerY + 34, 568, footerY + 34, 0.88, 0.9, 0.94, 0.75);
  addText(
    "MENTIONS LEGALES OBLIGATOIRES (Article L.441-9 du Code de commerce & Directive UE 2006/112/CE) :",
    44,
    footerY + 20,
    "F2",
    7.5,
    0.15,
    0.18,
    0.25
  );
  addText(
    "En cas de retard de paiement, application d'une penalite egale a 3 fois le taux d'interet legal (ou taux BCE + 10 pts) ainsi qu'une indemnite",
    44,
    footerY + 8,
    "F1",
    7,
    0.42,
    0.44,
    0.48
  );
  addText(
    "forfaitaire pour frais de recouvrement de 40,00 EUR (Art. L.441-10 et D.441-5 du Code de commerce). Document original certifie conforme.",
    44,
    footerY - 3,
    "F1",
    7,
    0.42,
    0.44,
    0.48
  );
  addText(
    "LShorter Cloud Infrastructure SAS — RCS Paris B 912 485 301 — SIRET 912 485 301 00018 — https://lsho.cc — Support : billing@lsho.cc",
    44,
    footerY - 15,
    "F2",
    7,
    0.275,
    0.373,
    1.0
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

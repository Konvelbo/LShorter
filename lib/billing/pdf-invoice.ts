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
 * Generates a valid standard PDF 1.4 document in pure TypeScript.
 */
export function generateInvoicePdf(data: InvoicePdfData): Buffer {
  const currency = data.currency || "EUR";
  const status = (data.status || "PAID").toUpperCase();
  const company = data.companyName || data.customerName || "Compte Client";
  const address = data.billingAddress || "Adresse de facturation standard";
  const vat = data.taxId ? `N° TVA / Tax ID : ${data.taxId}` : "N° TVA : Non applicable / B2C";
  const email = data.customerEmail || "contact@client.com";

  const baseAmount = data.overageAmount ? Math.max(0, data.amountPaid - data.overageAmount) : data.amountPaid;
  const totalTTC = data.amountPaid.toFixed(2);
  const totalHT = (data.amountPaid / 1.2).toFixed(2);
  const totalTVA = (data.amountPaid - Number(totalHT)).toFixed(2);

  const streamLines: string[] = [];

  // Helper to draw text
  const addText = (text: string, x: number, y: number, font = "F1", size = 10, r = 0.1, g = 0.1, b = 0.1) => {
    streamLines.push(`BT`);
    streamLines.push(`/${font} ${size} Tf`);
    streamLines.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    streamLines.push(`1 0 0 1 ${x} ${y} Tm`);
    streamLines.push(`(${escapePdfText(text)}) Tj`);
    streamLines.push(`ET`);
  };

  // Helper to draw rectangle
  const addRect = (x: number, y: number, w: number, h: number, fillR = 0.95, fillG = 0.95, fillB = 0.95, stroke = false) => {
    streamLines.push(`${fillR.toFixed(3)} ${fillG.toFixed(3)} ${fillB.toFixed(3)} rg`);
    if (stroke) {
      streamLines.push(`0.8 0.8 0.8 RG 1 w`);
      streamLines.push(`${x} ${y} ${w} ${h} re B`);
    } else {
      streamLines.push(`${x} ${y} ${w} ${h} re f`);
    }
  };

  // Helper to draw line
  const addLine = (x1: number, y1: number, x2: number, y2: number, r = 0.8, g = 0.8, b = 0.8, w = 1) => {
    streamLines.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${w} w`);
    streamLines.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // 1. Header Banner & Branding
  addRect(0, 750, 612, 92, 0.05, 0.05, 0.07, false); // Dark top header
  addText("LSHORTER", 40, 800, "F2", 20, 1.0, 0.4, 0.0); // Brand Orange
  addText("EDGE NETWORK & SMART ROUTING", 160, 802, "F2", 10, 0.9, 0.9, 0.9);
  addText("Facture Officielle d'Abonnement SaaS", 40, 775, "F1", 9, 0.7, 0.7, 0.7);
  addText(`Facture N° : ${data.invoiceNumber}`, 400, 800, "F2", 12, 1, 1, 1);
  addText(`Date : ${data.date}`, 400, 780, "F1", 9, 0.8, 0.8, 0.8);

  // 2. Paid Status Badge
  addRect(400, 715, 160, 26, 0.88, 0.96, 0.90, true);
  addText(`STATUT : ${status === 'PAID' ? 'ACQUITTÉE / PAID' : status}`, 415, 724, "F2", 9, 0.08, 0.55, 0.22);

  // 3. Sender Info & Buyer Info (2 columns)
  // Left: LShorter
  addText("ÉMETTEUR :", 40, 715, "F2", 9, 0.5, 0.5, 0.5);
  addText("LShorter Technologies Inc.", 40, 698, "F2", 10, 0.1, 0.1, 0.1);
  addText("Infrastructure Edge & CDN Global", 40, 684, "F1", 9, 0.3, 0.3, 0.3);
  addText("N° TVA Intracommunautaire : FR 82 912 345 678", 40, 670, "F1", 8.5, 0.3, 0.3, 0.3);
  addText("Support : billing@lshorter.io", 40, 656, "F1", 8.5, 0.3, 0.3, 0.3);

  // Right: Client
  addText("DESTINATAIRE / CLIENT :", 320, 698, "F2", 9, 0.5, 0.5, 0.5);
  addText(company, 320, 682, "F2", 10, 0.1, 0.1, 0.1);
  addText(email, 320, 668, "F1", 9, 0.3, 0.3, 0.3);
  addText(address, 320, 654, "F1", 8.5, 0.3, 0.3, 0.3);
  addText(vat, 320, 640, "F1", 8.5, 0.3, 0.3, 0.3);

  addLine(40, 620, 572, 620, 0.85, 0.85, 0.85, 1);

  // 4. Items Table Header
  addRect(40, 585, 532, 24, 0.94, 0.94, 0.96, false);
  addText("DESCRIPTION", 50, 593, "F2", 8.5, 0.3, 0.3, 0.3);
  addText("PÉRIODE", 260, 593, "F2", 8.5, 0.3, 0.3, 0.3);
  addText("QTÉ", 430, 593, "F2", 8.5, 0.3, 0.3, 0.3);
  addText(`MONTANT (${currency})`, 480, 593, "F2", 8.5, 0.3, 0.3, 0.3);

  // 5. Line 1: Main Plan
  let currentY = 555;
  addText(`Abonnement LShorter - Forfait ${data.planName || data.planId}`, 50, currentY, "F2", 9.5, 0.1, 0.1, 0.1);
  addText("Redirections Edge haute performance, DNS Anycast et Smart Routing", 50, currentY - 13, "F1", 8, 0.45, 0.45, 0.45);
  addText(`${data.periodStart} au ${data.periodEnd}`, 260, currentY, "F1", 8.5, 0.3, 0.3, 0.3);
  addText("1", 435, currentY, "F1", 9, 0.2, 0.2, 0.2);
  addText(`${baseAmount.toFixed(2)} €`, 485, currentY, "F2", 9.5, 0.1, 0.1, 0.1);

  addLine(40, currentY - 24, 572, currentY - 24, 0.9, 0.9, 0.9, 0.5);

  // Line 2 (Optional): Overage
  if (data.overageAmount && data.overageAmount > 0) {
    currentY -= 40;
    addText(`Dépassement de Quota Clics (${data.overageClicks?.toLocaleString('fr-FR') || ''} clics sup.)`, 50, currentY, "F2", 9, 0.1, 0.1, 0.1);
    addText(`Garantie Zéro Coupure - ${data.batchesOverage || 1} tranche(s) de 10 000 clics`, 50, currentY - 12, "F1", 8, 0.45, 0.45, 0.45);
    addText(`${data.periodStart} au ${data.periodEnd}`, 260, currentY, "F1", 8.5, 0.3, 0.3, 0.3);
    addText(String(data.batchesOverage || 1), 435, currentY, "F1", 9, 0.2, 0.2, 0.2);
    addText(`${data.overageAmount.toFixed(2)} €`, 485, currentY, "F2", 9.5, 0.1, 0.1, 0.1);
    addLine(40, currentY - 22, 572, currentY - 22, 0.9, 0.9, 0.9, 0.5);
  }

  // 6. Summary Totals Box
  const totalsY = currentY - 70;
  addRect(360, totalsY - 60, 212, 75, 0.97, 0.97, 0.98, true);

  addText("Total HT :", 375, totalsY, "F1", 9, 0.4, 0.4, 0.4);
  addText(`${totalHT} €`, 500, totalsY, "F1", 9, 0.2, 0.2, 0.2);

  addText("TVA (20 %) :", 375, totalsY - 18, "F1", 9, 0.4, 0.4, 0.4);
  addText(`${totalTVA} €`, 500, totalsY - 18, "F1", 9, 0.2, 0.2, 0.2);

  addLine(370, totalsY - 26, 560, totalsY - 26, 0.85, 0.85, 0.85, 0.8);

  addText("TOTAL RÉGLÉ (TTC) :", 375, totalsY - 45, "F2", 9.5, 0.05, 0.05, 0.05);
  addText(`${totalTTC} ${currency}`, 485, totalsY - 45, "F2", 11, 1.0, 0.4, 0.0);

  // 7. Footer & Legal Terms
  const footerY = 100;
  addLine(40, footerY + 25, 572, footerY + 25, 0.85, 0.85, 0.85, 0.8);
  addText("Paiement acquitté par carte bancaire / prélèvement automatique via protocole sécurisé SSL 256-bit.", 40, footerY + 10, "F1", 7.5, 0.4, 0.4, 0.4);
  addText("Facture certifiée conforme émise par LShorter Edge Platform. Aucun escompte accordé pour règlement anticipé.", 40, footerY - 2, "F1", 7.5, 0.4, 0.4, 0.4);
  addText("En cas de retard, indemnité forfaitaire pour frais de recouvrement de 40 € (art. D. 441-5 du Code de commerce).", 40, footerY - 14, "F1", 7.5, 0.4, 0.4, 0.4);

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

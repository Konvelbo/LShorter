// ============================================================================
// Comprehensive Overage & Email Rendering Verification Suite
// ============================================================================

import { evaluateClickQuotaAndOverage, calculateOverage, PRICING_PLANS } from "../src/config/pricing";
import { evaluateSubscriptionOverage } from "../lib/billing/overage-service";
import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runVerification() {
  console.log("\n=======================================================");
  console.log("  1. TEST DE LA LOGIQUE DE CALCUL DU QUOTA & OVERAGE");
  console.log("=======================================================");

  // --- A. Plan STARTER (FREE) ---
  console.log("\n[A] Plan STARTER (FREE) - Hard limit 10,000 clics :");
  const free5k = evaluateClickQuotaAndOverage("FREE", 5000);
  assert(!free5k.isBlocked, "5,000 clics: Non bloqué");
  assert(free5k.overage.estimatedCost === 0, "5,000 clics: Coût overage = $0.00");

  const free10k = evaluateClickQuotaAndOverage("FREE", 10000);
  assert(free10k.isBlocked, "10,000 clics: Bloqué (Hard limit atteint)");
  assert(free10k.overage.estimatedCost === 0, "10,000 clics: Coût overage = $0.00 (overage non permis)");

  const free15k = evaluateClickQuotaAndOverage("FREE", 15000);
  assert(free15k.isBlocked, "15,000 clics: Bloqué");
  assert(free15k.overage.estimatedCost === 0, "15,000 clics: Coût overage = $0.00");

  // --- B. Plan PRO (Math.floor: seulement les lots COMPLETEMENT atteints sont facturés) ---
  console.log("\n[B] Plan PRO - 150,000 clics inclus + 3$/50k clics :");
  const pro140k = evaluateClickQuotaAndOverage("PRO", 140000);
  assert(!pro140k.isOverQuota, "140,000 clics: Pas de dépassement");
  assert(!pro140k.isBlocked, "140,000 clics: Non bloqué (Zéro Coupure)");
  assert(pro140k.overage.estimatedCost === 0, "140,000 clics: Coût overage = $0.00");

  // 175k = +25k excédentaires → lot de 50k pas encore complet → $0
  const pro175k = evaluateClickQuotaAndOverage("PRO", 175000);
  assert(pro175k.isOverQuota, "175,000 clics: Dépassement détecté (+25,000 clics)");
  assert(!pro175k.isBlocked, "175,000 clics: Non bloqué (Zéro Coupure)");
  assert(pro175k.overage.batches === 0, "175,000 clics: 0 lot complet atteint (25k < 50k)");
  assert(pro175k.overage.estimatedCost === 0.0, "175,000 clics: Coût overage = $0.00 (lot incomplet, non facturé)");

  // 200k = +50k exactement → 1er lot complet atteint → $3
  const pro200k = evaluateClickQuotaAndOverage("PRO", 200000);
  assert(pro200k.overage.batches === 1, "200,000 clics: 1 lot de 50k clics complet atteint");
  assert(pro200k.overage.estimatedCost === 3.0, "200,000 clics: Coût overage = $3.00 (1 lot x $3)");

  // 200,001 → toujours 1 seul lot (2e lot pas encore complet)
  const pro200k1 = evaluateClickQuotaAndOverage("PRO", 200001);
  assert(pro200k1.overage.batches === 1, "200,001 clics: Toujours 1 lot (2e lot incomplet)");
  assert(pro200k1.overage.estimatedCost === 3.0, "200,001 clics: Coût overage = $3.00");

  // 250k = +100k → 2 lots complets → $6
  const pro250k = evaluateClickQuotaAndOverage("PRO", 250000);
  assert(pro250k.overage.batches === 2, "250,000 clics: 2 lots de 50k clics complets atteints");
  assert(pro250k.overage.estimatedCost === 6.0, "250,000 clics: Coût overage = $6.00 (2 lots x $3)");

  const pro300k = evaluateClickQuotaAndOverage("PRO", 300000);
  assert(pro300k.overage.batches === 3, "300,000 clics: 3 lots de 50k complets (+150,000 clics)");
  assert(pro300k.overage.estimatedCost === 9.0, "300,000 clics: Coût overage = $9.00 (3 lots x $3)");

  // --- C. Plan BUSINESS ---
  console.log("\n[C] Plan BUSINESS - 500,000 clics inclus + 8$/125k clics :");
  const biz480k = evaluateClickQuotaAndOverage("BUSINESS", 480000);
  assert(!biz480k.isOverQuota, "480,000 clics: Pas de dépassement");
  assert(biz480k.overage.estimatedCost === 0, "480,000 clics: Coût overage = $0.00");

  // 600k = +100k → lot de 125k incomplet → $0
  const biz600k = evaluateClickQuotaAndOverage("BUSINESS", 600000);
  assert(biz600k.isOverQuota, "600,000 clics: Dépassement détecté (+100,000 clics)");
  assert(!biz600k.isBlocked, "600,000 clics: Non bloqué");
  assert(biz600k.overage.batches === 0, "600,000 clics: 0 lot complet (100k < 125k)");
  assert(biz600k.overage.estimatedCost === 0.0, "600,000 clics: Coût overage = $0.00 (lot incomplet)");

  // 625k = +125k exactement → 1er lot complet → $8
  const biz625k = evaluateClickQuotaAndOverage("BUSINESS", 625000);
  assert(biz625k.overage.batches === 1, "625,000 clics: 1 lot de 125k clics complet atteint");
  assert(biz625k.overage.estimatedCost === 8.0, "625,000 clics: Coût overage = $8.00 (1 lot x $8)");

  const biz625k1 = evaluateClickQuotaAndOverage("BUSINESS", 625001);
  assert(biz625k1.overage.batches === 1, "625,001 clics: Toujours 1 lot (2e lot incomplet)");
  assert(biz625k1.overage.estimatedCost === 8.0, "625,001 clics: Coût overage = $8.00");

  const biz750k = evaluateClickQuotaAndOverage("BUSINESS", 750000);
  assert(biz750k.overage.batches === 2, "750,000 clics: 2 lots de 125k complets (+250,000 clics)");
  assert(biz750k.overage.estimatedCost === 16.0, "750,000 clics: Coût overage = $16.00 (2 lots x $8)");

  // --- D. Plan ENTERPRISE ---
  console.log("\n[D] Plan ENTERPRISE - Clics illimités & overage gratuit ($0 extra) :");
  const ent3M = evaluateClickQuotaAndOverage("ENTERPRISE", 3000000);
  assert(!ent3M.isOverQuota, "3,000,000 clics: Jamais en dépassement (limite = -1)");
  assert(!ent3M.isBlocked, "3,000,000 clics: Jamais bloqué");
  assert(ent3M.overage.batches === 0, "3,000,000 clics: 0 lot");
  assert(ent3M.overage.estimatedCost === 0, "3,000,000 clics: Coût overage = $0.00 (Gratuit & Illimité)");
  assert(ent3M.overage.unlimited === true, "3,000,000 clics: Unlimited overage flag = true");

  console.log("\n=======================================================");
  console.log("  2. TEST DU SERVICE D'OVERAGE (OverageService)");
  console.log("=======================================================");

  const evalPro = evaluateSubscriptionOverage("PRO", 185000);
  assert(evalPro.overageClicks === 35000, "Pro 185k: 35,000 clics excédentaires");
  assert(evalPro.batches === 0, "Pro 185k: 0 lot complet (35k < 50k) → lot non facturé");
  assert(evalPro.cost === 0.0, "Pro 185k: $0.00 (lot incomplet, non facturé)");

  // Pro 200k → 50k excédentaires → 1 lot complet → $3
  const evalPro200k = evaluateSubscriptionOverage("PRO", 200000);
  assert(evalPro200k.overageClicks === 50000, "Pro 200k: exactement 50,000 clics excédentaires");
  assert(evalPro200k.batches === 1, "Pro 200k: 1 lot de 50k complet → facturé");
  assert(evalPro200k.cost === 3.0, "Pro 200k: $3.00 (1 lot x $3)");

  const evalBiz = evaluateSubscriptionOverage("BUSINESS", 750000);
  assert(evalBiz.overageClicks === 250000, "Biz 750k: 250,000 clics excédentaires");
  assert(evalBiz.batches === 2, "Biz 750k: 2 lots de 125k complets");
  assert(evalBiz.cost === 16.0, "Biz 750k: $16.00 calculé");

  const evalEnt = evaluateSubscriptionOverage("ENTERPRISE", 10000000);
  assert(evalEnt.cost === 0, "Enterprise 10M clics: $0.00 overage");
  assert(evalEnt.unlimitedOverage, "Enterprise: illimité");

  console.log("\n=======================================================");
  console.log("  3. GENERATION DES APERÇUS HTML DES MAILS");
  console.log("=======================================================");

  // Helper pour simuler le rendu HTML de sendSubscriptionExpiringAlertEmail
  function generatePreRenewalEmailHtml(params: {
    name: string;
    plan: string;
    daysRemaining: number;
    isAutoRenew: boolean;
    overageInfo?: {
      overageClicks: number;
      batches: number;
      cost: number;
      batchSize: number;
      costPerBatch: number;
      monthlyIncludedClicks?: number;
      basePrice?: number;
    };
  }) {
    const dayLabel = params.daysRemaining === 1 ? "1 jour" : `${params.daysRemaining} jours`;
    const safePlan = params.plan;
    const hasOverage = Boolean(params.overageInfo && params.overageInfo.cost > 0);
    const overageInfo = params.overageInfo;

    const overageAlertBoxHtml = hasOverage && overageInfo
      ? `
        <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 18px 0;">
          <div style="font-size: 13.5px; font-weight: 700; color: #92400E; margin-bottom: 8px;">
            ⚡ Frais d'overage de trafic à prévoir lors du renouvellement
          </div>
          <p style="margin: 0 0 12px 0; color: #78350F; font-size: 13px; line-height: 1.5;">
            Votre trafic a dépassé votre quota mensuel inclus${overageInfo.monthlyIncludedClicks ? ` (${overageInfo.monthlyIncludedClicks.toLocaleString()} clics)` : ""}. Grâce à notre <strong>Garantie Zéro Coupure</strong>, vos redirections sont restées 100% actives sans aucune interruption de service.
          </p>
          <table width="100%" style="font-size: 12.5px; color: #78350F; border-collapse: collapse; background: #FEF3C7; border-radius: 6px;">
            <tr>
              <td style="padding: 7px 10px;">Clics supplémentaires enregistrés :</td>
              <td style="padding: 7px 10px; text-align: right; font-weight: 700;">+${overageInfo.overageClicks.toLocaleString()} clics</td>
            </tr>
            <tr>
              <td style="padding: 7px 10px;">Lots d'overage appliqués (${overageInfo.costPerBatch}$ / ${(overageInfo.batchSize / 1000).toLocaleString()}k clics) :</td>
              <td style="padding: 7px 10px; text-align: right; font-weight: 700;">${overageInfo.batches} lot(s)</td>
            </tr>
            <tr style="border-top: 1px solid #FDE68A;">
              <td style="padding: 8px 10px; font-weight: 700; color: #92400E;">Frais d'overage ajoutés au renouvellement :</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: #B45309; font-size: 13.5px;">+$${overageInfo.cost.toFixed(2)}</td>
            </tr>
            ${typeof overageInfo.basePrice === "number" && overageInfo.basePrice > 0 ? `
            <tr style="border-top: 1px solid #FDE68A;">
              <td style="padding: 8px 10px; font-weight: 700; color: #1E3A8A;">Total estimé prélevé (${safePlan} + Overage) :</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: #1D4ED8; font-size: 14px;">$${(overageInfo.basePrice + overageInfo.cost).toFixed(2)}</td>
            </tr>` : ""}
          </table>
        </div>`
      : "";

    return `<!DOCTYPE html>
<html lang="fr" style="color-scheme: light only;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerte Pré-Renouvellement</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center">
        <table width="560" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 32px 36px 20px 36px; border-bottom: 1px solid #F1F5F9;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <span style="font-weight: 800; font-size: 19px; color: #09090B; letter-spacing: -0.03em;">LShorter</span>
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #2563EB;"></span>
              </div>
              <h1 style="color: #09090B; font-size: 21px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px 0; line-height: 1.3;">
                Renouvellement prévu dans ${dayLabel} (Overage inclus)
              </h1>
              <p style="color: #64748B; font-size: 13px; margin: 0; line-height: 1.5;">Forfait ${safePlan} • Échéance J-${params.daysRemaining}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 28px 36px 32px 36px; color: #18181B; font-size: 14px; line-height: 1.65;">
              <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${params.name}</strong>,</p>
              <p style="margin: 0 0 16px 0; color: #334155;">
                Votre abonnement <strong>${safePlan}</strong> arrive à sa date de renouvellement automatique dans <strong>${dayLabel}</strong>.
              </p>
              <p style="margin: 0 0 20px 0; color: #334155;">
                Aucun geste n'est requis si votre moyen de paiement est à jour : le renouvellement s'effectuera automatiquement à l'échéance. En cas d'échec de paiement, vous disposerez d'un délai de 24h pour régulariser votre compte avant le passage en plan Freemium.
              </p>
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px;">
                <table width="100%" style="font-size: 13.5px; color: #09090B; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748B;">Forfait actuel :</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #2563EB;">${safePlan}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748B;">Délai avant échéance :</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #D97706;">${dayLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748B;">Mode :</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #16A34A;">Renouvellement automatique actif</td>
                  </tr>
                </table>
              </div>
              ${overageAlertBoxHtml}
              <div style="margin-top: 28px;">
                <a href="https://lsho.cc/dashboard/settings?tab=billing" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 13.5px; padding: 12px 24px; border-radius: 8px;">
                  Gérer ma facturation
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 36px; border-top: 1px solid #E2E8F0;">
              <p style="color: #64748B; font-size: 11.5px; margin: 0 0 4px 0; line-height: 1.5;">
                Vous recevez cet email de rappel (J-3, J-2, J-1) car vous avez un forfait payant actif sur LShorter.
              </p>
              <p style="color: #94A3B8; font-size: 11px; margin: 0;">
                <a href="https://lsho.cc" style="color: #2563EB; text-decoration: none;">https://lsho.cc</a> &bull; contact@lsho.cc
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // Helper pour simuler le rendu HTML de sendPlanPurchaseEmail (Post-renouvellement)
  function generatePostRenewalEmailHtml(params: {
    name: string;
    planName: string;
    startDate: string;
    endDate: string;
    cycle: string;
    invoiceNumber: string;
    overageDetails?: {
      overageClicks: number;
      batches: number;
      cost: number;
      baseAmount?: number;
      totalAmount?: number;
    };
  }) {
    const safePlanName = params.planName;
    const hasOverage = Boolean(params.overageDetails && params.overageDetails.cost > 0);
    const overageDetails = params.overageDetails;

    const baseVal = overageDetails?.baseAmount !== undefined ? `$${overageDetails.baseAmount.toFixed(2)}` : "$15.00";
    const totalVal = overageDetails?.totalAmount !== undefined ? `$${overageDetails.totalAmount.toFixed(2)}` : "$18.00";

    const amountSectionHtml = hasOverage && overageDetails
      ? `
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Abonnement de base (${params.cycle}) :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600;">${baseVal}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #B45309;">Frais d'overage (${overageDetails.batches} lot(s) • +${overageDetails.overageClicks.toLocaleString()} clics) :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #B45309;">+$${overageDetails.cost.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #E2E8F0;">
              <td style="padding: 8px 0 0 0; color: #09090B; font-weight: 700;">Montant total prélevé :</td>
              <td style="padding: 8px 0 0 0; text-align: right; font-weight: 800; color: #2563EB; font-size: 14.5px;">${totalVal}</td>
            </tr>`
      : "";

    const overageReassuranceHtml = hasOverage && overageDetails
      ? `
        <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-left: 4px solid #16A34A; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 13px; color: #166534; line-height: 1.5;">
          ✓ <strong>Garantie Zéro Coupure honorée</strong> : Grâce au palier d'overage automatique (+${overageDetails.overageClicks.toLocaleString()} clics régularisés), l'intégralité de vos redirections edge est restée 100% active sans aucun blocage.
        </div>`
      : "";

    return `<!DOCTYPE html>
<html lang="fr" style="color-scheme: light only;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de Renouvellement</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center">
        <table width="560" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 32px 36px 20px 36px; border-bottom: 1px solid #F1F5F9;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <span style="font-weight: 800; font-size: 19px; color: #09090B; letter-spacing: -0.03em;">LShorter</span>
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #2563EB;"></span>
              </div>
              <h1 style="color: #09090B; font-size: 21px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px 0; line-height: 1.3;">
                Renouvellement LShorter ${safePlanName} confirmé (Overage inclus)
              </h1>
              <p style="color: #64748B; font-size: 13px; margin: 0; line-height: 1.5;">Confirmation de renouvellement et facture disponible</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 28px 36px 32px 36px; color: #18181B; font-size: 14px; line-height: 1.65;">
              <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${params.name}</strong>,</p>
              <p style="margin: 0 0 20px 0; color: #334155;">
                Votre abonnement <strong>LShorter ${safePlanName}</strong> a bien été renouvelé avec succès.
              </p>
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
                <table width="100%" style="font-size: 13.5px; color: #09090B; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748B;">Forfait activé :</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #2563EB;">LShorter ${safePlanName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748B;">Cycle de facturation :</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600;">${params.cycle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748B;">Date d'effet :</td>
                    <td style="padding: 6px 0; text-align: right;">${params.startDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748B;">Prochain renouvellement :</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600;">${params.endDate}</td>
                  </tr>
                  ${amountSectionHtml}
                  <tr>
                    <td style="padding: 6px 0; color: #64748B;">Référence facture :</td>
                    <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700;">${params.invoiceNumber}</td>
                  </tr>
                </table>
              </div>
              ${overageReassuranceHtml}
              <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px;">
                <p style="margin: 0 0 8px 0; color: #1E3A8A; font-size: 13.5px; font-weight: 600;">
                  📄 Votre facture officielle est disponible
                </p>
                <a href="https://lsho.cc/api/billing/invoices/dodo_sample/download" style="color: #2563EB; font-size: 13px; font-weight: 700; text-decoration: underline;">
                  Télécharger la facture PDF (${params.invoiceNumber}) →
                </a>
              </div>
              <div style="margin-top: 28px;">
                <a href="https://lsho.cc/dashboard/settings?tab=billing" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 13.5px; padding: 12px 24px; border-radius: 8px;">
                  Télécharger ma facture / Tableau de bord
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 36px; border-top: 1px solid #E2E8F0;">
              <p style="color: #64748B; font-size: 11.5px; margin: 0 0 4px 0; line-height: 1.5;">
                LShorter Edge Infrastructure &bull; https://lsho.cc
              </p>
              <p style="color: #94A3B8; font-size: 11px; margin: 0;">
                <a href="https://lsho.cc" style="color: #2563EB; text-decoration: none;">https://lsho.cc</a> &bull; contact@lsho.cc
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // Création du dossier d'aperçu
  const previewDir = path.join(process.cwd(), "public", "email-previews");
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  // 1. Email Pré-Renouvellement J-2 Pro (175 000 clics = +25k clics, 1 lot de 50k = +$3.00)
  const preHtml = generatePreRenewalEmailHtml({
    name: "Alexandre Dupont",
    plan: "PRO",
    daysRemaining: 2,
    isAutoRenew: true,
    overageInfo: {
      overageClicks: 25000,
      batches: 1,
      cost: 3.0,
      batchSize: 50000,
      costPerBatch: 3.0,
      monthlyIncludedClicks: 150000,
      basePrice: 15.0,
    },
  });
  const prePath = path.join(previewDir, "pre-renewal-overage-alert.html");
  fs.writeFileSync(prePath, preHtml, "utf-8");
  console.log(`  ✓ E-mail Pré-Renouvellement généré : ${prePath}`);

  // 2. Email Post-Renouvellement Pro (Base $15 + Overage $3 = $18 débité)
  const postHtml = generatePostRenewalEmailHtml({
    name: "Alexandre Dupont",
    planName: "PRO",
    startDate: "16 Novembre 2026",
    endDate: "16 Décembre 2026",
    cycle: "Mensuel",
    invoiceNumber: "INV-DODO-7B9F12A",
    overageDetails: {
      overageClicks: 25000,
      batches: 1,
      cost: 3.0,
      baseAmount: 15.0,
      totalAmount: 18.0,
    },
  });
  const postPath = path.join(previewDir, "post-renewal-overage-confirmation.html");
  fs.writeFileSync(postPath, postHtml, "utf-8");
  console.log(`  ✓ E-mail Post-Renouvellement généré : ${postPath}`);

  console.log("\n=======================================================");
  console.log("  TOUS LES TESTS ONT REUSSI AVEC SUCCES (100% OK) !");
  console.log("=======================================================\n");
}

runVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

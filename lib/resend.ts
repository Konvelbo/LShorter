import { Resend } from "resend";

/**
 * Resend Email Client & Helper (Light Mode Sober Design System)
 * ─────────────────────────────────────────────────────────────────────────────
 * Always renders in Light Mode:
 * - Pure white background (#FFFFFF), black text (#09090B / #18181B)
 * - Cobalt blue primary elements & CTA buttons (#2563EB)
 * - No pulsing dots, no badges, simple and sober editorial layout
 */

const resendApiKey = process.env.RESEND_API_KEY;
const isLiveKey =
  resendApiKey &&
  !resendApiKey.startsWith("re_placeholder") &&
  resendApiKey.length > 10;

const resend = isLiveKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = (
  process.env.RESEND_FROM_EMAIL || "LShorter <security@lsho.cc>"
).replace(/\s+Security\b/gi, "");
const BUG_FEATURE_RECEIVER =
  process.env.BUG_FEATURE_RECEIVER_EMAIL ||
  process.env.FEEDBACK_RECEIVER_EMAIL ||
  "contact@lsho.cc";
const DEFAULT_FEEDBACK_RECEIVER =
  process.env.FEEDBACK_RECEIVER_EMAIL || "support@lsho.cc";

// Deduplication guard so a welcome email is never sent more than once per recipient
const sentWelcomeEmailsCache = new Set<string>();

function renderLightEmailLayout({
  title,
  subtitle,
  bodyHtml,
  ctaLabel,
  ctaHref,
  footerNote,
}: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr" style="color-scheme: light only;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; color: #09090B; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
          <!-- Top Blue Accent Bar -->
          <tr>
            <td style="height: 4px; background-color: #2563EB; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #F1F5F9;">
              <div style="font-size: 16px; font-weight: 800; color: #2563EB; letter-spacing: -0.02em; margin-bottom: 14px;">
                LShorter
              </div>
              <h1 style="color: #09090B; font-size: 21px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px 0; line-height: 1.3;">
                ${title}
              </h1>
              ${
                subtitle
                  ? `<p style="color: #64748B; font-size: 13px; margin: 0; line-height: 1.5;">${subtitle}</p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 36px 32px 36px; color: #18181B; font-size: 14px; line-height: 1.65;">
              ${bodyHtml}
              ${
                ctaLabel && ctaHref
                  ? `<div style="margin-top: 28px;">
                      <a href="${ctaHref}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 13.5px; padding: 12px 24px; border-radius: 8px;">
                        ${ctaLabel}
                      </a>
                    </div>`
                  : ""
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 36px; border-top: 1px solid #E2E8F0;">
              <p style="color: #64748B; font-size: 11.5px; margin: 0 0 4px 0; line-height: 1.5;">
                ${footerNote || "LShorter Edge Infrastructure &bull; https://lsho.cc"}
              </p>
              <p style="color: #94A3B8; font-size: 11px; margin: 0;">
                <a href="https://lsho.cc" style="color: #2563EB; text-decoration: none;">https://lsho.cc</a> &bull; <a href="mailto:support@lsho.cc" style="color: #64748B; text-decoration: none;">support@lsho.cc</a>
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

/**
 * 1. Send Password Reset PIN Code Email (15-min validity)
 */
export async function sendPasswordResetPinEmail({
  to,
  pin,
  name,
}: {
  to: string;
  pin: string;
  name?: string;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  const userName = name || to.split("@")[0];

  if (!resend) {
    console.log(`\n[DEV EMAIL] Password Reset PIN to ${to}: ${pin}\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const html = renderLightEmailLayout({
      title: "Réinitialisation de votre mot de passe",
      subtitle: "Vérification de sécurité de votre compte LShorter",
      bodyHtml: `
        <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 20px 0; color: #334155;">
          Vous avez demandé la réinitialisation du mot de passe de votre compte LShorter. Utilisez le code à 6 chiffres ci-dessous pour continuer :
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 20px 0;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #2563EB; letter-spacing: 10px;">
            ${pin}
          </div>
          <div style="color: #64748B; font-size: 11.5px; margin-top: 8px;">
            Valable pendant 15 minutes
          </div>
        </div>
        <p style="margin: 0; color: #64748B; font-size: 12.5px;">
          Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
        </p>
      `,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Votre code de sécurité LShorter : ${pin}`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * 2. Send Signup Verification PIN Code Email
 */
export async function sendSignupVerificationPinEmail({
  to,
  pin,
  name,
}: {
  to: string;
  pin: string;
  name?: string;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  const userName = name || to.split("@")[0];

  if (!resend) {
    console.log(`\n[DEV EMAIL] Signup Verification PIN to ${to}: ${pin}\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const html = renderLightEmailLayout({
      title: "Confirmez votre adresse e-mail",
      subtitle: "Finalisation de la création de votre compte LShorter",
      bodyHtml: `
        <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 20px 0; color: #334155;">
          Merci de rejoindre LShorter. Saisissez ce code de vérification à 6 chiffres pour activer votre espace de travail :
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 20px 0;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #2563EB; letter-spacing: 10px;">
            ${pin}
          </div>
          <div style="color: #64748B; font-size: 11.5px; margin-top: 8px;">
            Code à usage unique valable 15 minutes
          </div>
        </div>
      `,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Code de vérification LShorter : ${pin}`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * 3. Send User Feedback Notification Email
 */
export async function sendFeedbackNotificationEmail({
  category,
  senderEmail,
  message,
  pageContext,
  recipientEmail,
  rating,
}: {
  category: string;
  senderEmail: string;
  message: string;
  pageContext?: string;
  recipientEmail?: string;
  rating?: number;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  const normCategory = category.trim().toLowerCase();
  const isBug = normCategory.includes("bug") || normCategory.includes("erreur");
  const isFeature = normCategory.includes("feature") || normCategory.includes("suggestion");
  const targetEmail = recipientEmail || (isBug || isFeature ? BUG_FEATURE_RECEIVER : DEFAULT_FEEDBACK_RECEIVER);

  if (!resend) {
    console.log(`\n[DEV EMAIL] Feedback (${category}) from ${senderEmail}: ${message}\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const html = renderLightEmailLayout({
      title: "Nouveau retour utilisateur",
      subtitle: `Catégorie : ${category}${rating ? ` • Note : ${rating}/5` : ""}`,
      bodyHtml: `
        <table width="100%" style="font-size: 13px; color: #18181B; margin-bottom: 18px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 130px;">Expéditeur :</td>
            <td style="padding: 6px 0; font-weight: 600; color: #2563EB;">${senderEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;">Page :</td>
            <td style="padding: 6px 0; font-family: monospace; color: #09090B;">${pageContext || "/dashboard"}</td>
          </tr>
        </table>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #2563EB; padding: 16px; border-radius: 8px; color: #09090B; white-space: pre-wrap;">
          ${message}
        </div>
      `,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: targetEmail,
      replyTo: senderEmail,
      subject: `[LShorter Feedback - ${category}] de ${senderEmail}`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * 4. Send Quota Alert Email (80%, 100%, or Overage Active)
 */
export async function sendQuotaAlertEmail({
  to,
  name,
  plan,
  currentClicks,
  limitClicks,
  threshold,
  overageAmount,
}: {
  to: string;
  name?: string;
  plan: string;
  currentClicks: number;
  limitClicks: number;
  threshold: "80%" | "100%" | "OVERAGE";
  overageAmount?: number;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  const userName = name || to.split("@")[0];
  const isOverage = threshold === "OVERAGE";
  const is100 = threshold === "100%";

  const subject = isOverage
    ? `[LShorter] Overage actif sur votre forfait ${plan}`
    : is100
      ? `[LShorter] 100% de vos clics mensuels consommés`
      : `[LShorter] 80% de vos clics mensuels consommés`;

  const statusTitle = isOverage
    ? "Continuité de service : Overage actif"
    : is100
      ? "Quota mensuel de clics atteint (100%)"
      : "Seuil de consommation atteint (80%)";

  if (!resend) {
    console.log(`\n[DEV EMAIL] Quota Alert (${threshold}) to ${to}: ${currentClicks}/${limitClicks}\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const html = renderLightEmailLayout({
      title: statusTitle,
      subtitle: `Forfait ${plan} • Suivi de consommation mensuelle`,
      bodyHtml: `
        <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 20px 0; color: #334155;">
          ${
            isOverage
              ? `Votre trafic dépasse le quota mensuel inclus de votre forfait <strong>${plan}</strong>. Vos redirections restent 100 % actives sans aucune interruption.`
              : is100
                ? `Vous avez atteint 100 % du quota de clics mensuels inclus dans votre forfait <strong>${plan}</strong>.`
                : `Vous avez consommé plus de 80 % du quota de clics mensuels inclus dans votre forfait <strong>${plan}</strong>.`
          }
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px;">
          <table width="100%" style="font-size: 13.5px; color: #09090B; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Consommation actuelle :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700;">${currentClicks.toLocaleString("fr-FR")} clics</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Quota mensuel inclus :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600;">${limitClicks.toLocaleString("fr-FR")} clics</td>
            </tr>
            ${
              overageAmount !== undefined && overageAmount > 0
                ? `<tr>
                    <td style="padding: 8px 0 0 0; border-top: 1px solid #E2E8F0; color: #09090B; font-weight: 600;">Montant overage estimé :</td>
                    <td style="padding: 8px 0 0 0; border-top: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: #2563EB;">+$${overageAmount.toFixed(2)}</td>
                  </tr>`
                : ""
            }
          </table>
        </div>
      `,
      ctaLabel: "Gérer mon abonnement",
      ctaHref: "https://lsho.cc/dashboard/settings?tab=billing",
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * 5. Send Certified Invoice Ready Email
 */
export async function sendInvoiceReadyEmail({
  to,
  name,
  invoiceNumber,
  amountPaid,
  currency = "USD",
  downloadUrl,
}: {
  to: string;
  name?: string;
  invoiceNumber: string;
  amountPaid: number;
  currency?: string;
  downloadUrl?: string;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  const userName = name || to.split("@")[0];
  const symbol = currency === "EUR" ? "€" : "$";
  const formattedAmount = `${symbol}${amountPaid.toFixed(2)}`;
  const directLink =
    downloadUrl ||
    `https://lsho.cc/api/billing/invoices/${invoiceNumber}/download`;

  if (!resend) {
    console.log(`\n[DEV EMAIL] Invoice ${invoiceNumber} Ready to ${to}: ${formattedAmount}\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const html = renderLightEmailLayout({
      title: `Facture ${invoiceNumber} disponible`,
      subtitle: "Reçu officiel de paiement LShorter",
      bodyHtml: `
        <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 20px 0; color: #334155;">
          Votre facture officielle relative à votre abonnement LShorter est disponible au téléchargement au format PDF.
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px;">
          <table width="100%" style="font-size: 13.5px; color: #09090B; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Numéro de facture :</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Date d'émission :</td>
              <td style="padding: 6px 0; text-align: right;">${new Date().toLocaleDateString("fr-FR")}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Montant réglé :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #2563EB;">${formattedAmount}</td>
            </tr>
          </table>
        </div>
      `,
      ctaLabel: "Télécharger la facture PDF",
      ctaHref: directLink,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[LShorter] Votre facture ${invoiceNumber} (${formattedAmount})`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * 6. Send Instant Welcome Email on First Login / Registration
 * Strictly deduplicated per recipient so it never sends multiple times.
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name?: string;
  scheduledAt?: string;
}): Promise<{ success: boolean; isDevFallback?: boolean; scheduled?: boolean; error?: string }> {
  const normalizedEmail = (to || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: "Email manquant" };
  }

  // Deduplication guard: never send more than once per email in server lifecycle
  if (sentWelcomeEmailsCache.has(normalizedEmail)) {
    return { success: true, scheduled: false };
  }
  sentWelcomeEmailsCache.add(normalizedEmail);

  const userName = name || normalizedEmail.split("@")[0];

  if (!resend) {
    console.log(`\n[DEV EMAIL] Instant Welcome Email sent once to ${normalizedEmail} (${userName})\n`);
    return { success: true, isDevFallback: true, scheduled: false };
  }

  try {
    const html = renderLightEmailLayout({
      title: "Bienvenue sur LShorter",
      subtitle: "Votre infrastructure de liens courts et d'analyse Edge est prête",
      bodyHtml: `
        <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 18px 0; color: #334155;">
          Merci d'avoir rejoint <strong>LShorter</strong>. Votre compte est immédiatement actif et prêt à gérer vos liens courts, vos règles de routage géographique et vos QR codes.
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; margin: 0 0 18px 0;">
          <p style="color: #09090B; font-size: 13px; font-weight: 700; margin: 0 0 10px 0;">
            Pour démarrer rapidement :
          </p>
          <ul style="color: #334155; font-size: 13px; line-height: 1.75; margin: 0; padding-left: 18px;">
            <li>Créez votre premier lien court sur <strong>lsho.cc</strong> avec un alias personnalisé.</li>
            <li>Générez un QR Code vectoriel adapté à votre identité visuelle.</li>
            <li>Suivez vos clics et conversions en temps réel depuis votre tableau de bord.</li>
          </ul>
        </div>
        <p style="margin: 0; color: #64748B; font-size: 13px;">
          Si vous avez la moindre question, répondez simplement à cet e-mail.
        </p>
      `,
      ctaLabel: "Accéder à mon tableau de bord",
      ctaHref: "https://lsho.cc/dashboard",
    });

    // Send immediately (no scheduledAt delay)
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: "Bienvenue sur LShorter — Votre espace est prêt",
      html,
    });

    if (error) {
      sentWelcomeEmailsCache.delete(normalizedEmail);
      return { success: false, error: error.message };
    }

    return { success: true, scheduled: false };
  } catch (err: any) {
    sentWelcomeEmailsCache.delete(normalizedEmail);
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * 7. Send Plan Purchase & Upgrade Confirmation Email
 */
export async function sendPlanPurchaseEmail({
  to,
  name,
  planName,
  startDate,
  endDate,
  cycle,
}: {
  to: string;
  name?: string;
  planName: string;
  startDate: string;
  endDate: string;
  cycle: string;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  const userName = name || to.split("@")[0];

  if (!resend) {
    console.log(`\n[DEV EMAIL] Plan Purchase (${planName}) to ${to}\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const html = renderLightEmailLayout({
      title: `Abonnement LShorter ${planName} activé`,
      subtitle: "Confirmation de votre souscription et activation immédiate",
      bodyHtml: `
        <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 20px 0; color: #334155;">
          Merci pour votre confiance. Votre abonnement <strong>LShorter ${planName}</strong> est désormais actif sur votre compte.
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
          <table width="100%" style="font-size: 13.5px; color: #09090B; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Forfait activé :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #2563EB;">LShorter ${planName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Cycle de facturation :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600;">${cycle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Date d'activation :</td>
              <td style="padding: 6px 0; text-align: right;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Prochain renouvellement :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600;">${endDate}</td>
            </tr>
          </table>
        </div>
      `,
      ctaLabel: "Ouvrir mon tableau de bord",
      ctaHref: "https://lsho.cc/dashboard",
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Confirmation d'activation de votre forfait LShorter ${planName}`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * 8. Send Monthly Target Reached Email
 */
export async function sendMonthlyTargetReachedEmail({
  to,
  name,
  metricType,
  achievedValue,
  targetValue,
  monthLabel,
}: {
  to: string;
  name?: string;
  metricType: "revenue" | "clicks" | "both";
  achievedValue: string;
  targetValue: string;
  monthLabel: string;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  const userName = name || to.split("@")[0];
  const metricLabel =
    metricType === "revenue"
      ? "Objectif de revenus mensuel"
      : metricType === "clicks"
        ? "Objectif de clics mensuel"
        : "Objectifs mensuels (clics & revenus)";

  if (!resend) {
    console.log(`\n[DEV EMAIL] Monthly Target Reached (${metricLabel}) to ${to}\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const html = renderLightEmailLayout({
      title: `${metricLabel} atteint`,
      subtitle: `Période : ${monthLabel}`,
      bodyHtml: `
        <p style="margin: 0 0 16px 0; color: #09090B;">Bonjour <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 20px 0; color: #334155;">
          Vos liens courts LShorter viennent d'atteindre l'objectif mensuel que vous aviez configuré sur votre tableau de bord.
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; text-align: center;">
          <div style="font-size: 12px; color: #64748B; margin-bottom: 6px;">Performance enregistrée</div>
          <div style="font-size: 26px; font-weight: 800; color: #2563EB;">
            ${achievedValue} <span style="font-size: 15px; color: #09090B; font-weight: 600;">/ ${targetValue}</span>
          </div>
        </div>
      `,
      ctaLabel: "Consulter mes statistiques",
      ctaHref: "https://lsho.cc/dashboard",
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[LShorter] ${metricLabel} atteint (${achievedValue})`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

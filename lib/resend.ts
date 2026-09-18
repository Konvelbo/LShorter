import { Resend } from "resend";

/**
 * Resend Email Client & Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends password reset PIN codes and feedback notifications.
 * Automatically falls back to dev logging if API key is not configured.
 */

const resendApiKey = process.env.RESEND_API_KEY;
const isLiveKey =
  resendApiKey &&
  !resendApiKey.startsWith("re_placeholder") &&
  resendApiKey.length > 10;

const resend = isLiveKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "LShorter <security@lsho.cc>";
const BUG_FEATURE_RECEIVER =
  process.env.BUG_FEATURE_RECEIVER_EMAIL || process.env.FEEDBACK_RECEIVER_EMAIL || "contact@lsho.cc";
const DEFAULT_FEEDBACK_RECEIVER =
  process.env.FEEDBACK_RECEIVER_EMAIL || "support@lsho.cc";

/**
 * Send Password Reset PIN Code Email (15-min validity)
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
    console.log(
      `\n🔑 ==================== [DEV MODE EMAIL] ====================`
    );
    console.log(`✉️  Destinataire : ${to}`);
    console.log(`🔐 Code PIN de réinitialisation : [ ${pin} ]`);
    console.log(`⏱️  Validité : 15 minutes`);
    console.log(
      `============================================================\n`
    );
    return { success: true, isDevFallback: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[LShorter] Votre code de sécurité : ${pin}`,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Code de réinitialisation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fafafa;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #141416; border: 1px solid #27272a; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #222225;">
                      <div style="display: inline-block; background-color: #ff6600; color: #ffffff; font-weight: bold; font-size: 20px; padding: 8px 16px; border-radius: 8px; letter-spacing: 2px;">
                        LSHORTER
                      </div>
                      <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 20px 0 6px 0;">Réinitialisation de votre mot de passe</h1>
                      <p style="color: #a1a1aa; font-size: 13px; margin: 0;">Sécurité de votre compte SaaS</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                        Bonjour <strong>${userName}</strong>,
                      </p>
                      <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                        Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte LShorter. Saisissez ce code PIN à 6 chiffres pour continuer :
                      </p>

                      <!-- PIN Code Box -->
                      <div style="background-color: #1a1a1e; border: 2px solid #ff6600; border-radius: 10px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #ff6600; letter-spacing: 12px; display: inline-block;">
                          ${pin}
                        </span>
                        <p style="color: #71717a; font-size: 11px; margin: 10px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
                          ⏱️ Valable pendant 15 minutes
                        </p>
                      </div>

                      <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin: 0;">
                        ⚠️ Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité. Votre mot de passe actuel restera inchangé.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0d0d10; padding: 20px 32px; text-align: center; border-top: 1px solid #222225;">
                      <p style="color: #52525b; font-size: 11px; margin: 0;">
                        LShorter Cloud Edge Platform &bull; Haute Performance &amp; Sécurité
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending password reset email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Resend] Unexpected error:", err);
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * Send Account Creation / Signup Verification PIN Code Email (15-min validity)
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
    console.log(
      `\n🚀 ==================== [DEV MODE SIGNUP PIN EMAIL] ====================`
    );
    console.log(`✉️  Destinataire : ${to}`);
    console.log(`👤 Nom          : ${userName}`);
    console.log(`🔐 Code PIN d'activation de compte : [ ${pin} ]`);
    console.log(`⏱️  Validité : 15 minutes`);
    console.log(
      `========================================================================\n`
    );
    return { success: true, isDevFallback: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[LShorter] Validez votre compte : votre code de sécurité est ${pin}`,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Validation de votre compte LShorter</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fafafa;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #141416; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #222225;">
                      <div style="display: inline-block; background-color: #ff6600; color: #ffffff; font-weight: bold; font-size: 20px; padding: 8px 16px; border-radius: 8px; letter-spacing: 2px;">
                        LSHORTER
                      </div>
                      <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 20px 0 6px 0;">Validation de votre compte</h1>
                      <p style="color: #a1a1aa; font-size: 13px; margin: 0;">Activez votre accès à la plateforme LShorter</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                        Bienvenue <strong>${userName}</strong>,
                      </p>
                      <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                        Merci d'avoir rejoint LShorter. Pour finaliser la création de votre compte et sécuriser votre espace, saisissez ce code PIN de confirmation à 6 chiffres :
                      </p>

                      <!-- PIN Code Box -->
                      <div style="background-color: #1a1a1e; border: 2px solid #ff6600; border-radius: 10px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #ff6600; letter-spacing: 12px; display: inline-block;">
                          ${pin}
                        </span>
                        <p style="color: #71717a; font-size: 11px; margin: 10px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
                          ⏱️ Valable pendant 15 minutes
                        </p>
                      </div>

                      <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin: 0;">
                        ⚠️ Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet e-mail en toute sécurité.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0d0d10; padding: 20px 32px; text-align: center; border-top: 1px solid #222225;">
                      <p style="color: #52525b; font-size: 11px; margin: 0;">
                        LShorter &bull; Haute Performance &amp; Sécurité
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending signup verification email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Resend] Unexpected error in signup verification email:", err);
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * Send User Feedback Notification Email
 * Automatically routes Bug reports and Feature requests to BUG_FEATURE_RECEIVER
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
  const isBug =
    normCategory.includes("bug") ||
    normCategory.includes("bogue") ||
    normCategory.includes("erreur");
  const isFeature =
    normCategory.includes("feature") ||
    normCategory.includes("fonctionnalit") ||
    normCategory.includes("suggestion") ||
    normCategory.includes("idée");
  const isBugOrFeature = isBug || isFeature;

  // Direct bug / feature to BUG_FEATURE_RECEIVER
  const targetEmail = recipientEmail
    ? recipientEmail
    : isBugOrFeature
      ? BUG_FEATURE_RECEIVER
      : DEFAULT_FEEDBACK_RECEIVER;

  const categoryBadgeColor = isBug ? "#ef4444" : isFeature ? "#38bdf8" : "#ff6600";
  const categoryLabel = isBug
    ? "🚨 BUG REPORT"
    : isFeature
      ? "💡 FEATURE REQUEST"
      : category.toUpperCase();
  const subjectTag = isBug
    ? "[LShorter BUG]"
    : isFeature
      ? "[LShorter FEATURE]"
      : `[LShorter Feedback - ${category}]`;

  if (!resend) {
    console.log(
      `\n💬 ==================== [DEV MODE FEEDBACK] ====================`
    );
    console.log(`🎯 Destinataire : ${targetEmail}`);
    console.log(`👤 Expéditeur : ${senderEmail}`);
    console.log(`🏷️  Catégorie : ${category} (${categoryLabel})`);
    if (rating) {
      console.log(`⭐ Note : ${rating}/5 ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`);
    }
    console.log(`📄 Page : ${pageContext || "Non spécifiée"}`);
    console.log(`✉️  Message :\n${message}`);
    console.log(
      `==============================================================\n`
    );
    return { success: true, isDevFallback: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: targetEmail,
      replyTo: senderEmail,
      subject: `${subjectTag} de ${senderEmail}${rating ? ` [${rating}/5 ★]` : ""}`,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <title>${subjectTag}</title>
        </head>
        <body style="margin: 0; padding: 24px; background-color: #09090b; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #141416; border: 1px solid #27272a; border-radius: 10px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #222225; padding-bottom: 16px;">
              <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">Nouveau Retour Utilisateur</h2>
              <span style="background-color: ${categoryBadgeColor}; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                ${categoryLabel}
              </span>
            </div>

            <table style="width: 100%; font-size: 13px; color: #d4d4d8; margin-bottom: 20px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa; width: 130px;"><strong>Expéditeur :</strong></td>
                <td style="padding: 6px 0;"><a href="mailto:${senderEmail}" style="color: #38bdf8; text-decoration: none; font-weight: 600;">${senderEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;"><strong>Catégorie :</strong></td>
                <td style="padding: 6px 0;"><span style="color: #fafafa; font-weight: 600;">${category}</span></td>
              </tr>
              ${rating ? `
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;"><strong>Note :</strong></td>
                <td style="padding: 6px 0;"><span style="color: #f59e0b; font-weight: 700; font-size: 14px;">${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)</span></td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;"><strong>Page Source :</strong></td>
                <td style="padding: 6px 0; font-family: monospace; color: #e4e4e7;">${pageContext || "/dashboard"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;"><strong>Date & Heure :</strong></td>
                <td style="padding: 6px 0; color: #a1a1aa;">${new Date().toLocaleString("fr-FR")}</td>
              </tr>
            </table>

            <div style="background-color: #1a1a1e; border-left: 3px solid ${categoryBadgeColor}; padding: 18px; border-radius: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #fafafa;">
              ${message}
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #222225; text-align: center;">
              <p style="color: #52525b; font-size: 11px; margin: 0;">
                LShorter Notifications &bull; Routé vers <span style="color: #71717a;">${targetEmail}</span>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending feedback email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Resend] Unexpected error:", err);
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * Send Quota Alert Email (80%, 100%, or Overage Active)
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
    ? `[LShorter] ⚡ Garantie Zéro Coupure : Overage actif sur votre forfait ${plan}`
    : is100
      ? `[LShorter] 🚨 Alerte Quota : 100% de vos clics mensuels consommés`
      : `[LShorter] ⚠️ Alerte Quota : 80% de vos clics mensuels consommés`;

  const bannerColor = isOverage ? "#f59e0b" : is100 ? "#ef4444" : "#ff6600";
  const statusTitle = isOverage
    ? "Overage Actif — Liens 100% Fonctionnels"
    : is100
      ? "Quota de Clics Mensuel Atteint (100%)"
      : "Seuil d'Alerte Quota Atteint (80%)";

  if (!resend) {
    console.log(`\n🔔 ==================== [DEV MODE QUOTA EMAIL] ====================`);
    console.log(`✉️  Destinataire : ${to}`);
    console.log(`👤 Utilisateur  : ${userName}`);
    console.log(`🏷️  Forfait      : ${plan}`);
    console.log(`📊 Clics actuels : ${currentClicks.toLocaleString()} / ${limitClicks.toLocaleString()}`);
    console.log(`⚠️  Seuil        : ${threshold}`);
    if (overageAmount) console.log(`💰 Overage estimé : ${overageAmount.toFixed(2)} €`);
    console.log(`=================================================================\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fafafa;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #141416; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <tr>
                    <td style="padding: 28px 32px; border-bottom: 1px solid #222225; text-align: center;">
                      <div style="display: inline-block; background-color: #ff6600; color: #ffffff; font-weight: bold; font-size: 18px; padding: 6px 14px; border-radius: 6px; letter-spacing: 2px;">
                        LSHORTER EDGE
                      </div>
                      <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 18px 0 4px 0;">${statusTitle}</h1>
                      <p style="color: #a1a1aa; font-size: 13px; margin: 0;">Gestion automatique des quotas de trafic</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 32px;">
                      <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                        Bonjour <strong>${userName}</strong>,
                      </p>
                      <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
                        ${
                          isOverage
                            ? `Votre volume de trafic a dépassé le quota mensuel inclus de votre forfait <strong>${plan}</strong>. Grâce à notre <strong>Garantie Zéro Coupure</strong>, vos redirections restent 100% opérationnelles sans interruption.`
                            : is100
                              ? `Vous avez atteint <strong>100% du quota de clics</strong> alloué à votre forfait <strong>${plan}</strong> pour la période de facturation en cours.`
                              : `Vous avez consommé plus de <strong>80% du quota de clics</strong> alloué à votre forfait <strong>${plan}</strong>.`
                        }
                      </p>

                      <div style="background-color: #1a1a1e; border: 1px solid #27272a; border-left: 4px solid ${bannerColor}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
                          <span style="color: #a1a1aa;">Consommation actuelle :</span>
                          <strong style="color: #ffffff;">${currentClicks.toLocaleString("fr-FR")} clics</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
                          <span style="color: #a1a1aa;">Quota mensuel inclus :</span>
                          <strong style="color: #ffffff;">${limitClicks.toLocaleString("fr-FR")} clics</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px;">
                          <span style="color: #a1a1aa;">Forfait actif :</span>
                          <strong style="color: #ff6600;">${plan}</strong>
                        </div>
                        ${
                          overageAmount !== undefined && overageAmount > 0
                            ? `
                          <div style="border-top: 1px solid #27272a; margin-top: 12px; padding-top: 12px; display: flex; justify-content: space-between; font-size: 13px;">
                            <span style="color: #f59e0b; font-weight: 600;">Montant overage estimé :</span>
                            <strong style="color: #f59e0b;">+${overageAmount.toFixed(2)} €</strong>
                          </div>
                        `
                            : ""
                        }
                      </div>

                      <div style="text-align: center; margin: 28px 0 12px 0;">
                        <a href="${process.env.NEXTAUTH_URL || "https://lsho.cc"}/dashboard/settings?tab=billing" style="display: inline-block; background-color: #ff6600; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(255, 102, 0, 0.4);">
                          Consulter mon tableau de bord &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #0d0d10; padding: 18px 32px; text-align: center; border-top: 1px solid #222225;">
                      <p style="color: #52525b; font-size: 11px; margin: 0;">
                        LShorter Cloud Edge Platform &bull; Surveillance continue des quotas &amp; SLA 99.99%
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending quota alert email:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Resend] Unexpected quota alert error:", err);
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * Send Certified Invoice Ready Email
 */
export async function sendInvoiceReadyEmail({
  to,
  name,
  invoiceNumber,
  amountPaid,
  currency = "EUR",
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
  const formattedAmount = `${amountPaid.toFixed(2)} ${currency === "EUR" ? "€" : currency}`;
  const directLink = downloadUrl || `${process.env.NEXTAUTH_URL || "https://lsho.cc"}/api/billing/invoices/${invoiceNumber}/download`;

  if (!resend) {
    console.log(`\n🧾 ==================== [DEV MODE INVOICE EMAIL] ====================`);
    console.log(`✉️  Destinataire : ${to}`);
    console.log(`👤 Utilisateur  : ${userName}`);
    console.log(`📄 N° Facture   : ${invoiceNumber}`);
    console.log(`💰 Montant      : ${formattedAmount}`);
    console.log(`🔗 Téléchargement : ${directLink}`);
    console.log(`===================================================================\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[LShorter] 📄 Votre facture ${invoiceNumber} (${formattedAmount}) est disponible`,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <title>Facture ${invoiceNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fafafa;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #141416; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <tr>
                    <td style="padding: 28px 32px; border-bottom: 1px solid #222225; text-align: center;">
                      <div style="display: inline-block; background-color: #ff6600; color: #ffffff; font-weight: bold; font-size: 18px; padding: 6px 14px; border-radius: 6px; letter-spacing: 2px;">
                        LSHORTER EDGE
                      </div>
                      <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 18px 0 4px 0;">Nouvelle Facture Acquittée</h1>
                      <p style="color: #10b981; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 0; letter-spacing: 1px;">✓ Règlement Enregistré</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 32px;">
                      <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                        Bonjour <strong>${userName}</strong>,
                      </p>
                      <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                        Votre facture officielle relative à votre abonnement LShorter est disponible. Votre reçu officiel PDF 1.4 conforme est prêt au téléchargement.
                      </p>

                      <div style="background-color: #1a1a1e; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <table width="100%" style="font-size: 13px; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 6px 0; color: #a1a1aa;">Référence Facture :</td>
                            <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #ffffff; text-align: right;">${invoiceNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #a1a1aa;">Date d'émission :</td>
                            <td style="padding: 6px 0; color: #ffffff; text-align: right;">${new Date().toLocaleDateString("fr-FR")}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #a1a1aa;">Montant TTC Réglé :</td>
                            <td style="padding: 6px 0; font-size: 16px; font-weight: bold; color: #10b981; text-align: right;">${formattedAmount}</td>
                          </tr>
                        </table>
                      </div>

                      <div style="text-align: center; margin: 28px 0 12px 0;">
                        <a href="${directLink}" style="display: inline-block; background-color: #ff6600; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(255, 102, 0, 0.4);">
                          📥 Télécharger la Facture PDF &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #0d0d10; padding: 18px 32px; text-align: center; border-top: 1px solid #222225;">
                      <p style="color: #52525b; font-size: 11px; margin: 0;">
                        LShorter SAS &bull; RCS Paris B 912 345 678 &bull; TVA FR 82 912 345 678
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending invoice ready email:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Resend] Unexpected invoice ready error:", err);
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * Send Welcome Email (sent 2 hours after account creation)
 * Expresses sincere gratitude for joining LShorter with getting started tips.
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name?: string;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  const userName = name || to.split("@")[0];

  if (!resend) {
    console.log(
      `\n💌 ==================== [DEV MODE WELCOME EMAIL] ====================`
    );
    console.log(`✉️  Destinataire : ${to}`);
    console.log(`👤 Nom          : ${userName}`);
    console.log(`🎉 Type         : Email de Bienvenue (2h après inscription)`);
    console.log(
      `======================================================================\n`
    );
    return { success: true, isDevFallback: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Bienvenue chez LShorter ! 🚀 Merci de faire partie de notre aventure",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue chez LShorter</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fafafa;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #141416; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid #222225;">
                      <div style="display: inline-block; background-color: #ff6600; color: #ffffff; font-weight: bold; font-size: 20px; padding: 8px 18px; border-radius: 8px; letter-spacing: 2px;">
                        LSHORTER
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 22px 0 6px 0;">Bienvenue parmi nous ! 🚀</h1>
                      <p style="color: #a1a1aa; font-size: 13px; margin: 0;">Merci de faire partie de notre aventure</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                        Bonjour <strong>${userName}</strong>,
                      </p>
                      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.7; margin: 0 0 20px 0;">
                        Toute l'équipe de <strong>LShorter</strong> tenait à vous adresser un immense <strong>merci</strong> pour votre inscription ! Nous sommes particulièrement honorés et ravis de vous accueillir sur notre plateforme.
                      </p>
                      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
                        LShorter a été conçu pour vous offrir une expérience d'exception : une rapidité instantanée pour vos redirections, une sécurité optimale et des statistiques claires pour tous vos liens.
                      </p>

                      <!-- Quick Start Box -->
                      <div style="background-color: #1a1a1e; border: 1px solid #2e2e34; border-radius: 10px; padding: 20px; margin: 0 0 24px 0;">
                        <p style="color: #ff6600; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
                          💡 Quelques idées pour bien démarrer :
                        </p>
                        <ul style="color: #d4d4d8; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                          <li><strong>Raccourcissez votre premier lien</strong> et donnez-lui un alias mémorable.</li>
                          <li><strong>Créez des QR Codes personnalisés</strong> prêts à être partagés partout.</li>
                          <li><strong>Consultez vos statistiques en direct</strong> : découvrez d'où viennent vos visiteurs et sur quels appareils ils cliquent.</li>
                        </ul>
                      </div>

                      <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 28px 0;">
                        Nous mettons tout en œuvre pour vous offrir la solution la plus performante possible. Si vous avez la moindre question ou suggestion, vous pouvez répondre directement à cet e-mail, nous serons ravis de vous aider.
                      </p>

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 28px 0;">
                        <a href="https://lsho.cc/dashboard" style="display: inline-block; background-color: #ff6600; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(255, 102, 0, 0.4);">
                          Accéder à mon tableau de bord &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0d0d10; padding: 20px 32px; text-align: center; border-top: 1px solid #222225;">
                      <p style="color: #71717a; font-size: 11px; margin: 0 0 4px 0;">
                        L'équipe LShorter &bull; Plateforme Moderne de Gestion de Liens
                      </p>
                      <p style="color: #52525b; font-size: 11px; margin: 0;">
                        <a href="https://lsho.cc" style="color: #71717a; text-decoration: none;">https://lsho.cc</a> &bull; <a href="mailto:support@lsho.cc" style="color: #71717a; text-decoration: none;">support@lsho.cc</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending welcome email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Resend] Unexpected error in welcome email:", err);
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}

/**
 * Send Plan Purchase & Upgrade Confirmation Email (with explicit expiration / renewal date)
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
    console.log(
      `\n💎 ==================== [DEV MODE PLAN PURCHASE EMAIL] ====================`
    );
    console.log(`✉️  Destinataire       : ${to}`);
    console.log(`👤 Nom                : ${userName}`);
    console.log(`📦 Forfait            : ${planName}`);
    console.log(`📅 Date d'activation  : ${startDate}`);
    console.log(`⏳ Date de fin        : ${endDate}`);
    console.log(`🔄 Cycle              : ${cycle}`);
    console.log(
      `=========================================================================\n`
    );
    return { success: true, isDevFallback: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🎉 Merci pour votre confiance ! Votre abonnement LShorter ${planName} est activé`,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activation de votre abonnement LShorter</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fafafa;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #141416; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid #222225;">
                      <div style="display: inline-block; background-color: #ff6600; color: #ffffff; font-weight: bold; font-size: 20px; padding: 8px 18px; border-radius: 8px; letter-spacing: 2px;">
                        LSHORTER
                      </div>
                      <h1 style="color: #ffffff; font-size: 23px; font-weight: 700; margin: 22px 0 6px 0;">Abonnement ${planName} Activé ! 🎉</h1>
                      <p style="color: #a1a1aa; font-size: 13px; margin: 0;">Confirmation et récapitulatif de votre commande</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                        Bonjour <strong>${userName}</strong>,
                      </p>
                      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
                        Nous vous remercions chaleureusement pour votre passage au forfait <strong>LShorter ${planName}</strong> ! Votre confiance nous touche et nous donne les moyens de continuer à perfectionner chaque jour les outils que nous mettons à votre disposition.
                      </p>
                      <p style="color: #d4d4d8; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">
                        Vos nouveaux avantages sont d'ores et déjà actifs sur votre compte :
                      </p>

                      <!-- Subscription Details Box -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a1e; border: 1px solid #ff6600; border-radius: 10px; margin: 0 0 24px 0; overflow: hidden;">
                        <tr>
                          <td style="padding: 16px 20px; border-bottom: 1px solid #27272a;">
                            <span style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Forfait activé :</span>
                            <div style="color: #ffffff; font-size: 16px; font-weight: 700; margin-top: 2px;">LShorter ${planName}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 14px 20px; border-bottom: 1px solid #27272a;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td width="50%">
                                  <span style="color: #a1a1aa; font-size: 11px; text-transform: uppercase;">Date d'activation :</span>
                                  <div style="color: #ffffff; font-size: 13px; font-weight: 600; margin-top: 2px;">${startDate}</div>
                                </td>
                                <td width="50%">
                                  <span style="color: #ff6600; font-size: 11px; text-transform: uppercase; font-weight: 700;">Date de fin / renouvellement :</span>
                                  <div style="color: #ff6600; font-size: 13px; font-weight: 700; margin-top: 2px;">${endDate}</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 14px 20px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td width="50%">
                                  <span style="color: #a1a1aa; font-size: 11px; text-transform: uppercase;">Cycle de facturation :</span>
                                  <div style="color: #ffffff; font-size: 13px; font-weight: 600; margin-top: 2px;">${cycle}</div>
                                </td>
                                <td width="50%">
                                  <span style="color: #a1a1aa; font-size: 11px; text-transform: uppercase;">Statut du compte :</span>
                                  <div style="color: #10b981; font-size: 13px; font-weight: 700; margin-top: 2px;">● Actif et opérationnel</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Features list -->
                      <div style="background-color: #141418; border: 1px solid #27272a; border-radius: 10px; padding: 20px; margin: 0 0 24px 0;">
                        <p style="color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
                          ⚡ Ce que vous pouvez faire dès aujourd'hui :
                        </p>
                        <ul style="color: #d4d4d8; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                          <li>Profiter de quotas de clics augmentés et de redirections ultra-rapides.</li>
                          <li>Utiliser vos propres domaines personnalisés avec SSL automatique.</li>
                          <li>Sécuriser vos accès avec la protection avancée par code PIN.</li>
                          <li>Accéder à des rapports d'analyses et de métriques complets.</li>
                        </ul>
                      </div>

                      <p style="color: #a1a1aa; font-size: 12px; line-height: 1.6; margin: 0 0 28px 0;">
                        Votre facture détaillée est disponible à tout moment dans votre espace <a href="https://lsho.cc/dashboard/pricing" style="color: #ff6600; text-decoration: none;">Paramètres &gt; Facturation</a>.
                      </p>

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 28px 0;">
                        <a href="https://lsho.cc/dashboard" style="display: inline-block; background-color: #ff6600; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(255, 102, 0, 0.4);">
                          Découvrir mes nouveaux avantages &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0d0d10; padding: 20px 32px; text-align: center; border-top: 1px solid #222225;">
                      <p style="color: #71717a; font-size: 11px; margin: 0 0 4px 0;">
                        L'équipe LShorter &bull; Haute Performance &amp; Sécurité
                      </p>
                      <p style="color: #52525b; font-size: 11px; margin: 0;">
                        <a href="https://lsho.cc" style="color: #71717a; text-decoration: none;">https://lsho.cc</a> &bull; <a href="mailto:support@lsho.cc" style="color: #71717a; text-decoration: none;">support@lsho.cc</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending plan purchase email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Resend] Unexpected error in plan purchase email:", err);
    return { success: false, error: err?.message || "Erreur d'envoi" };
  }
}



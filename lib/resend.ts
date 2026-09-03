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
  process.env.RESEND_FROM_EMAIL || "LShorter Security <onboarding@resend.dev>";
const FEEDBACK_RECEIVER =
  process.env.FEEDBACK_RECEIVER_EMAIL || "delivered@resend.dev";

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
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #141416; border: 1px solid #27272a; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
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
                      <div style="background-color: #1a1a1e; border: 2px solid #ff6600; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
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
 * Send User Feedback Notification Email to Admin (sko107282@gmail.com)
 */
export async function sendFeedbackNotificationEmail({
  category,
  senderEmail,
  message,
  pageContext,
}: {
  category: string;
  senderEmail: string;
  message: string;
  pageContext?: string;
}): Promise<{ success: boolean; isDevFallback?: boolean; error?: string }> {
  if (!resend) {
    console.log(
      `\n💬 ==================== [DEV MODE FEEDBACK] ====================`
    );
    console.log(`👤 Expéditeur : ${senderEmail}`);
    console.log(`🏷️  Catégorie : ${category}`);
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
      to: FEEDBACK_RECEIVER,
      subject: `[LShorter Feedback] ${category} - de ${senderEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 20px; background-color: #09090b; color: #ffffff; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #141416; border: 1px solid #27272a; border-radius: 12px; padding: 24px;">
            <h2 style="color: #ff6600; margin-top: 0;">Nouveau Feedback Utilisateur</h2>
            <table style="width: 100%; font-size: 13px; color: #d4d4d8; margin-bottom: 20px;">
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa; width: 120px;"><strong>Expéditeur :</strong></td>
                <td style="padding: 6px 0;"><a href="mailto:${senderEmail}" style="color: #38bdf8;">${senderEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;"><strong>Catégorie :</strong></td>
                <td style="padding: 6px 0;"><span style="background-color: #ff6600; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${category}</span></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;"><strong>Page Source :</strong></td>
                <td style="padding: 6px 0; font-family: monospace;">${pageContext || "Non spécifiée"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;"><strong>Date :</strong></td>
                <td style="padding: 6px 0;">${new Date().toLocaleString("fr-FR")}</td>
              </tr>
            </table>
            <div style="background-color: #1a1a1e; border-left: 3px solid #ff6600; padding: 16px; border-radius: 6px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #fafafa;">
              ${message}
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

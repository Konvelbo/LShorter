"use server";



/**
 * Server action triggered after a plan upgrade / subscription purchase.
 * NOTE: Paddle (Merchant of Record) automatically sends the official email receipt
 * and invoice PDF to the customer upon payment completion.
 * To avoid sending duplicate confirmation emails, project-level email dispatch is disabled.
 */
export async function sendPlanPurchaseConfirmationAction({
  userId,
  userEmail,
  userName,
  plan,
  cycle = "MONTHLY",
}: {
  userId: string;
  userEmail?: string;
  userName?: string;
  plan: string;
  cycle?: "MONTHLY" | "YEARLY" | string;
}): Promise<{ success: boolean; message?: string }> {
  // Intentionally disabled: Paddle natively handles customer email confirmations and certified PDF receipts.
  return { success: true, message: "Handled natively by Paddle." };
}

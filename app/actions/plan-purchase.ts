"use server";

/**
 * Server action triggered after a plan upgrade / subscription purchase.
 * NOTE: Dodo Payments automatically sends the official email receipt
 * and invoice PDF to the customer upon payment completion.
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
  return { success: true, message: "Handled natively by Dodo Payments." };
}

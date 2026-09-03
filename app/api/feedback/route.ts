import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { sendFeedbackNotificationEmail } from "@/lib/resend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexHttpClient(convexUrl);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, email, message, pageContext } = body;

    const cleanEmail = email ? email.trim().toLowerCase() : "visiteur@lshorter.io";
    const cleanCategory = category || "Question";
    const cleanMessage = message ? message.trim() : "";

    if (!cleanMessage) {
      return NextResponse.json(
        { success: false, message: "Le message ne peut pas être vide." },
        { status: 400 }
      );
    }

    // 1. Store in Convex DB
    try {
      if (convexUrl) {
        await convex.mutation(api.users.storeFeedback, {
          email: cleanEmail,
          category: cleanCategory,
          message: cleanMessage,
          pageContext: pageContext || "/dashboard",
        });
      }
    } catch (dbErr) {
      console.warn("[Feedback] Could not save to Convex DB:", dbErr);
    }

    // 2. Send notification email via Resend to sko107282@gmail.com
    await sendFeedbackNotificationEmail({
      category: cleanCategory,
      senderEmail: cleanEmail,
      message: cleanMessage,
      pageContext: pageContext || "/dashboard",
    });

    return NextResponse.json({
      success: true,
      message: "Merci pour votre retour ! Notre équipe l'a bien reçu.",
    });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de l'envoi du feedback." },
      { status: 500 }
    );
  }
}


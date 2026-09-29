import { NextResponse } from "next/server";
import { convexHttp as convex, convexUrl } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { sendFeedbackNotificationEmail } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, email, message, pageContext, rating } = body;

    const cleanEmail = email
      ? email.trim().toLowerCase()
      : "visiteur@lshorter.io";
    const cleanCategory = category || "Question";
    const cleanMessage = message ? message.trim() : "";
    const cleanRating =
      typeof rating === "number" && rating >= 1 && rating <= 5
        ? Math.round(rating)
        : undefined;

    if (!cleanMessage) {
      return NextResponse.json(
        { success: false, message: "Feedback message cannot be empty." },
        { status: 400 },
      );
    }

    let convexSaved = false;
    let convexId: string | null = null;

    // 1. Enregistrement direct et exclusif dans la base de données Convex
    try {
      if (convexUrl) {
        try {
          const res: any = await convex.mutation(api.users.storeFeedback, {
            email: cleanEmail,
            category: cleanCategory,
            message: cleanMessage,
            pageContext: pageContext || "/dashboard",
            rating: cleanRating,
          });
          convexSaved = true;
          convexId = res?.id || null;
        } catch {
          // Fallback avec nom de mutation brut si le proxy généré n'est pas encore rechargé
          const res: any = await convex.mutation("users:storeFeedback" as any, {
            email: cleanEmail,
            category: cleanCategory,
            message: cleanMessage,
            pageContext: pageContext || "/dashboard",
            rating: cleanRating,
          });
          convexSaved = true;
          convexId = res?.id || null;
        }
      }
    } catch (dbErr) {
      console.warn("[Feedback] Could not save to Convex DB:", dbErr);
    }

    // 2. Notification email via Resend (non-bloquant)
    try {
      await sendFeedbackNotificationEmail({
        category: cleanCategory,
        senderEmail: cleanEmail,
        message: cleanMessage,
        pageContext: pageContext || "/dashboard",
        rating: cleanRating,
      });
    } catch (emailErr) {
      console.warn("[Feedback] Email notification non-fatal error:", emailErr);
    }

    return NextResponse.json({
      success: true,
      convexSaved,
      id: convexId,
      message: "Thank you for your feedback! Our team has received it.",
    });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { success: false, message: "Error sending feedback." },
      { status: 500 },
    );
  }
}

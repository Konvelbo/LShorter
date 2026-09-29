import { NextRequest, NextResponse } from "next/server";
import { sendMonthlyTargetReachedEmail } from "@/lib/resend";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      email,
      name,
      metricType = "revenue",
      achievedValue,
      targetValue,
      monthLabel,
    } = body;

    const targetEmail = email || "founder@lshorter.com";
    const targetName = name || "Founder";
    const period =
      monthLabel ||
      new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const title =
      metricType === "revenue"
        ? "Monthly Revenue Target Reached"
        : metricType === "clicks"
          ? "Monthly Clicks Target Reached"
          : "Monthly Revenue & Clicks Targets Reached";

    const message =
      metricType === "revenue"
        ? `Congratulations! Your attributed revenue reached ${achievedValue} (Target: ${targetValue}) for ${period}.`
        : metricType === "clicks"
          ? `Congratulations! Your edge links reached ${achievedValue} clicks (Target: ${targetValue}) for ${period}.`
          : `Congratulations! Both your monthly revenue and click targets (${achievedValue}) have been reached for ${period}.`;

    // 1. Store notification in Convex notifications table (if configured)
    if (userId) {
      try {
        await fetchMutation(api.notifications.createNotification, {
          orgId: userId,
          title,
          message,
          type: "SUCCESS",
          linkUrl: "/dashboard/analytics",
        });
      } catch {
        // Fallback handled client-side via local notification inbox sync
      }
    }

    // 2. Dispatch transactional email via Resend
    const emailResult = await sendMonthlyTargetReachedEmail({
      to: targetEmail,
      name: targetName,
      metricType,
      achievedValue: String(achievedValue),
      targetValue: String(targetValue),
      monthLabel: period,
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: `target_${Date.now()}`,
        title,
        message,
        type: "SUCCESS",
        createdAt: Date.now(),
        isRead: false,
      },
      emailSent: emailResult.success,
      isDevFallback: emailResult.isDevFallback,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to dispatch target notification" },
      { status: 500 }
    );
  }
}

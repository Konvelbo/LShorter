import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { isSafeHttpUrl } from "@/lib/security-utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const url = new URL(`${WORKER_URL}/api/v1/webhooks`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
    });

    const rawData = await res.json().catch(() => ({ success: true, data: [] }));
    const rawList = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.data?.webhooks)
        ? rawData.data.webhooks
        : Array.isArray(rawData?.webhooks)
          ? rawData.webhooks
          : [];
    const normalizedWebhooks = rawList.map((wh: Record<string, unknown>) => ({
      ...wh,
      events: Array.isArray(wh?.events) && wh.events.length > 0 ? wh.events : ["click.created"],
      isActive: wh?.isActive !== false,
      secretKey: wh?.secretKey || wh?.secret_key || "",
    }));
    return NextResponse.json(
      { ...rawData, success: rawData?.success ?? true, data: { webhooks: normalizedWebhooks } },
      { status: res.status }
    );
  } catch (error) {
    console.warn("[Webhooks Proxy GET] Error:", error);
    return NextResponse.json({ success: true, data: { webhooks: [] } }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.url || !isSafeHttpUrl(body.url)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook URL scheme. Only public HTTP and HTTPS URLs are permitted." },
        { status: 400 }
      );
    }
    body.userId = userId;

    const url = new URL(`${WORKER_URL}/api/v1/webhooks`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawData = await res.json().catch(() => ({}));
    const createdWebhook = rawData?.data?.webhook || rawData?.data || rawData;
    const normalizedWebhook =
      createdWebhook && typeof createdWebhook === "object"
        ? {
            ...createdWebhook,
            secretKey: createdWebhook.secretKey || body.secretKey || "",
            events: Array.isArray(createdWebhook.events) ? createdWebhook.events : body.events || ["click.created"],
            isActive: createdWebhook.isActive ?? body.isActive ?? true,
          }
        : createdWebhook;
    return NextResponse.json(
      { ...rawData, success: rawData?.success ?? res.ok, data: { webhook: normalizedWebhook } },
      { status: res.status }
    );
  } catch (error) {
    console.warn("[Webhooks Proxy POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "Webhook ID is required" }, { status: 400 });
  }

  try {
    const url = new URL(`${WORKER_URL}/api/v1/webhooks/${id}`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
    });

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Webhooks Proxy DELETE] Error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

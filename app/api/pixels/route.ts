import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

function normalizePixelRecord(px: Record<string, unknown>) {
  const platform = px?.platform || px?.type || "meta";
  return {
    ...px,
    platform,
    type: px?.type || platform,
    isActive: px?.isActive !== false && px?.is_active !== false,
    eventsTrackedCount: Number(px?.eventsTrackedCount ?? px?.events_tracked_count ?? 0),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const url = new URL(`${WORKER_URL}/api/v1/pixels`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
    });

    const rawData = await res.json().catch(() => ({ success: true, data: { pixels: [] } }));
    const rawList = Array.isArray(rawData?.data?.pixels)
      ? rawData.data.pixels
      : Array.isArray(rawData?.data)
        ? rawData.data
        : [];
    return NextResponse.json(
      { ...rawData, success: rawData?.success ?? true, data: { pixels: rawList.map(normalizePixelRecord) } },
      { status: res.status }
    );
  } catch (error) {
    console.warn("[Pixels Proxy GET] Error:", error);
    return NextResponse.json({ success: true, data: { pixels: [] } }, { status: 200 });
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
    const platform = body.platform || body.type || "meta";
    body.userId = userId;
    body.platform = platform;
    body.type = platform;
    body.isActive = body.isActive !== false;

    const url = new URL(`${WORKER_URL}/api/v1/pixels`);
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
    const rawPixel = rawData?.data?.pixel || rawData?.data || rawData;
    const pixel = rawPixel && typeof rawPixel === "object"
      ? normalizePixelRecord({ ...body, ...rawPixel })
      : rawPixel;
    return NextResponse.json(
      { ...rawData, success: rawData?.success ?? res.ok, data: { pixel } },
      { status: res.status }
    );
  } catch (error) {
    console.warn("[Pixels Proxy POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create pixel" },
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
    return NextResponse.json({ success: false, error: "Pixel ID is required" }, { status: 400 });
  }

  try {
    const url = new URL(`${WORKER_URL}/api/v1/pixels/${id}`);
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
    console.warn("[Pixels Proxy DELETE] Error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

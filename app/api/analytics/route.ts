import { NextResponse } from "next/server";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

const EMPTY_ANALYTICS = {
  totalClicks: 0,
  uniqueClicks: 0,
  conversions: 0,
  revenue: 0,
  clicksByDay: [],
  countries: [],
  cities: [],
  devices: [],
  browsers: [],
  os: [],
  referrers: [],
  utmSources: [],
  utmMediums: [],
  utmCampaigns: [],
  recentEvents: [],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const linkId = searchParams.get("linkId");
  const period = searchParams.get("period") || "30d";

  try {
    const url = new URL(`${WORKER_URL}/api/v1/analytics`);
    if (userId) url.searchParams.set("userId", userId);
    if (linkId) url.searchParams.set("linkId", linkId);
    url.searchParams.set("period", period);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: EMPTY_ANALYTICS }, {
        headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" }
      });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: res.status,
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" }
    });
  } catch (error) {
    console.warn("[Analytics Proxy GET] Worker offline, returning fallback:", error);
    return NextResponse.json({ success: true, data: EMPTY_ANALYTICS }, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" }
    });
  }
}


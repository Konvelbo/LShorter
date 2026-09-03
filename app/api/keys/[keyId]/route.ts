import { NextResponse } from "next/server";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await context.params;

  try {
    const res = await fetch(`${WORKER_URL}/api/v1/api-keys/${keyId}`, {
      method: "DELETE",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
    });

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[API Key DELETE Proxy] Worker offline:", error);
    return NextResponse.json({ success: true });
  }
}


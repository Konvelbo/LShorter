import { NextResponse } from "next/server";
import { getProtectedLink } from "@/lib/protected-links-store";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

function evaluateTargetUrl(baseTargetUrl: string, req: Request, meta?: any) {
  if (!meta) return baseTargetUrl;
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  const country = (
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    ""
  ).toUpperCase();

  // 1. Device / OS Targeting
  if (meta.deviceTargeting && typeof meta.deviceTargeting === "object") {
    const dt = meta.deviceTargeting;
    if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) {
      if (dt.ios) return dt.ios;
      if (dt.mobile) return dt.mobile;
    } else if (userAgent.includes("android")) {
      if (dt.android) return dt.android;
      if (dt.mobile) return dt.mobile;
    } else if (userAgent.includes("windows")) {
      if (dt.windows) return dt.windows;
      if (dt.desktop) return dt.desktop;
    } else if (userAgent.includes("macintosh") || userAgent.includes("mac os")) {
      if (dt.macos) return dt.macos;
      if (dt.desktop) return dt.desktop;
    } else if (userAgent.includes("linux")) {
      if (dt.linux) return dt.linux;
      if (dt.desktop) return dt.desktop;
    } else if (/mobile|touch/i.test(userAgent)) {
      if (dt.mobile) return dt.mobile;
    } else {
      if (dt.desktop) return dt.desktop;
    }
  }

  // 2. Geo Targeting
  if (country && meta.geoTargeting && typeof meta.geoTargeting === "object") {
    if (meta.geoTargeting[country]) {
      return meta.geoTargeting[country];
    }
  }

  return baseTargetUrl;
}

async function resolveLinkData(slug: string, req: Request) {
  const protectedMeta = getProtectedLink(slug);

  // 1. Check if Worker knows this slug via /r/ redirect (302)
  let workerTargetUrl: string | null = null;
  let isActive = true;

  try {
    const redirectRes = await fetch(`${WORKER_URL}/r/${slug}`, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    });

    if (redirectRes.status === 302) {
      workerTargetUrl = redirectRes.headers.get("location");
    } else if (redirectRes.status === 404 || redirectRes.status === 403) {
      isActive = false;
    }
  } catch (err) {
    console.warn("[Worker Redirect Resolution error]:", err);
  }

  // 2. Also try /api/v1/links
  let linkObj: any = null;
  try {
    const listRes = await fetch(`${WORKER_URL}/api/v1/links`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
      cache: "no-store",
    });

    if (listRes.ok) {
      const listData = await listRes.json();
      const list = Array.isArray(listData?.data) ? listData.data : [];
      linkObj = list.find((l: any) => l.slug?.toLowerCase() === slug.toLowerCase()) || null;
    }
  } catch (err) {
    console.warn("[Worker Links List error]:", err);
  }

  const rawTargetUrl =
    workerTargetUrl ||
    linkObj?.target_url ||
    linkObj?.targetUrl ||
    protectedMeta?.targetUrl ||
    null;

  if (!rawTargetUrl) {
    return null;
  }

  const evaluatedTargetUrl = evaluateTargetUrl(rawTargetUrl, req, protectedMeta || linkObj);

  const password = protectedMeta?.password || linkObj?.password;
  const hasPassword = Boolean(
    password ||
    linkObj?.is_password_protected ||
    linkObj?.isPasswordProtected ||
    linkObj?.has_password
  );

  const isCloaked = Boolean(
    protectedMeta?.isCloaked !== undefined
      ? protectedMeta.isCloaked
      : linkObj?.is_cloaked || linkObj?.isCloaked
  );

  const metaTitle =
    protectedMeta?.metaTitle ||
    linkObj?.meta_title ||
    linkObj?.metaTitle ||
    linkObj?.og_title ||
    slug;

  return {
    id: linkObj?.id || `link_${slug}`,
    slug,
    domainName: linkObj?.domain_name || "lsho.cc",
    isPasswordProtected: hasPassword,
    password: password || undefined,
    isCloaked,
    metaTitle,
    targetUrl: evaluatedTargetUrl,
    isActive,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ success: false, error: "Slug manquant" }, { status: 400 });
  }

  const link = await resolveLinkData(slug, req);
  if (!link) {
    return NextResponse.json({ success: false, error: "Lien introuvable ou expiré" }, { status: 404 });
  }

  if (!link.isActive) {
    return NextResponse.json(
      { success: false, error: "Ce lien a été désactivé par son propriétaire" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: link.id,
      slug: link.slug,
      domainName: link.domainName,
      isPasswordProtected: link.isPasswordProtected,
      isCloaked: link.isCloaked,
      metaTitle: link.metaTitle,
      // TargetUrl is HIDDEN in GET if protected by password
      targetUrl: link.isPasswordProtected ? undefined : link.targetUrl,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ success: false, error: "Slug manquant" }, { status: 400 });
  }

  const link = await resolveLinkData(slug, req);
  if (!link) {
    return NextResponse.json({ success: false, error: "Lien introuvable" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const providedPassword = (body?.password || "").trim();
    const actualPassword = (link.password || "").trim();

    if (!actualPassword || providedPassword === actualPassword) {
      return NextResponse.json({
        success: true,
        targetUrl: link.targetUrl,
        isCloaked: link.isCloaked,
        metaTitle: link.metaTitle,
      });
    }

    return NextResponse.json(
      { success: false, error: "Mot de passe incorrect. Veuillez réessayer." },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}

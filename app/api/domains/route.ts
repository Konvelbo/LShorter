import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

const NXDOMAIN_ERROR_MESSAGE =
  "This domain does not exist on the public DNS network. You must first purchase and register this domain with a domain registrar (e.g., Cloudflare, Namecheap, OVH) before connecting it.";

export function normalizeDomain(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function extractRegistrableRootDomain(domain: string): string {
  const clean = normalizeDomain(domain);
  const parts = clean.split(".").filter(Boolean);
  if (parts.length <= 2) return clean;
  const multiPartTlds = new Set([
    "co.uk",
    "org.uk",
    "ac.uk",
    "gov.uk",
    "com.au",
    "net.au",
    "org.au",
    "co.za",
    "com.br",
    "com.mx",
    "co.jp",
    "co.kr",
    "co.in",
    "com.sg",
    "com.ng",
  ]);
  const lastTwo = parts.slice(-2).join(".");
  if (multiPartTlds.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

export function generateOwnershipToken(domain: string): string {
  const clean = normalizeDomain(domain);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const seed = `lshorter-dns-v1:${clean}`;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= ch + i;
    h2 = Math.imul(h2, 0x5bd1e995) >>> 0;
  }
  return `lsh_${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

export function buildDomainDnsRecords(domain: string) {
  const clean = normalizeDomain(domain);
  const token = generateOwnershipToken(clean);
  return [
    {
      type: "CNAME",
      name: clean,
      value: "cname.lshorter.cc",
      ttl: 3600,
      note: "Point your domain or subdomain to cname.lshorter.cc",
    },
    {
      type: "TXT",
      name: `_lshorter-verify.${clean}`,
      value: `lshorter-verify=${token}`,
      ttl: 3600,
      note: "Domain ownership verification token",
    },
  ];
}

async function queryCloudflareDoH(name: string, type: "SOA" | "NS" | "A" | "TXT" | "CNAME") {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`DoH HTTP ${res.status}`);
  }
  return (await res.json()) as {
    Status: number;
    Answer?: Array<{ name: string; type: number; TTL: number; data: string }>;
    Authority?: Array<{ name: string; type: number; TTL: number; data: string }>;
  };
}

async function verifyDomainExistsOnPublicDns(domain: string): Promise<{
  exists: boolean;
  status: number;
}> {
  const clean = normalizeDomain(domain);
  if (
    !clean ||
    !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(clean)
  ) {
    return { exists: false, status: 3 };
  }

  const rootDomain = extractRegistrableRootDomain(clean);

  const [soaRes, nsRes, aRes] = await Promise.all([
    queryCloudflareDoH(rootDomain, "SOA").catch(() => null),
    queryCloudflareDoH(rootDomain, "NS").catch(() => null),
    queryCloudflareDoH(rootDomain, "A").catch(() => null),
  ]);

  // If any query explicitly returns Status 3 (NXDOMAIN) on the registrable root domain, it is unregistered
  if (
    soaRes?.Status === 3 ||
    nsRes?.Status === 3 ||
    aRes?.Status === 3
  ) {
    return { exists: false, status: 3 };
  }

  const hasNsOrSoaOrA =
    (soaRes?.Status === 0 && ((soaRes.Answer?.length ?? 0) > 0 || (soaRes.Authority?.length ?? 0) > 0)) ||
    (nsRes?.Status === 0 && (nsRes.Answer?.length ?? 0) > 0) ||
    (aRes?.Status === 0 && (aRes.Answer?.length ?? 0) > 0);

  if (!hasNsOrSoaOrA) {
    return { exists: false, status: 3 };
  }

  return { exists: true, status: 0 };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let userId = searchParams.get("userId");

  if (!userId || userId === "undefined" || userId === "null" || userId === "usr_anonymous") {
    const session = await auth().catch(() => null);
    userId = session?.user?.id || null;
  }

  try {
    const url = new URL(`${WORKER_URL}/api/v1/domains`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: [] });
    }

    const data = await res.json();
    // Enrich returned domains with deterministic TXT & CNAME records and ensure status is never auto-verified
    if (Array.isArray(data?.data)) {
      data.data = data.data.map((d: any) => {
        const domName = normalizeDomain(d.domain_name || d.domain || "");
        return {
          ...d,
          domain_name: domName,
          status: d.status === "active" || d.status === "verified" ? d.status : "pending",
          dnsRecords: buildDomainDnsRecords(domName),
        };
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Domains Proxy GET] Worker offline, returning fallback:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawDomain = body.domain || body.domain_name || "";
    const cleanDomain = normalizeDomain(rawDomain);

    if (!cleanDomain) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid domain name." },
        { status: 400 }
      );
    }

    // 1. Live Cloudflare DoH Existence Check (SOA / NS / A on registrable root domain)
    const dnsCheck = await verifyDomainExistsOnPublicDns(cleanDomain);
    if (!dnsCheck.exists || dnsCheck.status === 3) {
      return NextResponse.json(
        {
          success: false,
          code: "NXDOMAIN",
          dnsStatus: 3,
          error: NXDOMAIN_ERROR_MESSAGE,
          message: NXDOMAIN_ERROR_MESSAGE,
        },
        { status: 400 }
      );
    }

    const dnsRecords = buildDomainDnsRecords(cleanDomain);
    const ownershipToken = generateOwnershipToken(cleanDomain);

    // 2. Save domain in backend with status "pending"
    const res = await fetch(`${WORKER_URL}/api/v1/domains`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(body.userId ? { "X-User-Id": body.userId } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        domain: cleanDomain,
        status: "pending",
        ownershipToken,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      return NextResponse.json(
        {
          success: false,
          code: data.code || "PLAN_UPGRADE_REQUIRED",
          error: data.error || data.message || "Domain quota reached for your plan",
        },
        { status: 403 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          code: data.code || "DOMAIN_ERROR",
          error: data.error || data.message || "Failed to add domain",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...(data?.data || {}),
          id: data?.data?.id || `dom_${Date.now()}`,
          domain_name: cleanDomain,
          domain: cleanDomain,
          status: "pending",
          ownershipToken,
          dnsRecords,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.warn("[Domains Proxy POST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify domain on the public DNS network.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!domainId) {
      return NextResponse.json({ success: false, error: "Domain ID is required" }, { status: 400 });
    }

    const url = new URL(`${WORKER_URL}/api/v1/domains/${domainId}`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
    });

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Domains Proxy DELETE] Worker offline:", error);
    return NextResponse.json({ success: true });
  }
}

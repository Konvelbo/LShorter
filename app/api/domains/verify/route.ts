import { NextResponse } from "next/server";
import {
  normalizeDomain,
  generateOwnershipToken,
} from "../route";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

async function queryCloudflareDoH(name: string, type: "TXT" | "CNAME") {
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
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const domainId = body.id || body.domainId || "";
    const userId = body.userId || "";
    const cleanDomain = normalizeDomain(body.domain || body.domain_name || "");

    if (!cleanDomain) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: "pending",
          error: "Domain name is required to verify DNS records.",
        },
        { status: 400 }
      );
    }

    const expectedToken = generateOwnershipToken(cleanDomain);
    const expectedTxtHost = `_lshorter-verify.${cleanDomain}`;
    const expectedTxtValue = `lshorter-verify=${expectedToken}`;
    const legacyTxtValue = domainId ? `lshorter-verify=${domainId}` : null;

    // Query live Cloudflare DoH for TXT (_lshorter-verify.<domain>) and CNAME (<domain>)
    const [txtRes, rootTxtRes, cnameRes] = await Promise.all([
      queryCloudflareDoH(expectedTxtHost, "TXT").catch(() => null),
      queryCloudflareDoH(cleanDomain, "TXT").catch(() => null),
      queryCloudflareDoH(cleanDomain, "CNAME").catch(() => null),
    ]);

    const txtAnswers = [
      ...(txtRes?.Answer || []),
      ...(rootTxtRes?.Answer || []),
    ]
      .filter((a) => a.type === 16)
      .map((a) => String(a.data || "").replace(/^"+|"+$/g, "").trim());

    const cnameAnswers = (cnameRes?.Answer || [])
      .filter((a) => a.type === 5)
      .map((a) =>
        String(a.data || "")
          .trim()
          .toLowerCase()
          .replace(/\.$/, "")
      );

    const txtVerified = txtAnswers.some(
      (val) =>
        val === expectedTxtValue ||
        val.includes(expectedTxtValue) ||
        (legacyTxtValue && (val === legacyTxtValue || val.includes(legacyTxtValue)))
    );

    const cnameVerified = cnameAnswers.some(
      (target) =>
        target.includes("lshorter") ||
        target.includes("lsho.cc") ||
        target.includes("workers.dev")
    );

    const isVerified = txtVerified || cnameVerified;

    if (!isVerified) {
      const missingParts: string[] = [];
      if (!txtVerified) {
        missingParts.push(
          `TXT record missing: host "${expectedTxtHost}" must have value "${expectedTxtValue}" (found: ${
            txtAnswers.length > 0 ? txtAnswers.join(", ") : "none"
          })`
        );
      }
      if (!cnameVerified) {
        missingParts.push(
          `CNAME record missing: host "${cleanDomain}" must point to "cname.lshorter.cc" (found: ${
            cnameAnswers.length > 0 ? cnameAnswers.join(", ") : "none"
          })`
        );
      }

      const diagnosticMessage = `DNS verification failed for ${cleanDomain}. ${missingParts.join(
        " | "
      )}. Please configure these records at your DNS provider and wait for propagation.`;

      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: "pending",
          error: diagnosticMessage,
          message: diagnosticMessage,
          diagnostics: {
            domain: cleanDomain,
            txtHost: expectedTxtHost,
            expectedTxtValue,
            foundTxtValues: txtAnswers,
            txtVerified,
            expectedCnameTarget: "cname.lshorter.cc",
            foundCnameTargets: cnameAnswers,
            cnameVerified,
          },
        },
        { status: 400 }
      );
    }

    // Genuinely present in live DNS — notify backend worker to persist active status
    if (domainId) {
      await fetch(`${WORKER_URL}/api/v1/domains/${domainId}/verify`, {
        method: "POST",
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
          ...(userId ? { "X-User-Id": userId } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: cleanDomain,
          expectedToken,
          verifiedByDoH: true,
        }),
      }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      status: "active",
      message: `DNS verified via Cloudflare DoH! ${
        txtVerified && cnameVerified
          ? "Both TXT ownership and CNAME target records were found."
          : txtVerified
          ? "TXT ownership token verified in live DNS."
          : "CNAME target verified in live DNS."
      }`,
      diagnostics: {
        domain: cleanDomain,
        txtVerified,
        cnameVerified,
        foundTxtValues: txtAnswers,
        foundCnameTargets: cnameAnswers,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        verified: false,
        status: "pending",
        error: err?.message || "Error querying Cloudflare DNS-over-HTTPS.",
      },
      { status: 500 }
    );
  }
}

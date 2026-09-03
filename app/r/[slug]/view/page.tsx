import React from "react";
import { getProtectedLink } from "@/lib/protected-links-store";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

async function getLink(slug: string) {
  const meta = getProtectedLink(slug);
  if (meta?.targetUrl) return meta;

  try {
    const res = await fetch(`${WORKER_URL}/api/v1/links`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    const found = list.find((l: any) => l.slug?.toLowerCase() === slug.toLowerCase());
    if (found) {
      return {
        slug: found.slug,
        targetUrl: found.target_url || found.targetUrl,
        metaTitle: found.meta_title || found.og_title || found.slug,
        isCloaked: true,
      };
    }
  } catch {}
  return null;
}

export default async function CloakedViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await getLink(slug);

  if (!link || !link.targetUrl) {
    notFound();
  }

  const title = link.metaTitle || slug;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0d0d10] flex flex-col z-[9999]">
      <div className="h-10 bg-[#16161a] border-b border-[#26262a] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-white font-medium">/{slug}</span>
          <span className="text-neutral-600">•</span>
          <span className="truncate max-w-xs">{title}</span>
        </div>
        <a
          href={link.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#ff6600] hover:underline"
        >
          <span>Ouvrir la source</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <iframe
        src={link.targetUrl}
        title={title}
        className="w-full flex-1 border-0 bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
      />
    </div>
  );
}

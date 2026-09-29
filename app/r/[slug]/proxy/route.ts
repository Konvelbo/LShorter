import { NextRequest, NextResponse } from "next/server";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

async function resolveLinkConfig(slug: string) {

  try {
    const res = await fetch(
      `${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}`,
      {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      },
    ).catch(() => null);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      const found = json?.data || json;
      if (found && (found.target_url || found.targetUrl)) {
        return {
          slug: found.slug || slug,
          targetUrl: found.target_url || found.targetUrl,
          pathLockMode: found.path_lock_mode || found.pathLockMode || "off",
          pathLockPrefix: found.path_lock_prefix || found.pathLockPrefix || "",
        };
      }
    }

    const listRes = await fetch(`${WORKER_URL}/api/v1/links`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
      cache: "no-store",
    }).catch(() => null);

    if (listRes && listRes.ok) {
      const data = await listRes.json().catch(() => null);
      const list = Array.isArray(data?.data) ? data.data : [];
      const found = list.find(
        (l: any) => l.slug?.toLowerCase() === slug.toLowerCase(),
      );
      if (found) {
        return {
          slug: found.slug,
          targetUrl: found.target_url || found.targetUrl,
          pathLockMode: found.path_lock_mode || found.pathLockMode || "off",
          pathLockPrefix: found.path_lock_prefix || found.pathLockPrefix || "",
        };
      }
    }
  } catch {}

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const config = await resolveLinkConfig(slug);

  if (!config || !config.targetUrl) {
    return new NextResponse("Link not found", { status: 404 });
  }

  const baseTargetUrl = config.targetUrl.startsWith("http")
    ? config.targetUrl
    : `https://${config.targetUrl}`;

  let parsedBase: URL;
  try {
    parsedBase = new URL(baseTargetUrl);
  } catch {
    return new NextResponse("Invalid target URL", { status: 400 });
  }

  // Optional requested sub-URL (for funnel navigation or unlocked developer navigation)
  const requestedUrlParam = req.nextUrl.searchParams.get("url");
  const isUnlockedParam = req.nextUrl.searchParams.get("unlocked") === "1";
  let fetchTargetUrl = baseTargetUrl;

  if (requestedUrlParam) {
    try {
      const candidate = new URL(requestedUrlParam, baseTargetUrl);
      if (candidate.protocol === "http:" || candidate.protocol === "https:") {
        fetchTargetUrl = candidate.href;
      }
    } catch {}
  }

  try {
    const upstreamRes = await fetch(fetchTargetUrl, {
      headers: {
        "User-Agent":
          req.headers.get("user-agent") ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language":
          req.headers.get("accept-language") ||
          "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
      cache: "no-store",
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      const bodyBuffer = await upstreamRes.arrayBuffer();
      return new NextResponse(bodyBuffer, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    let html = await upstreamRes.text();
    const effectiveTarget = new URL(upstreamRes.url || fetchTargetUrl);
    const targetOrigin = effectiveTarget.origin;

    const pathLockConfig = {
      slug: config.slug,
      targetUrl: baseTargetUrl,
      targetOrigin: parsedBase.origin,
      targetPathname: parsedBase.pathname || "/",
      mode: config.pathLockMode || "strict",
      prefix: config.pathLockPrefix || "",
      initialUnlocked: isUnlockedParam,
    };

    const injectedHeadContent = `
<base href="${targetOrigin}/" />
<script>
(function() {
  var CFG = ${JSON.stringify(pathLockConfig)};
  var isUnlocked = Boolean(CFG.initialUnlocked);

  try {
    if (window.sessionStorage && window.sessionStorage.getItem("pathlock_unlocked_" + CFG.slug) === "true") {
      isUnlocked = true;
    }
  } catch (e) {}

  window.addEventListener("message", function(e) {
    if (e.data && typeof e.data === "object") {
      if (e.data.type === "PATHLOCK_UNLOCK") {
        isUnlocked = true;
      } else if (e.data.type === "PATHLOCK_LOCK") {
        isUnlocked = false;
      }
    }
  });

  function normPath(p) {
    return String(p || "/").replace(/^\\/+/, "").replace(/\\/+$/, "");
  }

  var allowedOrigin = CFG.targetOrigin.toLowerCase();
  var baseTargetNorm = normPath(CFG.targetPathname);
  var rawPrefixNorm = normPath(CFG.prefix);
  var effectivePrefixNorm = rawPrefixNorm || baseTargetNorm;

  function checkUrlAllowed(rawUrl) {
    if (isUnlocked || CFG.mode === "off") return { allowed: true, isHashOnly: false };
    if (!rawUrl) return { allowed: true, isHashOnly: false };
    var str = String(rawUrl).trim();
    if (!str || str.indexOf("javascript:") === 0 || str.indexOf("mailto:") === 0 || str.indexOf("tel:") === 0) {
      return { allowed: true, isHashOnly: false };
    }
    if (str.charAt(0) === "#") {
      return { allowed: true, isHashOnly: true, hash: str };
    }

    try {
      var u = new URL(str, CFG.targetUrl);
      if (u.origin.toLowerCase() !== allowedOrigin && u.origin.toLowerCase() !== window.location.origin.toLowerCase()) {
        return { allowed: false, url: u.href };
      }
      var attemptNorm = normPath(u.pathname);
      if (attemptNorm === "r/" + CFG.slug + "/proxy" || attemptNorm === "r/" + CFG.slug + "/view") {
        return { allowed: true, isHashOnly: Boolean(u.hash), hash: u.hash, url: u.href };
      }

      if (CFG.mode === "strict") {
        var strictAllowed = (attemptNorm === effectivePrefixNorm);
        return {
          allowed: strictAllowed,
          isHashOnly: strictAllowed && Boolean(u.hash),
          hash: u.hash,
          url: u.href
        };
      } else if (CFG.mode === "funnel") {
        var funnelAllowed = effectivePrefixNorm
          ? (attemptNorm === effectivePrefixNorm || attemptNorm.indexOf(effectivePrefixNorm + "/") === 0)
          : (attemptNorm === baseTargetNorm);
        return {
          allowed: funnelAllowed,
          isHashOnly: (attemptNorm === baseTargetNorm) && Boolean(u.hash),
          hash: u.hash,
          url: u.href
        };
      }
    } catch (err) {
      return { allowed: false, url: str };
    }
    return { allowed: true, isHashOnly: false };
  }

  function notifyBlocked(blockedUrl) {
    try {
      window.parent.postMessage({
        type: "PATHLOCK_NAVIGATE",
        url: blockedUrl || "/blocked",
        blocked: true
      }, "*");
    } catch (e) {}
  }

  function scrollToHash(hash) {
    if (!hash || hash === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    var id = decodeURIComponent(hash.replace(/^#/, ""));
    var el = document.getElementById(id) || document.querySelector("[name='" + id.replace(/'/g, "") + "']");
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  // 1. Intercept history.pushState & history.replaceState (SPA routers like Next.js / React Router)
  var origPushState = window.history.pushState;
  var origReplaceState = window.history.replaceState;

  window.history.pushState = function(state, title, url) {
    if (url !== undefined && url !== null) {
      var check = checkUrlAllowed(url);
      if (!check.allowed) {
        notifyBlocked(check.url || String(url));
        return;
      }
      if (check.isHashOnly && check.hash) {
        scrollToHash(check.hash);
      }
      try {
        var safeUrl = window.location.pathname + window.location.search + (check.hash || "");
        return origPushState.call(window.history, state, title, safeUrl);
      } catch (e) {
        return;
      }
    }
    return origPushState.apply(window.history, arguments);
  };

  window.history.replaceState = function(state, title, url) {
    if (url !== undefined && url !== null) {
      var check = checkUrlAllowed(url);
      if (!check.allowed) {
        notifyBlocked(check.url || String(url));
        return;
      }
      try {
        var safeUrl = window.location.pathname + window.location.search + (check.hash || "");
        return origReplaceState.call(window.history, state, title, safeUrl);
      } catch (e) {
        return;
      }
    }
    return origReplaceState.apply(window.history, arguments);
  };

  // 2. Intercept clicks on links in capture phase (before React/Next.js or browser navigation)
  window.addEventListener("click", function(e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var anchor = target.closest("a[href]");
    if (!anchor) return;

    var rawHref = anchor.getAttribute("href") || "";
    var check = checkUrlAllowed(rawHref);

    if (!check.allowed) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      notifyBlocked(check.url || rawHref);
      return false;
    }

    if (check.isHashOnly) {
      e.preventDefault();
      e.stopPropagation();
      scrollToHash(check.hash || rawHref);
      return false;
    }

    // Allowed navigation to another page (e.g. unlocked mode or allowed funnel step)
    if (check.url && check.url.indexOf("http") === 0) {
      var targetU = new URL(check.url);
      if (normPath(targetU.pathname) !== baseTargetNorm || targetU.search !== effectiveTargetSearch()) {
        e.preventDefault();
        e.stopPropagation();
        var proxyNext = "/r/" + encodeURIComponent(CFG.slug) + "/proxy?url=" + encodeURIComponent(check.url) + (isUnlocked ? "&unlocked=1" : "");
        window.location.href = proxyNext;
        return false;
      }
    }
  }, true);

  function effectiveTargetSearch() {
    try { return new URL(CFG.targetUrl).search; } catch (e) { return ""; }
  }

  // 3. Intercept form submissions
  window.addEventListener("submit", function(e) {
    var form = e.target;
    if (!form || !form.getAttribute) return;
    var action = form.getAttribute("action") || "";
    if (action) {
      var check = checkUrlAllowed(action);
      if (!check.allowed) {
        e.preventDefault();
        e.stopPropagation();
        notifyBlocked(check.url || action);
        return false;
      }
    }
  }, true);

  // 4. Intercept window.open
  var origOpen = window.open;
  window.open = function(url) {
    if (url) {
      var check = checkUrlAllowed(url);
      if (!check.allowed) {
        notifyBlocked(check.url || String(url));
        return null;
      }
    }
    return origOpen ? origOpen.apply(window, arguments) : null;
  };
})();
</script>`;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${injectedHeadContent}`);
    } else {
      html = `${injectedHeadContent}${html}`;
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err) {
    console.error("[PathLock Proxy Error]:", err);
    return NextResponse.redirect(baseTargetUrl, 307);
  }
}

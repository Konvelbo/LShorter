/**
 * LShorter Production Edge Worker — Cloudflare KV + D1 Hybrid Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * - 0.3ms latency via Cloudflare KV (Cache 100% in-memory)
 * - Negative Lookup Caching (Protects D1 against bots/crawlers)
 * - 0 D1 Queries for redirections, favicon, robots.txt
 * - Automatic Base64 Image Streaming & Universal Social Cards (Twitter, WhatsApp, FB, LinkedIn, Discord)
 * - Full CRUD REST API support (GET, POST, PATCH, PUT, DELETE)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Frontend-Secret, X-User-Id, X-User-Email, X-User-Name, X-User-Plan',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // INSTANT STATIC ROUTES - ZERO D1 QUERIES
    if (path === '/robots.txt') {
      return new Response("User-agent: *\nAllow: /\n\nUser-agent: Twitterbot\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\n\nUser-agent: LinkedInBot\nAllow: /\n", {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (path === '/' || path === '/favicon.ico' || path === '/health') {
      return new Response('LShorter Edge OK', { status: 200, headers: corsHeaders });
    }

    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    const invalidateUserCache = (targetUserId, linkId, targetUserEmail) => {
      if (!env.LINKS_KV) return;
      ctx.waitUntil(
        (async () => {
          try {
            const periods = ['all', '30d', '24h', '7d', '12m', '365d', '1d', 'day', 'week', 'month', 'year'];
            const targetIds = new Set(['all']);
            if (targetUserId) targetIds.add(targetUserId);
            if (targetUserEmail) targetIds.add(targetUserEmail);

            const targetLinks = ['all'];
            if (linkId) targetLinks.push(linkId);

            const keysToDelete = [
              'cache:links_list:all',
            ];
            for (const usr of targetIds) {
              keysToDelete.push(`cache:links_list:${usr}`);
              for (const lnk of targetLinks) {
                for (const p of periods) {
                  keysToDelete.push(`cache:analytics:${usr}:${lnk}:${p}`);
                }
              }
            }
            await Promise.allSettled(keysToDelete.map((k) => env.LINKS_KV.delete(k)));
          } catch {}
        })()
      );
    };

    const getFrontendOrigin = (env, request) => {
      if (env.FRONTEND_URL) return env.FRONTEND_URL;
      const reqHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').toLowerCase();
      if (reqHost.includes('localhost') || reqHost.includes('127.0.0.1')) {
        return `http://${reqHost}`;
      }
      if (reqHost === 'lsho.cc' || reqHost.includes('workers.dev') || !reqHost) {
        return 'https://www.lsho.cc';
      }
      return `https://${reqHost}`;
    };

    // ─── 0. PUBLIC STATIC BRAND ASSET & IMAGE STREAMING ENDPOINTS ──
    if (
      path === '/icon-512.png' ||
      path === '/icon-compact.png' ||
      path === '/icon-192.png' ||
      path === '/logo.png' ||
      path === '/logo-512.png' ||
      path === '/favicon.ico' ||
      path === '/favicon.png' ||
      path === '/apple-touch-icon.png' ||
      path === '/default_banner.jpg' ||
      path.startsWith('/api/og')
    ) {
      try {
        const frontendOrigin = getFrontendOrigin(env, request);
        const upstream = await fetch(`${frontendOrigin}${path}${url.search}`);
        if (upstream.ok) {
          return new Response(upstream.body, {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': upstream.headers.get('content-type') || (path.endsWith('.jpg') ? 'image/jpeg' : 'image/png'),
              'Cache-Control': 'public, max-age=86400, s-maxage=604800',
            },
          });
        }
      } catch (err) {
        console.warn('[Asset Proxy Error]:', err);
      }
      return new Response(null, { status: 404, headers: corsHeaders });
    }

    if (path.startsWith('/api/v1/images/') || path.startsWith('/api/images/')) {
      const filename = path.split('/').pop() || '';
      const slugWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '');

      let link = null;
      if (env.LINKS_KV) {
        try {
          const cached = await env.LINKS_KV.get(slugWithoutExt);
          if (cached && cached !== 'NOT_FOUND') {
            link = JSON.parse(cached);
          }
        } catch {}
      }
      if (!link && env.DB) {
        try {
          link = await env.DB.prepare('SELECT * FROM links WHERE slug = ? OR id = ? LIMIT 1').bind(slugWithoutExt, slugWithoutExt).first();
        } catch {}
      }

      const rawImg = link?.og_image || link?.ogImage || '';
      if (rawImg.startsWith('data:')) {
        const commaIdx = rawImg.indexOf(',');
        const meta = rawImg.substring(0, commaIdx);
        const base64Data = rawImg.substring(commaIdx + 1);
        const mimeMatch = meta.match(/data:([^;,]+)/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';

        try {
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          return new Response(bytes, {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': mime,
              'Cache-Control': (url.searchParams.has('v') || url.searchParams.has('_t') || url.searchParams.has('cb'))
                ? 'no-store, no-cache, max-age=0, must-revalidate'
                : 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
            },
          });
        } catch (decodeErr) {
          console.warn('[Image Decode Error]:', decodeErr);
        }
      } else if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
        return Response.redirect(rawImg, 302);
      }

      const frontendOrigin = getFrontendOrigin(env, request);
      const fallbackTitle = link?.og_title || link?.ogTitle || link?.meta_title || link?.metaTitle || slugWithoutExt;
      return Response.redirect(`${frontendOrigin}/api/og?title=${encodeURIComponent(fallbackTitle)}&slug=${encodeURIComponent(slugWithoutExt)}`, 302);
    }

    // ─── 1. ULTRA-FAST KV REDIRECTION (0.3ms latency) ─────────────────────
    const isApiRoute = path.startsWith('/api/') || path.startsWith('/v1/');
    if (!isApiRoute && path.length > 1) {
      const slug = path.startsWith('/r/') ? path.slice(3) : path.slice(1);
      let link = null;

      if (env.LINKS_KV) {
        try {
          const cached = await env.LINKS_KV.get(slug);
          if (cached && cached !== 'NOT_FOUND') {
            link = JSON.parse(cached);
          }
        } catch (err) {
          console.warn('[KV Read Error]:', err);
        }
      }

      // Fallback to D1 on cache miss
      if (!link && env.DB) {
        try {
          const row = await env.DB.prepare('SELECT * FROM links WHERE id = ? OR LOWER(slug) = LOWER(?) LIMIT 1').bind(slug, slug).first();
          if (row) {
            link = row;
            if (env.LINKS_KV && row.slug) {
              ctx.waitUntil(env.LINKS_KV.put(row.slug, JSON.stringify(row)));
            }
          }
        } catch (err) {
          console.error('[D1 Fallback Error]:', err);
        }
      }

      const reqHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'www.lsho.cc';
      const proto = request.headers.get('x-forwarded-proto') || 'https';

      if (!link) {
        return Response.redirect(`${proto}://${reqHost}/r/${slug}/not-found`, 307);
      }

      if (link.is_active === 0 || link.isActive === false || link.is_active === '0') {
        return Response.redirect(`${proto}://${reqHost}/r/${slug}/paused`, 307);
      }

      const expTime = link.expires_at || link.expiresAt;
      if (expTime && new Date(expTime).getTime() <= Date.now()) {
        return Response.redirect(`${proto}://${reqHost}/r/${slug}/expired`, 307);
      }

      const maxClicks = link.max_clicks !== undefined && link.max_clicks !== null ? Number(link.max_clicks) : link.maxClicks !== undefined && link.maxClicks !== null ? Number(link.maxClicks) : undefined;
      const fallbackUrl = link.fallback_url || link.fallbackUrl;
      const currentClicks = Number(link.clicks_count || link.clicksCount || 0);

      if (maxClicks && maxClicks > 0 && currentClicks >= maxClicks) {
        if (fallbackUrl) {
          const finalFallback = fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://') ? fallbackUrl : `https://${fallbackUrl}`;
          return Response.redirect(finalFallback, 302);
        }
        return Response.redirect(`${proto}://${reqHost}/r/${slug}/expired`, 307);
      }

      const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
      const isBot = /facebookexternalhit|facebot|twitter|xbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|slack-imgbatcher|pinterestbot|skypeuripreview|googlebot|bingbot|applebot|yandexbot|duckduckbot|baiduspider|bytespider|tiktok|ia_archiver|mastodon|bluesky/i.test(userAgent);
      const country = (request.cf?.country || request.headers.get('cf-ipcountry') || request.headers.get('x-country') || 'XX').toUpperCase();

      const ogImage = link.og_image || link.ogImage || '';
      const ogTitle = link.og_title || link.ogTitle || link.meta_title || link.metaTitle || link.title || slug;
      const ogDescription = link.og_description || link.ogDescription || '';
      const isCompact = Boolean(
        link.twitter_card === 'summary' || 
        link.twitterCard === 'summary' || 
        link.banner_style === 'default_banner' || 
        link.bannerStyle === 'default_banner' ||
        link.banner_style === 'summary' ||
        link.bannerStyle === 'summary'
      ) && !(
        link.twitter_card === 'summary_large_image' ||
        link.twitterCard === 'summary_large_image'
      );
      const twitterCard = isCompact ? 'summary' : 'summary_large_image';

      // Serve OpenGraph / Twitter Cards ONLY for social crawler bots without redirecting
      if (isBot) {
        const reqHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
        const domain = (reqHost && !reqHost.includes('workers.dev')) ? reqHost : 'lsho.cc';
        const searchStr = url.search || '';
        const canonical = `https://${domain}/${slug}${searchStr}`;
        const dest = link.target_url || link.targetUrl || `https://${domain}`;

        // Convert data:image or relative image to public HTTPS URL so Twitter/FB crawlers can load it
        let publicImageUrl = ogImage;
        if (ogImage && ogImage.startsWith('data:')) {
          publicImageUrl = `https://${domain}/api/v1/images/${slug}.jpg`;
        } else if (ogImage && ogImage.includes('.workers.dev/api/v1/images/')) {
          const filename = ogImage.split('/').pop();
          publicImageUrl = `https://${domain}/api/v1/images/${filename}`;
        } else if (ogImage && !ogImage.startsWith('http://') && !ogImage.startsWith('https://')) {
          if (ogImage.startsWith('/')) {
            publicImageUrl = `https://${domain}${ogImage}`;
          } else {
            publicImageUrl = `https://${domain}/api/v1/images/${ogImage}`;
          }
        }

        const isCustomBanner = Boolean(
          publicImageUrl &&
          !publicImageUrl.includes('/api/og') &&
          !publicImageUrl.includes('default_banner') &&
          !publicImageUrl.includes('.svg') &&
          !publicImageUrl.includes('dicebear')
        );

        let finalImg = '';
        if (isCompact) {
          if (isCustomBanner) {
            finalImg = `https://${domain}/api/og?card=summary&img=${encodeURIComponent(publicImageUrl)}&title=${encodeURIComponent(ogTitle.substring(0, 60))}&slug=${encodeURIComponent(slug)}`;
          } else {
            finalImg = `https://${domain}/api/og?card=summary&title=${encodeURIComponent(ogTitle.substring(0, 60))}&desc=${encodeURIComponent((ogDescription || '').substring(0, 80))}&slug=${encodeURIComponent(slug)}`;
          }
        } else {
          if (isCustomBanner) {
            finalImg = publicImageUrl;
          } else {
            finalImg = `https://${domain}/api/og?title=${encodeURIComponent(ogTitle.substring(0, 80))}&slug=${encodeURIComponent(slug)}`;
          }
        }

        const cacheBusterParam = url.searchParams.get('v') || url.searchParams.get('_t') || url.searchParams.get('cb');
        if (cacheBusterParam) {
          const sep = (u) => (u.includes('?') ? '&' : '?');
          if (!finalImg.includes('v=') && !finalImg.includes('_t=') && !finalImg.startsWith('data:')) {
            finalImg += `${sep(finalImg)}v=${encodeURIComponent(cacheBusterParam)}`;
          }
        }

        const escapeHtml = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const escapeMetaUrl = (s = '') => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeTitle = escapeHtml(ogTitle);
        const safeDesc = escapeHtml(ogDescription || 'Cliquez pour ouvrir le lien.');
        const safeImg = escapeMetaUrl(finalImg);
        const safeCanonical = escapeHtml(canonical);
        const safeCard = twitterCard;
        const imgWidth = isCompact ? '400' : '1200';
        const imgHeight = isCompact ? '400' : '630';
        const imgType = (safeImg.includes('.png') || safeImg.includes('/api/og')) ? 'image/png' : safeImg.includes('.webp') ? 'image/webp' : 'image/jpeg';

        const html = `<!DOCTYPE html>
<html lang="fr" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="theme-color" content="#ff6600" />
  <meta name="robots" content="index, follow, max-image-preview:large" />

  <!-- Canonical URL -->
  <link rel="canonical" href="${safeCanonical}" />

  <!-- Open Graph / WhatsApp / Facebook / LinkedIn / Telegram / Slack / Discord -->
  <meta property="og:site_name" content="LShorter" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImg}" />
  <meta property="og:image:url" content="${safeImg}" />
  <meta property="og:image:secure_url" content="${safeImg}" />
  <meta property="og:image:type" content="${imgType}" />
  <meta property="og:image:width" content="${imgWidth}" />
  <meta property="og:image:height" content="${imgHeight}" />
  <meta property="og:image:alt" content="${safeTitle}" />

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="${safeCard}" />
  <meta name="twitter:site" content="@LShorter" />
  <meta name="twitter:creator" content="@LShorter" />
  <meta name="twitter:domain" content="${domain}" />
  <meta name="twitter:url" content="${safeCanonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImg}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />
  <meta name="twitter:image:width" content="${imgWidth}" />
  <meta name="twitter:image:height" content="${imgHeight}" />
</head>
<body style="background:#09090b;">
</body>
</html>`;

        const hasCacheBuster =
          url.searchParams.has('v') ||
          url.searchParams.has('_t') ||
          url.searchParams.has('cb') ||
          url.searchParams.has('nocache') ||
          url.searchParams.has('preview');

        return new Response(html, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': hasCacheBuster
              ? 'no-store, no-cache, max-age=0, must-revalidate'
              : 'public, max-age=10, s-maxage=30, stale-while-revalidate=60',
          },
        });
      }

      // Real human visitors: enforce password protection and cloaking
      if (link.password || link.has_password || link.is_password_protected) {
        return Response.redirect(`${proto}://${reqHost}/r/${slug}/gate`, 307);
      }

      if (link.is_cloaked || link.isCloaked) {
        return Response.redirect(`${proto}://${reqHost}/r/${slug}/view`, 307);
      }

      const REGION_COUNTRIES = {
        europe: [
          "FR", "DE", "GB", "ES", "IT", "BE", "CH", "PT", "NL", "SE",
          "NO", "DK", "FI", "IE", "AT", "PL", "GR", "RO", "CZ", "HU", "LU",
          "MC", "IS", "HR", "RS", "BG", "SK", "SI", "LT", "LV", "EE", "CY", "MT", "UA", "RU", "TR", "GE", "AM", "AZ"
        ],
        west_africa: [
          "SN", "CI", "BF", "ML", "GN", "TG", "BJ", "NE", "NG", "GH",
          "CV", "GM", "GW", "LR", "SL", "MR"
        ],
        central_africa: [
          "CM", "GA", "CG", "CD", "TD", "CF", "GQ", "ST", "BI", "RW"
        ],
        north_africa: [
          "MA", "DZ", "TN", "EG", "LY", "SD", "MR"
        ],
        east_africa: [
          "KE", "UG", "TZ", "RW", "BI", "ET", "SO", "DJ", "ER", "SS", "MG", "MU", "SC", "KM"
        ],
        southern_africa: [
          "ZA", "AO", "MZ", "ZM", "ZW", "BW", "NA", "LS", "SZ", "MW"
        ],
        africa: [
          "BF", "CI", "SN", "CM", "ML", "NE", "TG", "BJ", "GH", "NG", "GN", "GA", "CD", "CG", "TD", "CF", "RW", "BI", "KE", "TZ", "UG", "ET", "MG", "ZA", "MA", "DZ", "TN", "EG", "AO", "MZ", "ZM", "ZW", "MR", "GW", "SL", "LR", "CV", "ST", "GQ", "SO", "DJ", "ER", "SS", "SD", "LY", "MW", "BW", "NA", "LS", "SZ", "KM", "SC", "MU"
        ],
        north_america: [
          "US", "CA", "MX", "HT", "DO", "CU", "PA", "CR", "JM"
        ],
        south_america: [
          "BR", "AR", "CO", "CL", "PE", "VE", "EC", "BO", "PY", "UY"
        ],
        asia: [
          "CN", "JP", "KR", "IN", "SG", "TH", "VN", "ID", "MY", "PH",
          "PK", "BD", "AE", "SA", "QA", "KW", "OM", "BH", "JO", "LB", "IQ", "IL", "LK", "KZ", "UZ", "TM", "KG", "TJ", "AF", "YE"
        ],
        middle_east: [
          "AE", "SA", "QA", "KW", "OM", "BH", "IL", "JO", "LB", "IQ", "YE", "TR", "IR", "SY"
        ],
        oceania: [
          "AU", "NZ", "FJ", "PG", "NC", "PF"
        ],
      };

      let routingRules = [];
      if (link.routing_rules) {
        try {
          routingRules = typeof link.routing_rules === "string" ? JSON.parse(link.routing_rules) : link.routing_rules;
        } catch {}
      } else if (link.routingRules) {
        try {
          routingRules = typeof link.routingRules === "string" ? JSON.parse(link.routingRules) : link.routingRules;
        } catch {}
      }
      if (!Array.isArray(routingRules)) routingRules = [];

      let deviceTargeting = {};
      if (link.device_targeting) {
        try {
          deviceTargeting = typeof link.device_targeting === 'string' ? JSON.parse(link.device_targeting) : link.device_targeting;
        } catch {}
      } else if (link.deviceTargeting) {
        deviceTargeting = link.deviceTargeting;
      }

      let geoTargeting = {};
      if (link.geo_targeting) {
        try {
          geoTargeting = typeof link.geo_targeting === 'string' ? JSON.parse(link.geo_targeting) : link.geo_targeting;
        } catch {}
      } else if (link.geoTargeting) {
        geoTargeting = link.geoTargeting;
      }

      const isAndroid = userAgent.includes('android');
      const isIos = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod');
      const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);
      const isMobile = isAndroid || isIos || userAgent.includes('mobile');
      const isDesktop = !isMobile && (userAgent.includes('windows') || userAgent.includes('macintosh') || userAgent.includes('linux'));
      const deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');

      let osType = 'other';
      if (isIos) osType = 'ios';
      else if (isAndroid) osType = 'android';
      else if (userAgent.includes('windows')) osType = 'windows';
      else if (userAgent.includes('macintosh') || userAgent.includes('mac os')) osType = 'macos';
      else if (userAgent.includes('linux')) osType = 'linux';

      let targetUrl = link.target_url || link.targetUrl || 'https://lshorter.com';

      // ─── 1. Evaluate Multi-Condition Structured Routing Rules (AND Logic) ───
      let ruleMatchedUrl = null;
      if (Array.isArray(routingRules) && routingRules.length > 0) {
        for (const rule of routingRules) {
          if (!rule) continue;
          const dest = rule.destinationUrl || rule.destination_url || rule.url;
          if (!dest) continue;
          const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
          if (conditions.length === 0) continue;

          let allConditionsMet = true;
          for (const cond of conditions) {
            if (!cond || !cond.type || !cond.value) continue;
            const val = String(cond.value).trim().toLowerCase();
            const op = cond.operator || 'est';
            let isMet = false;

            if (cond.type === 'pays') {
              const match = country.toLowerCase() === val;
              isMet = op === 'est' ? match : !match;
            } else if (cond.type === 'region') {
              const list = REGION_COUNTRIES[val] || [];
              const match = list.includes(country);
              isMet = op === 'est' ? match : !match;
            } else if (cond.type === 'appareil') {
              let match = deviceType === val || (val === 'mobile' && (isMobile || isTablet));
              if (!match && (val === 'ios' || val === 'android' || val === 'windows' || val === 'macos' || val === 'linux')) {
                match = osType === val || (val === 'macos' && osType === 'mac');
              }
              isMet = op === 'est' ? match : !match;
            } else if (cond.type === 'plateforme') {
              let match = osType === val || (val === 'mac' && osType === 'macos') || (val === 'macos' && osType === 'mac');
              if (!match && (val === 'mobile' || val === 'desktop' || val === 'tablet')) {
                match = deviceType === val || (val === 'mobile' && (isMobile || isTablet));
              }
              isMet = op === 'est' ? match : !match;
            } else {
              isMet = true;
            }

            if (!isMet) {
              allConditionsMet = false;
              break;
            }
          }

          if (allConditionsMet) {
            ruleMatchedUrl = dest.startsWith('http://') || dest.startsWith('https://') ? dest : `https://${dest}`;
            break;
          }
        }
      }

      if (ruleMatchedUrl) {
        targetUrl = ruleMatchedUrl;
      } else if (!routingRules || (Array.isArray(routingRules) && routingRules.length === 0)) {
        if (isAndroid && deviceTargeting.android) {
          targetUrl = deviceTargeting.android;
        } else if (isIos && (deviceTargeting.ios || deviceTargeting.iphone || deviceTargeting.ipad)) {
          targetUrl = deviceTargeting.ios || deviceTargeting.iphone || deviceTargeting.ipad;
        } else if (isMobile && deviceTargeting.mobile) {
          targetUrl = deviceTargeting.mobile;
        } else if (isDesktop && (deviceTargeting.desktop || (userAgent.includes('windows') && deviceTargeting.windows) || (userAgent.includes('mac') && deviceTargeting.macos))) {
          targetUrl = (userAgent.includes('windows') && deviceTargeting.windows) || (userAgent.includes('mac') && deviceTargeting.macos) || deviceTargeting.desktop;
        } else if (geoTargeting[country]) {
          targetUrl = geoTargeting[country];
        }
      }

      const configuredSecret = env.FRONTEND_API_SECRET || env.SECRET || '';
      const isInternalProbe = request.headers.get('x-internal-probe') === '1' || request.headers.get('x-crawler-prewarm') === '1' || (Boolean(configuredSecret) && request.headers.get('x-frontend-secret') === configuredSecret);
      const isPrefetch = (request.headers.get('purpose') || request.headers.get('sec-purpose') || request.headers.get('x-purpose') || request.headers.get('x-moz') || '').includes('prefetch') || (request.headers.get('purpose') || '').includes('preview');

      if (env.DB && !isInternalProbe && !isPrefetch && !isBot) {
        ctx.waitUntil(
          (async () => {
            try {
              await env.DB.prepare('UPDATE links SET clicks_count = clicks_count + 1 WHERE (slug = ? OR id = ?) AND (max_clicks IS NULL OR max_clicks = 0 OR clicks_count < max_clicks)').bind(slug, slug).run();
              if (env.LINKS_KV) {
                try {
                  const updatedLink = {
                    ...link,
                    clicks_count: Number(link.clicks_count || 0) + 1,
                    clicksCount: Number(link.clicksCount || link.clicks_count || 0) + 1,
                  };
                  await env.LINKS_KV.put(slug, JSON.stringify(updatedLink));
                  if (link.id && link.id !== slug) {
                    await env.LINKS_KV.put(link.id, JSON.stringify(updatedLink));
                  }
                } catch {}
              }
              const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
              const ipHash = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';

              let detectedCity = request?.cf?.city || request?.headers?.get('cf-ipcity') || request?.headers?.get('x-city') || (country === 'BF' ? 'Ouagadougou' : 'Inconnue');
              let rawRef = request.headers.get('referer') || request.headers.get('referrer') || '';
              let detectedRef = 'Direct';
              if (rawRef) {
                try {
                  const u = new URL(rawRef);
                  detectedRef = u.hostname.replace(/^www\./, '');
                } catch {
                  detectedRef = rawRef.slice(0, 50);
                }
              }

              let detectedBrowser = 'Other';
              if (userAgent.includes('edg/')) detectedBrowser = 'Edge';
              else if (userAgent.includes('opr/') || userAgent.includes('opera')) detectedBrowser = 'Opera';
              else if (userAgent.includes('chrome') || userAgent.includes('crios')) detectedBrowser = 'Chrome';
              else if (userAgent.includes('firefox') || userAgent.includes('fxios')) detectedBrowser = 'Firefox';
              else if (userAgent.includes('safari')) detectedBrowser = 'Safari';

              let detectedOS = 'Other';
              if (isIos) detectedOS = 'iOS';
              else if (isAndroid) detectedOS = 'Android';
              else if (userAgent.includes('windows')) detectedOS = 'Windows';
              else if (userAgent.includes('macintosh') || userAgent.includes('mac os')) detectedOS = 'macOS';
              else if (userAgent.includes('linux')) detectedOS = 'Linux';

              await env.DB.prepare(`
                INSERT INTO click_events (id, user_id, link_id, slug, ip_masked, country_code, city, device, browser, os, referrer, resolved_url, is_unique, conversion_amount, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'))
              `).bind(
                eventId,
                link.user_id || link.userId || 'usr_default',
                link.id || slug,
                slug,
                ipHash,
                country,
                detectedCity,
                deviceType,
                detectedBrowser,
                detectedOS,
                detectedRef,
                targetUrl
              ).run().catch((err) => {
                console.warn('[Async Click Insert Warning]:', err);
              });
              const clickUserId = link.user_id || link.userId;
              const clickUserEmail = link.user_email || link.userEmail;
              if (clickUserId || clickUserEmail) {
                invalidateUserCache(clickUserId, link.id || slug, clickUserEmail);
              }
            } catch (err) {
              console.warn('[Async Click Error]:', err);
            }
          })()
        );
      }

      return Response.redirect(targetUrl, 302);
    }

    // ─── AUTHENTICATION & SECRET VERIFICATION FOR PRIVATE MANAGEMENT ENDPOINTS ───
    const frontendSecretHeader = request.headers.get('x-frontend-secret') || '';
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const configuredSecret = env.FRONTEND_API_SECRET || env.SECRET || 'lsh_secret_live_prod_2026';
    const isAuthorized =
      (Boolean(frontendSecretHeader) && frontendSecretHeader === configuredSecret) ||
      (Boolean(bearerToken) && bearerToken === configuredSecret);

    const requireAuth = () => {
      if (!isAuthorized) {
        return jsonResponse(
          { success: false, error: 'Unauthorized: Missing or invalid X-Frontend-Secret' },
          401
        );
      }
      return null;
    };

    // ─── 2. LINKS API (CRUD: GET, POST, PATCH, PUT, DELETE, CLICK) ───────────────
    const isLinksRoute =
      path === '/api/v1/links' ||
      path === '/api/links' ||
      path.startsWith('/api/v1/links/') ||
      path.startsWith('/api/links/');

    if (isLinksRoute) {
      const linkIdOrSlug = path.startsWith('/api/v1/links/')
        ? path.slice('/api/v1/links/'.length)
        : path.startsWith('/api/links/')
        ? path.slice('/api/links/'.length)
        : null;

      // POST /api/v1/links/:slug/click or /api/links/:slug/click (Increment click counter)
      if (method === 'POST' && (path.endsWith('/click') || linkIdOrSlug?.includes('/click'))) {
        const targetSlugOrId = (linkIdOrSlug || '').replace(/\/click$/, '');
        let clickBody = {};
        try {
          clickBody = await request.json();
        } catch {}

        const userAgentHeader = (request.headers.get('user-agent') || '').toLowerCase();
        let detectedDev = 'other';
        if (/ipad|tablet/i.test(userAgentHeader)) detectedDev = 'tablet';
        else if (/mobile|android|iphone/i.test(userAgentHeader)) detectedDev = 'mobile';
        else if (userAgentHeader.includes('windows') || userAgentHeader.includes('macintosh') || userAgentHeader.includes('linux')) detectedDev = 'desktop';

        let detectedBr = 'Other';
        if (userAgentHeader.includes('edg/')) detectedBr = 'Edge';
        else if (userAgentHeader.includes('opr/') || userAgentHeader.includes('opera')) detectedBr = 'Opera';
        else if (userAgentHeader.includes('chrome') || userAgentHeader.includes('crios')) detectedBr = 'Chrome';
        else if (userAgentHeader.includes('firefox') || userAgentHeader.includes('fxios')) detectedBr = 'Firefox';
        else if (userAgentHeader.includes('safari')) detectedBr = 'Safari';

        let detectedSys = 'Other';
        if (/iphone|ipad|ipod|ios/i.test(userAgentHeader)) detectedSys = 'iOS';
        else if (/android/i.test(userAgentHeader)) detectedSys = 'Android';
        else if (/windows/i.test(userAgentHeader)) detectedSys = 'Windows';
        else if (/macintosh|mac os/i.test(userAgentHeader)) detectedSys = 'macOS';
        else if (/linux/i.test(userAgentHeader)) detectedSys = 'Linux';

        const rawCountry = (clickBody.country && clickBody.country !== 'XX' ? clickBody.country : request.cf?.country || request.headers.get('cf-ipcountry') || request.headers.get('x-country') || 'XX').toUpperCase();
        const country = rawCountry;
        const rawCity = (clickBody.city && clickBody.city !== 'Inconnue' && clickBody.city !== '—' && clickBody.city !== '' ? clickBody.city : request.cf?.city || request.headers.get('cf-ipcity') || request.headers.get('x-city') || (country === 'BF' ? 'Ouagadougou' : 'Inconnue'));
        const city = rawCity;
        const device = clickBody.device || request.headers.get('x-device') || detectedDev;
        const browser = clickBody.browser || request.headers.get('x-browser') || detectedBr;
        const os = clickBody.os || request.headers.get('x-os') || detectedSys;
        const referrer = clickBody.referrer || request.headers.get('x-referrer') || 'Direct';
        const ipHash = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
        const customerEmail = clickBody.customer?.email || clickBody.customerEmail || clickBody.customer_email || clickBody.email || request.headers.get('x-customer-email') || null;
        const customerName = clickBody.customer?.name || clickBody.customerName || clickBody.customer_name || clickBody.customerFullName || clickBody.fullName || clickBody.name || request.headers.get('x-customer-name') || null;
        const conversionAmount = Number(clickBody.amount || clickBody.conversionAmount || clickBody.revenue || 0);

        if (env.DB && targetSlugOrId) {
          ctx.waitUntil(
            (async () => {
              try {
                // 1. Increment clicks_count only if below max_clicks
                await env.DB.prepare(`
                  UPDATE links 
                  SET clicks_count = clicks_count + 1 
                  WHERE (slug = ? OR id = ?) 
                    AND (max_clicks IS NULL OR max_clicks = 0 OR clicks_count < max_clicks)
                `).bind(targetSlugOrId, targetSlugOrId).run().catch(async () => {
                  await env.DB.prepare('UPDATE links SET clicks_count = clicks_count + 1 WHERE slug = ? OR id = ?').bind(targetSlugOrId, targetSlugOrId).run();
                });

                // 2. Insert event for analytics & unique clicks calculation
                const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
                try {
                  const linkRow = await env.DB.prepare('SELECT id, user_id, target_url, slug FROM links WHERE LOWER(slug) = LOWER(?) OR id = ? LIMIT 1').bind(targetSlugOrId, targetSlugOrId).first().catch(() => null);
                  await env.DB.prepare(`
                    INSERT INTO click_events (id, user_id, link_id, slug, ip_masked, country_code, city, device, browser, os, referrer, resolved_url, is_unique, conversion_amount, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
                  `).bind(
                    eventId,
                    linkRow?.user_id || request.headers.get('x-user-id') || 'usr_default',
                    linkRow?.id || targetSlugOrId,
                    linkRow?.slug || targetSlugOrId,
                    ipHash,
                    country,
                    city,
                    device,
                    browser,
                    os,
                    referrer,
                    linkRow?.target_url || 'https://lsho.cc',
                    conversionAmount
                  ).run().catch((e) => console.warn('[Click Insert Warning]:', e));
                  if (linkRow?.user_id) {
                    invalidateUserCache(linkRow.user_id, linkRow?.id || targetSlugOrId);
                  }
                } catch (insErr) {
                  console.warn('[D1 Click Processing Error]:', insErr);
                }
              } catch (dbErr) {
                console.warn('[D1 Click Processing Error]:', dbErr);
              }
            })()
          );
        }
        if (env.LINKS_KV && targetSlugOrId) {
          ctx.waitUntil(
            (async () => {
              try {
                const cached = await env.LINKS_KV.get(targetSlugOrId);
                if (cached && cached !== 'NOT_FOUND') {
                  const obj = JSON.parse(cached);
                  const maxC = obj.max_clicks || obj.maxClicks;
                  const currentC = obj.clicks_count || 0;
                  if (!maxC || maxC <= 0 || currentC < maxC) {
                    obj.clicks_count = currentC + 1;
                    await env.LINKS_KV.put(targetSlugOrId, JSON.stringify(obj));
                  }
                }
              } catch {}
            })()
          );
        }
        return jsonResponse({ success: true, countIncremented: true });
      }

      // Enforce auth on all link management operations
      const authErr = requireAuth();
      if (authErr) return authErr;

      // GET /api/v1/links OR /api/v1/links/:id
      if (method === 'GET') {
        if (!linkIdOrSlug) {
          const userId = url.searchParams.get('userId') || request.headers.get('x-user-id');
          if (!userId || userId === 'all') {
            return jsonResponse({ success: true, data: [] });
          }
          if (!env.DB) return jsonResponse({ success: true, data: [] });

          const userEmail = url.searchParams.get('userEmail') || request.headers.get('x-user-email') || '';
          const isLinksForceRefresh = url.searchParams.get('forceRefresh') === 'true' || Boolean(url.searchParams.get('_t'));
          const linksCacheKey = `cache:links_list:${userId}`;
          if (env.LINKS_KV && isLinksForceRefresh) {
            try {
              await env.LINKS_KV.delete(linksCacheKey);
            } catch {}
          } else if (env.LINKS_KV && !isLinksForceRefresh) {
            try {
              const cached = await env.LINKS_KV.get(linksCacheKey);
              if (cached) {
                return new Response(cached, {
                  headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json; charset=utf-8',
                    'X-Edge-Cache': 'HIT',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                  },
                });
              }
            } catch {}
          }

          try {
            if (userId && userId !== 'all') {
              try {
                await env.DB.prepare("UPDATE links SET user_id = ? WHERE user_id = 'usr_default'").bind(userId).run();
                await env.DB.prepare("UPDATE click_events SET user_id = ? WHERE user_id = 'usr_default'").bind(userId).run();
              } catch {}
            }

            let query = `
              SELECT links.*, users.email AS user_email, users.name AS user_name 
              FROM links 
              LEFT JOIN users ON links.user_id = users.id
            `;
            const params = [];
            if (userId && userId !== 'all') {
              query += ' WHERE (links.user_id = ? OR (? != "" AND links.user_id = ?) OR (? != "" AND links.user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?))))';
              params.push(userId, userEmail, userEmail, userEmail, userEmail);
            }
            query += ' ORDER BY links.created_at DESC LIMIT 500';
            let results = [];
            try {
              const r = await env.DB.prepare(query).bind(...params).all();
              results = r?.results || [];
            } catch {
              let fbQuery = 'SELECT * FROM links';
              const fbParams = [];
              if (userId && userId !== 'all') {
                fbQuery += ' WHERE (user_id = ? OR (? != "" AND user_id = ?) OR (? != "" AND user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?))))';
                fbParams.push(userId, userEmail, userEmail, userEmail, userEmail);
              }
              fbQuery += ' ORDER BY created_at DESC LIMIT 500';
              const fb = await env.DB.prepare(fbQuery).bind(...fbParams).all();
              results = fb?.results || [];
            }
            const payload = JSON.stringify({ success: true, data: results });
            if (env.LINKS_KV) {
              ctx.waitUntil(
                env.LINKS_KV.put(linksCacheKey, payload, { expirationTtl: 60 }).catch(() => {})
              );
            }
            return new Response(payload, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json; charset=utf-8',
                'X-Edge-Cache': 'MISS',
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              },
            });
          } catch (err) {
            return jsonResponse({ success: true, data: [] });
          }
        } else {
          if (env.LINKS_KV) {
            try {
              let cached = await env.LINKS_KV.get(linkIdOrSlug);
              if (!cached && linkIdOrSlug) cached = await env.LINKS_KV.get(linkIdOrSlug.toLowerCase());
              if (cached && cached !== 'NOT_FOUND') {
                return jsonResponse({ success: true, data: JSON.parse(cached) });
              }
            } catch {}
          }
          if (env.DB) {
            try {
              const row = await env.DB.prepare('SELECT * FROM links WHERE id = ? OR LOWER(slug) = LOWER(?) LIMIT 1').bind(linkIdOrSlug, linkIdOrSlug).first();
              if (row) {
                if (env.LINKS_KV && row.slug) {
                  ctx.waitUntil(env.LINKS_KV.put(row.slug, JSON.stringify(row)));
                }
                return jsonResponse({ success: true, data: row });
              }
            } catch {}
          }
          return jsonResponse({ success: false, error: 'Link not found' }, 404);
        }
      }

      // POST /api/v1/links (Create)
      if (method === 'POST') {
        const sanitizeError = (err) => {
          const msg = String(err?.message || err || '');
          const lower = msg.toLowerCase();
          if (lower.includes('idx_links_slug') || lower.includes('links.slug') || (lower.includes('unique') && lower.includes('slug'))) {
            return 'Ce slug personnalisé est déjà utilisé. Veuillez en choisir un autre.';
          }
          if (lower.includes('foreign key') || lower.includes('sqlite_constraint_foreignkey')) {
            return 'Erreur de synchronisation du compte utilisateur. Veuillez réessayer.';
          }
          if (lower.includes('d1_error') || lower.includes('sqlite') || lower.includes('syntax error')) {
            return 'Une erreur interne est survenue lors de la création du lien. Veuillez réessayer.';
          }
          return msg || 'Une erreur est survenue.';
        };

        try {
          const body = await request.json();
          const id = body.id || ('link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
          const slug = (body.slug || Math.random().toString(36).substring(2, 8)).trim();
          const userId = body.userId || body.user_id || request.headers.get('x-user-id') || 'usr_default';
          const userEmail = body.userEmail || body.user_email || request.headers.get('x-user-email') || '';
          const userName = body.userName || body.user_name || request.headers.get('x-user-name') || 'Utilisateur';
          const domainName = body.domainName || body.domain_name || 'lsho.cc';
          const shortUrl = 'https://' + domainName + '/' + slug;
          const targetUrl = body.targetUrl || body.target_url;
          const isActive = body.isActive !== false && body.is_active !== 0 ? 1 : 0;
          const rawRules = body.routingRules !== undefined ? body.routingRules : body.routing_rules;
          const routingRules = typeof rawRules === 'string' ? rawRules : JSON.stringify(rawRules || []);
          const rawGeo = body.geoTargeting !== undefined ? body.geoTargeting : body.geo_targeting;
          const geoTargeting = typeof rawGeo === 'string' ? rawGeo : JSON.stringify(rawGeo || {});
          const rawDev = body.deviceTargeting !== undefined ? body.deviceTargeting : body.device_targeting;
          const deviceTargeting = typeof rawDev === 'string' ? rawDev : JSON.stringify(rawDev || {});
          const ogImage = body.ogImage || body.og_image || '';
          const ogTitle = body.ogTitle || body.og_title || body.metaTitle || body.meta_title || '';
          const ogDescription = body.ogDescription || body.og_description || '';
          const metaTitle = body.metaTitle || body.meta_title || ogTitle || slug;
          const rawBannerStyle = body.banner_style || body.bannerStyle || '';
          const rawTwitterCard = body.twitter_card || body.twitterCard || '';
          const isLarge = Boolean(
            rawTwitterCard === 'summary_large_image' ||
            rawBannerStyle === 'large_banner' ||
            rawBannerStyle === 'summary_large_image'
          );
          const isCompact = Boolean(
            !isLarge && (
              rawTwitterCard === 'summary' ||
              rawBannerStyle === 'default_banner' ||
              rawBannerStyle === 'summary'
            )
          );
          const resolvedTwitterCard = isCompact ? 'summary' : 'summary_large_image';
          const resolvedBannerStyle = isCompact ? 'default_banner' : 'large_banner';

          const rawTags = body.tags !== undefined ? body.tags : [];
          let parsedTags = [];
          if (Array.isArray(rawTags)) {
            parsedTags = rawTags.map((t) => String(t).trim()).filter(Boolean);
          } else if (typeof rawTags === 'string') {
            try {
              const p = JSON.parse(rawTags);
              parsedTags = Array.isArray(p) ? p.map((t) => String(t).trim()).filter(Boolean) : [rawTags.trim()].filter(Boolean);
            } catch {
              parsedTags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
            }
          }
          const tagsJson = JSON.stringify(parsedTags);
          const rawPixels = body.pixels || body.pixel_ids || body.pixelIds || [];
          const parsedPixels = Array.isArray(rawPixels) ? rawPixels : [];

          const isCloaked = Boolean(body.isCloaked || body.is_cloaked);
          const rawPassword = body.password ? String(body.password).trim() : null;
          const pathLockMode = body.pathLockMode || body.path_lock_mode || 'off';
          const pathLockPrefix = body.pathLockPrefix !== undefined ? body.pathLockPrefix : (body.path_lock_prefix !== undefined ? body.path_lock_prefix : null);
          const pathLockMessage = body.pathLockMessage !== undefined ? body.pathLockMessage : (body.path_lock_message !== undefined ? body.path_lock_message : null);
          const pathLockPassword = body.pathLockPassword !== undefined ? body.pathLockPassword : (body.path_lock_password !== undefined ? body.path_lock_password : null);
          const expiresAt = body.expiresAt || body.expires_at || null;
          const maxClicks = body.maxClicks !== undefined ? body.maxClicks : (body.max_clicks !== undefined ? body.max_clicks : null);
          const fallbackUrl = body.fallbackUrl || body.fallback_url || null;

          const linkObj = {
            id,
            user_id: userId,
            domain_name: domainName,
            slug,
            short_url: shortUrl,
            target_url: targetUrl,
            clicks_count: 0,
            is_active: isActive,
            routing_rules: routingRules,
            geo_targeting: geoTargeting,
            device_targeting: deviceTargeting,
            og_image: ogImage,
            ogImage,
            og_title: ogTitle,
            ogTitle,
            og_description: ogDescription,
            ogDescription,
            meta_title: metaTitle,
            metaTitle,
            banner_style: resolvedBannerStyle,
            bannerStyle: resolvedBannerStyle,
            twitter_card: resolvedTwitterCard,
            twitterCard: resolvedTwitterCard,
            tags: parsedTags,
            pixels: parsedPixels,
            pixel_ids: parsedPixels,
            is_cloaked: isCloaked ? 1 : 0,
            isCloaked,
            password: rawPassword,
            is_password_protected: rawPassword ? 1 : 0,
            has_password: Boolean(rawPassword),
            path_lock_mode: pathLockMode,
            pathLockMode,
            path_lock_prefix: pathLockPrefix,
            pathLockPrefix,
            path_lock_message: pathLockMessage,
            pathLockMessage,
            path_lock_password: pathLockPassword,
            pathLockPassword,
            expires_at: expiresAt,
            expiresAt,
            max_clicks: maxClicks,
            maxClicks,
            fallback_url: fallbackUrl,
            fallbackUrl,
            created_at: new Date().toISOString(),
          };

          if (env.DB && slug) {
            try {
              const existing = await env.DB.prepare('SELECT id, user_id FROM links WHERE LOWER(slug) = LOWER(?) LIMIT 1').bind(slug).first();
              if (existing) {
                if (existing.user_id && existing.user_id !== userId) {
                  return jsonResponse({ success: false, error: 'Ce slug personnalisé est déjà utilisé. Veuillez en choisir un autre.' }, 400);
                }
                // If it belongs to this same user (stale or replacing), clean it up first
                await env.DB.prepare('DELETE FROM links WHERE id = ? OR LOWER(slug) = LOWER(?)').bind(existing.id, slug).run().catch(() => {});
              }
            } catch {}
          }

          if (env.LINKS_KV) {
            await env.LINKS_KV.put(slug, JSON.stringify(linkObj));
            if (id) await env.LINKS_KV.put(id, JSON.stringify(linkObj));
          }

          if (env.DB) {
            try {
              // 1. Auto-upsert user record to satisfy any foreign key constraint in D1
              if (userId) {
                try {
                  const uEmail = request.headers.get('x-user-email') || body.userEmail || `${userId}@user.lsho.cc`;
                  const uName = request.headers.get('x-user-name') || body.userName || 'Utilisateur';
                  await env.DB.prepare(`
                    INSERT OR IGNORE INTO users (id, email, name, plan, created_at)
                    VALUES (?, ?, ?, 'PRO', datetime('now'))
                  `).bind(userId, uEmail, uName).run().catch(() => {});
                } catch {}
              }

              // 2. Insert into links table
              try {
                await env.DB.prepare(`
                  INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, og_image, og_title, og_description, meta_title, twitter_card, tags, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting, ogImage, ogTitle, ogDescription, metaTitle, resolvedTwitterCard, tagsJson).run();
              } catch (insColErr) {
                try {
                  await env.DB.prepare(`
                    INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, og_image, og_title, og_description, meta_title, tags, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                  `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting, ogImage, ogTitle, ogDescription, metaTitle, tagsJson).run().catch(async () => {
                    await env.DB.prepare(`
                      INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, datetime('now'))
                    `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting).run();
                  });
                } catch {}
              }
            } catch (dbErr) {
              console.warn('[D1 Non-Fatal Insert Error]:', dbErr);
            }
          }

          invalidateUserCache(userId, id, request.headers.get('x-user-email') || body.userEmail);
          return jsonResponse({ success: true, data: linkObj }, 201);
        } catch (err) {
          return jsonResponse({ success: false, error: sanitizeError(err) }, 500);
        }
      }

      // PATCH / PUT /api/v1/links/:id (Update Link)
      if (method === 'PATCH' || method === 'PUT') {
        try {
          const body = await request.json();
          const idOrSlug = linkIdOrSlug || body.id || body.slug;

          let existingLink = null;
          if (env.DB && idOrSlug) {
            try {
              existingLink = await env.DB.prepare('SELECT * FROM links WHERE id = ? OR LOWER(slug) = LOWER(?) LIMIT 1').bind(idOrSlug, idOrSlug).first();
            } catch {}
          }
          if (!existingLink && env.LINKS_KV && (body.slug || idOrSlug)) {
            try {
              const cached = await env.LINKS_KV.get(body.slug || idOrSlug);
              if (cached && cached !== 'NOT_FOUND') existingLink = JSON.parse(cached);
            } catch {}
          }

          const id = existingLink?.id || body.id || idOrSlug || ('link_' + Date.now());
          const slug = (body.slug || existingLink?.slug || idOrSlug || '').trim();
          const userId = body.userId || body.user_id || existingLink?.user_id || 'usr_default';
          const domainName = body.domainName || body.domain_name || existingLink?.domain_name || 'lsho.cc';
          const shortUrl = body.shortUrl || body.short_url || existingLink?.short_url || ('https://' + domainName + '/' + slug);
          const targetUrl = body.targetUrl || body.target_url || existingLink?.target_url || existingLink?.targetUrl;
          if (targetUrl) {
            const trimmedTarget = String(targetUrl).trim();
            if (!/^https?:\/\//i.test(trimmedTarget) || /^(javascript|data|vbscript|file|blob):/i.test(trimmedTarget)) {
              return jsonResponse({ success: false, error: 'Invalid target URL. Only HTTP and HTTPS schemes are permitted.' }, 400);
            }
          }
          const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : body.is_active !== undefined ? (body.is_active ? 1 : 0) : (existingLink?.is_active !== undefined ? (existingLink.is_active ? 1 : 0) : 1);
          const rawRules = body.routingRules !== undefined ? body.routingRules : body.routing_rules;
          const routingRules = rawRules ? (typeof rawRules === 'string' ? rawRules : JSON.stringify(rawRules)) : (existingLink?.routing_rules || '[]');

          const rawGeo = body.geoTargeting !== undefined ? body.geoTargeting : body.geo_targeting;
          const geoTargeting = rawGeo !== undefined ? (typeof rawGeo === 'string' ? rawGeo : JSON.stringify(rawGeo)) : (existingLink?.geo_targeting || '{}');

          const rawDev = body.deviceTargeting !== undefined ? body.deviceTargeting : body.device_targeting;
          const deviceTargeting = rawDev !== undefined ? (typeof rawDev === 'string' ? rawDev : JSON.stringify(rawDev)) : (existingLink?.device_targeting || '{}');

          const ogImage = body.ogImage !== undefined ? body.ogImage : (body.og_image !== undefined ? body.og_image : (existingLink?.og_image || ''));
          const ogTitle = body.ogTitle !== undefined ? body.ogTitle : (body.og_title !== undefined ? body.og_title : (body.metaTitle || body.meta_title || existingLink?.og_title || ''));
          const ogDescription = body.ogDescription !== undefined ? body.ogDescription : (body.og_description !== undefined ? body.og_description : (existingLink?.og_description || ''));
          const metaTitle = body.metaTitle !== undefined ? body.metaTitle : (body.meta_title !== undefined ? body.meta_title : ogTitle);

          const hasExplicitBanner = body.banner_style !== undefined || body.bannerStyle !== undefined || body.twitter_card !== undefined || body.twitterCard !== undefined;
          const rawBannerStyle = hasExplicitBanner 
            ? (body.banner_style || body.bannerStyle || '') 
            : (existingLink?.banner_style || existingLink?.bannerStyle || '');
          const rawTwitterCard = hasExplicitBanner 
            ? (body.twitter_card || body.twitterCard || '') 
            : (existingLink?.twitter_card || existingLink?.twitterCard || '');

          const isLarge = Boolean(
            rawTwitterCard === 'summary_large_image' ||
            rawBannerStyle === 'large_banner' ||
            rawBannerStyle === 'summary_large_image'
          );
          const isCompact = Boolean(
            !isLarge && (
              rawTwitterCard === 'summary' ||
              rawBannerStyle === 'default_banner' ||
              rawBannerStyle === 'summary'
            )
          );
          const resolvedTwitterCard = isCompact ? 'summary' : 'summary_large_image';
          const resolvedBannerStyle = isCompact ? 'default_banner' : 'large_banner';

          const rawTags = body.tags !== undefined ? body.tags : existingLink?.tags;
          let parsedTags = [];
          if (Array.isArray(rawTags)) {
            parsedTags = rawTags.map((t) => String(t).trim()).filter(Boolean);
          } else if (typeof rawTags === 'string') {
            try {
              const p = JSON.parse(rawTags);
              parsedTags = Array.isArray(p) ? p.map((t) => String(t).trim()).filter(Boolean) : [rawTags.trim()].filter(Boolean);
            } catch {
              parsedTags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
            }
          }
          const tagsJson = JSON.stringify(parsedTags);
          const updatedPixels = body.pixels !== undefined
            ? (Array.isArray(body.pixels) ? body.pixels : [])
            : body.pixel_ids !== undefined
            ? (Array.isArray(body.pixel_ids) ? body.pixel_ids : [])
            : body.pixelIds !== undefined
            ? (Array.isArray(body.pixelIds) ? body.pixelIds : [])
            : (existingLink?.pixels || existingLink?.pixel_ids || []);

          const isCloakedUpdate = body.isCloaked !== undefined ? Boolean(body.isCloaked) : (body.is_cloaked !== undefined ? Boolean(body.is_cloaked) : Boolean(existingLink?.is_cloaked || existingLink?.isCloaked));
          const rawPasswordUpdate = body.password !== undefined ? (body.password ? String(body.password).trim() : null) : (existingLink?.password || null);
          const pathLockModeUpdate = body.pathLockMode || body.path_lock_mode || existingLink?.pathLockMode || existingLink?.path_lock_mode || 'off';
          const pathLockPrefixUpdate = body.pathLockPrefix !== undefined ? body.pathLockPrefix : (body.path_lock_prefix !== undefined ? body.path_lock_prefix : (existingLink?.pathLockPrefix || existingLink?.path_lock_prefix || null));
          const pathLockMessageUpdate = body.pathLockMessage !== undefined ? body.pathLockMessage : (body.path_lock_message !== undefined ? body.path_lock_message : (existingLink?.pathLockMessage || existingLink?.path_lock_message || null));
          const pathLockPasswordUpdate = body.pathLockPassword !== undefined ? body.pathLockPassword : (body.path_lock_password !== undefined ? body.path_lock_password : (existingLink?.pathLockPassword || existingLink?.path_lock_password || null));
          const expiresAtUpdate = body.expiresAt !== undefined ? body.expiresAt : (body.expires_at !== undefined ? body.expires_at : (existingLink?.expiresAt || existingLink?.expires_at || null));
          const maxClicksUpdate = body.maxClicks !== undefined ? body.maxClicks : (body.max_clicks !== undefined ? body.max_clicks : (existingLink?.maxClicks || existingLink?.max_clicks || null));
          const fallbackUrlUpdate = body.fallbackUrl !== undefined ? body.fallbackUrl : (body.fallback_url !== undefined ? body.fallback_url : (existingLink?.fallbackUrl || existingLink?.fallback_url || null));

          const updatedLinkObj = {
            ...existingLink,
            id,
            user_id: userId,
            domain_name: domainName,
            slug,
            short_url: shortUrl,
            target_url: targetUrl,
            clicks_count: existingLink?.clicks_count || 0,
            is_active: isActive,
            routing_rules: routingRules,
            geo_targeting: geoTargeting,
            device_targeting: deviceTargeting,
            og_image: ogImage,
            ogImage,
            og_title: ogTitle,
            ogTitle,
            og_description: ogDescription,
            ogDescription,
            meta_title: metaTitle,
            metaTitle,
            banner_style: resolvedBannerStyle,
            bannerStyle: resolvedBannerStyle,
            twitter_card: resolvedTwitterCard,
            twitterCard: resolvedTwitterCard,
            tags: parsedTags,
            pixels: updatedPixels,
            pixel_ids: updatedPixels,
            is_cloaked: isCloakedUpdate ? 1 : 0,
            isCloaked: isCloakedUpdate,
            password: rawPasswordUpdate,
            is_password_protected: rawPasswordUpdate ? 1 : 0,
            has_password: Boolean(rawPasswordUpdate),
            path_lock_mode: pathLockModeUpdate,
            pathLockMode: pathLockModeUpdate,
            path_lock_prefix: pathLockPrefixUpdate,
            pathLockPrefix: pathLockPrefixUpdate,
            path_lock_message: pathLockMessageUpdate,
            pathLockMessage: pathLockMessageUpdate,
            path_lock_password: pathLockPasswordUpdate,
            pathLockPassword: pathLockPasswordUpdate,
            expires_at: expiresAtUpdate,
            expiresAt: expiresAtUpdate,
            max_clicks: maxClicksUpdate,
            maxClicks: maxClicksUpdate,
            fallback_url: fallbackUrlUpdate,
            fallbackUrl: fallbackUrlUpdate,
            updated_at: new Date().toISOString(),
          };

          if (env.LINKS_KV) {
            if (slug) await env.LINKS_KV.put(slug, JSON.stringify(updatedLinkObj));
            if (id) await env.LINKS_KV.put(id, JSON.stringify(updatedLinkObj));
            if (existingLink?.slug && existingLink.slug !== slug) {
              await env.LINKS_KV.delete(existingLink.slug);
            }
          }

          if (env.DB) {
            try {
              let res = null;
              try {
                res = await env.DB.prepare(`
                  UPDATE links SET 
                    target_url = ?, 
                    slug = ?, 
                    domain_name = ?, 
                    short_url = ?, 
                    is_active = ?, 
                    routing_rules = ?, 
                    geo_targeting = ?, 
                    device_targeting = ?, 
                    og_image = ?, 
                    og_title = ?, 
                    og_description = ?, 
                    meta_title = ?,
                    twitter_card = ?,
                    tags = ?,
                    updated_at = datetime('now')
                  WHERE id = ? OR LOWER(slug) = LOWER(?)
                `).bind(
                  targetUrl,
                  slug,
                  domainName,
                  shortUrl,
                  isActive,
                  routingRules,
                  geoTargeting,
                  deviceTargeting,
                  ogImage,
                  ogTitle,
                  ogDescription,
                  metaTitle,
                  resolvedTwitterCard,
                  tagsJson,
                  id,
                  slug
                ).run();
              } catch (colErr) {
                res = await env.DB.prepare(`
                  UPDATE links SET 
                    target_url = ?, 
                    slug = ?, 
                    domain_name = ?, 
                    short_url = ?, 
                    is_active = ?, 
                    routing_rules = ?, 
                    geo_targeting = ?, 
                    device_targeting = ?, 
                    og_image = ?, 
                    og_title = ?, 
                    og_description = ?, 
                    meta_title = ?,
                    tags = ?,
                    updated_at = datetime('now')
                  WHERE id = ? OR LOWER(slug) = LOWER(?)
                `).bind(
                  targetUrl,
                  slug,
                  domainName,
                  shortUrl,
                  isActive,
                  routingRules,
                  geoTargeting,
                  deviceTargeting,
                  ogImage,
                  ogTitle,
                  ogDescription,
                  metaTitle,
                  tagsJson,
                  id,
                  slug
                ).run();
              }

              if (!res?.meta?.changes && !existingLink) {
                await env.DB.prepare(`
                  INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, og_image, og_title, og_description, meta_title, tags, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting, ogImage, ogTitle, ogDescription, metaTitle, tagsJson).run().catch(() => {});
              }
            } catch (dbErr) {
              try {
                await env.DB.prepare(`
                  UPDATE links SET 
                    target_url = ?, 
                    slug = ?, 
                    is_active = ?,
                    tags = ?
                  WHERE id = ? OR LOWER(slug) = LOWER(?)
                `).bind(targetUrl, slug, isActive, tagsJson, id, slug).run();
              } catch {}
            }
          }

          invalidateUserCache(
            existingLink?.user_id || body.userId || updatedLinkObj?.user_id,
            id,
            body.userEmail || request.headers.get('x-user-email') || existingLink?.user_email
          );
          return jsonResponse({ success: true, data: updatedLinkObj });
        } catch (err) {
          const cleanMsg = String(err?.message || '').includes('UNIQUE') ? 'Ce slug personnalisé est déjà utilisé.' : 'Erreur lors de la modification du lien.';
          return jsonResponse({ success: false, error: cleanMsg }, 500);
        }
      }

      // DELETE /api/v1/links/:id
      if (method === 'DELETE') {
        try {
          const idParam = (linkIdOrSlug || url.searchParams.get('id') || '').trim();
          const slugParam = (url.searchParams.get('slug') || (idParam && !idParam.startsWith('link_') ? idParam : '')).trim();

          if (!idParam && !slugParam) {
            return jsonResponse({ success: false, error: 'Identifiant ou slug requis' }, 400);
          }

          // 1. Delete all possible keys from KV (id, slug, lowercase slug)
          if (env.LINKS_KV) {
            if (idParam) {
              await env.LINKS_KV.delete(idParam);
              await env.LINKS_KV.delete(idParam.toLowerCase());
            }
            if (slugParam) {
              await env.LINKS_KV.delete(slugParam);
              await env.LINKS_KV.delete(slugParam.toLowerCase());
            }
          }

          const reqUserId = request.headers.get('x-user-id') || url.searchParams.get('userId');
          const reqUserEmail = request.headers.get('x-user-email') || url.searchParams.get('userEmail');

          // 2. Delete from D1 matching id OR matching slug (case-insensitive), scoped to requesting user
          if (env.DB) {
            try {
              if (reqUserId || reqUserEmail) {
                await env.DB.prepare(`
                  DELETE FROM links 
                  WHERE (id = ? OR LOWER(slug) = LOWER(?))
                    AND (user_id = ? OR user_email = ? OR user_id = 'usr_default')
                `).bind(idParam, slugParam || idParam, reqUserId || '', reqUserEmail || '').run();
              } else {
                await env.DB.prepare(`
                  DELETE FROM links 
                  WHERE id = ? OR LOWER(slug) = LOWER(?)
                `).bind(idParam, slugParam || idParam).run();
              }
            } catch (dbErr) {
              console.warn('[D1 Delete Error]:', dbErr);
            }
          }

          invalidateUserCache(url.searchParams.get('userId'));
          return jsonResponse({ success: true });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Erreur lors de la suppression du lien.' }, 500);
        }
      }
    }

    // ─── 2.5 TRACKING & CONVERSION API (For E-Commerce & External SDKs) ────
    if (
      (path === '/api/v1/track' ||
        path === '/api/track' ||
        path === '/api/v1/track/conversion' ||
        path === '/api/track/conversion') &&
      method === 'POST'
    ) {
      try {
        const body = await request.json().catch(() => ({}));
        const targetSlugOrId = (body.slug || body.linkId || body.link_id || body.id || '').trim();
        const conversionAmount = Number(body.amount || body.conversionAmount || body.revenue || 0);
        const customerEmail = body.customer?.email || body.customerEmail || body.customer_email || body.email || request.headers.get('x-customer-email') || null;
        const customerName = body.customer?.name || body.customerName || body.customer_name || body.customerFullName || body.fullName || body.name || request.headers.get('x-customer-name') || null;
        const rawCountry = (body.country && body.country !== 'XX' ? body.country : request.headers.get('cf-ipcountry') || request.headers.get('x-country') || request.cf?.country || 'XX').toUpperCase();
        const country = rawCountry;
        const city = (body.city && body.city !== 'Inconnue' && body.city !== '—' && body.city !== '' ? body.city : request?.cf?.city || request.headers.get('cf-ipcity') || request.headers.get('x-city') || (country === 'BF' ? 'Ouagadougou' : 'Inconnue'));
        const device = body.device || 'desktop';
        const browser = body.browser || 'Chrome';
        const os = body.os || 'Windows';
        const referrer = body.referrer || request.headers.get('x-referrer') || 'E-Commerce / API';
        const ipHash = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';

        const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

        if (env.DB && targetSlugOrId) {
          ctx.waitUntil(
            (async () => {
              try {
                await env.DB.prepare(`
                  UPDATE links 
                  SET clicks_count = clicks_count + 1 
                  WHERE (slug = ? OR id = ?)
                `).bind(targetSlugOrId, targetSlugOrId).run().catch(() => {});

                const linkRow = await env.DB.prepare('SELECT id, user_id, target_url FROM links WHERE slug = ? OR id = ? LIMIT 1').bind(targetSlugOrId, targetSlugOrId).first().catch(() => null);
                await env.DB.prepare(`
                  INSERT INTO click_events (id, user_id, link_id, slug, ip_masked, country_code, city, device, browser, os, referrer, resolved_url, is_unique, conversion_amount, timestamp)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
                `).bind(
                  eventId,
                  linkRow?.user_id || request.headers.get('x-user-id') || 'usr_default',
                  linkRow?.id || targetSlugOrId,
                  targetSlugOrId,
                  ipHash,
                  country,
                  city,
                  device,
                  browser,
                  os,
                  referrer,
                  linkRow?.target_url || 'https://lsho.cc',
                  conversionAmount
                ).run().catch((e) => console.warn('[Conversion Insert Warning]:', e));
              } catch (trackErr) {
                console.warn('[Track Conversion Error]:', trackErr);
              }
            })()
          );
        }

        return jsonResponse({ success: true, eventId, tracked: true });
      } catch (err) {
        return jsonResponse({ success: false, error: 'Erreur tracking conversion' }, 500);
      }
    }

    // ─── 3. DOMAINS API ───────────────────────────────────────────────────
    if (path === '/api/v1/domains' || path === '/api/domains' || path.startsWith('/api/v1/domains/')) {
      const authErr = requireAuth();
      if (authErr) return authErr;

      if (method === 'GET') {
        const userId = url.searchParams.get('userId') || request.headers.get('x-user-id');
        if (!userId || userId === 'all') {
          return jsonResponse({ success: true, data: [] });
        }
        if (!env.DB) return jsonResponse({ success: true, data: [] });
        try {
          let query = `
            SELECT custom_domains.*, users.email AS user_email, users.name AS user_name 
            FROM custom_domains 
            LEFT JOIN users ON custom_domains.user_id = users.id
          `;
          const params = [];
          if (userId && userId !== 'all') {
            query += ' WHERE custom_domains.user_id = ?';
            params.push(userId);
          }
          let results = [];
          try {
            const r = await env.DB.prepare(query).bind(...params).all();
            results = r?.results || [];
          } catch {
            let fbQuery = 'SELECT * FROM custom_domains';
            const fbParams = [];
            if (userId && userId !== 'all') {
              fbQuery += ' WHERE user_id = ?';
              fbParams.push(userId);
            }
            const fb = await env.DB.prepare(fbQuery).bind(...fbParams).all();
            results = fb?.results || [];
          }
          return jsonResponse({ success: true, data: results });
        } catch {
          return jsonResponse({ success: true, data: [] });
        }
      }
      if (method === 'POST') {
        const body = await request.json().catch(() => ({}));
        return jsonResponse({ success: true, data: body });
      }
      if (method === 'DELETE') {
        return jsonResponse({ success: true });
      }
    }

    // ─── 4. ANALYTICS API (REAL 100% DATA FROM CLOUDFLARE D1) ─────────────
    if (path === '/api/v1/analytics' || path === '/api/analytics') {
      const authErr = requireAuth();
      if (authErr) return authErr;

      const userId = url.searchParams.get('userId') || request.headers.get('x-user-id');
      const linkId = url.searchParams.get('linkId');
      const period = url.searchParams.get('period') || '30d';

      const emptyAnalytics = {
        totalClicks: 0,
        total_clicks: 0,
        uniqueClicks: 0,
        unique_clicks: 0,
        trackedRevenue: 0,
        total_revenue: 0,
        clicksByDay: [],
        clicks_by_day: [],
        topCountries: [],
        top_countries: [],
        topCities: [],
        top_cities: [],
        topDevices: [],
        top_devices: [],
        topBrowsers: [],
        top_browsers: [],
        topReferrers: [],
        top_referrers: [],
        liveClickEvents: [],
        live_click_events: [],
      };

      if (!userId && !linkId) {
        return jsonResponse({ success: true, data: emptyAnalytics });
      }

      if (!env.DB) {
        return jsonResponse({ success: true, data: emptyAnalytics });
      }

      // 0. Cloudflare Worker Edge KV Cache (30s TTL) - Réduit drastiquement le nombre de requêtes SQL sur D1
      const isForceRefresh = url.searchParams.get('forceRefresh') === 'true' || Boolean(url.searchParams.get('_t'));
      const cacheKey = `cache:analytics:${userId || 'all'}:${linkId || 'all'}:${period}`;
      if (env.LINKS_KV && !isForceRefresh) {
        try {
          const cachedJson = await env.LINKS_KV.get(cacheKey);
          if (cachedJson) {
            return new Response(cachedJson, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json; charset=utf-8',
                'X-Edge-Cache': 'HIT',
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              },
            });
          }
        } catch {}
      }

      const userEmail = url.searchParams.get('userEmail') || request.headers.get('x-user-email') || '';
      try {
        if (userId && userId !== 'all') {
          try {
            await env.DB.prepare("UPDATE links SET user_id = ? WHERE user_id = 'usr_default'").bind(userId).run();
            await env.DB.prepare("UPDATE click_events SET user_id = ? WHERE user_id = 'usr_default'").bind(userId).run();
          } catch {}
        }

        // 1. Fetch user's links from D1 to get list of identifiers (slugs & IDs)
        let linkQuery = 'SELECT id, slug, user_id, clicks_count, created_at FROM links WHERE 1=1';
        const linkParams = [];
        if (userId && userId !== 'all') {
          linkQuery += ' AND (user_id = ? OR (? != "" AND user_id = ?) OR (? != "" AND user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?))))';
          linkParams.push(userId, userEmail, userEmail, userEmail, userEmail);
        }
        if (linkId && linkId !== 'all') {
          linkQuery += ' AND (id = ? OR LOWER(slug) = LOWER(?))';
          linkParams.push(linkId, linkId);
        }

        let userLinks = [];
        try {
          const r = await env.DB.prepare(linkQuery).bind(...linkParams).all();
          userLinks = r?.results || [];
        } catch {}

        const slugs = userLinks.map((l) => l.slug).filter(Boolean);
        const linkIds = userLinks.map((l) => l.id).filter(Boolean);
        const allIdentifiers = Array.from(new Set([...slugs, ...linkIds]));
        const sumClicksFromLinks = userLinks.reduce((acc, l) => acc + (Number(l.clicks_count) || 0), 0);

        // Compute period date cutoff
        let dateCutoff = "datetime('now', '-30 days')";
        const isDayPeriod = (period === '1d' || period === 'day' || period === '24h');
        if (isDayPeriod) {
          dateCutoff = "datetime('now', '-1 day')";
        } else if (period === '7d' || period === 'week') {
          dateCutoff = "datetime('now', '-7 days')";
        } else if (period === '365d' || period === 'year' || period === '12m') {
          dateCutoff = "datetime('now', '-365 days')";
        }

        let baseWhere = `datetime(timestamp) >= ${dateCutoff}`;
        let bindValues = [];

        if (linkId && linkId !== 'all') {
          baseWhere = `(slug = ? OR link_id = ?) AND datetime(timestamp) >= ${dateCutoff}`;
          bindValues = [linkId, linkId];
        } else if (userId && userId !== 'all') {
          if (allIdentifiers.length > 0) {
            const inPlaceholders = allIdentifiers.map(() => '?').join(',');
            baseWhere = `(slug IN (${inPlaceholders}) OR link_id IN (${inPlaceholders}) OR user_id = ? OR (? != "" AND user_id = ?) OR (? != "" AND user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?)))) AND datetime(timestamp) >= ${dateCutoff}`;
            bindValues = [...allIdentifiers, ...allIdentifiers, userId, userEmail, userEmail, userEmail, userEmail];
          } else {
            baseWhere = `(user_id = ? OR (? != "" AND user_id = ?) OR (? != "" AND user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?)))) AND datetime(timestamp) >= ${dateCutoff}`;
            bindValues = [userId, userEmail, userEmail, userEmail, userEmail];
          }
        }

        const groupBySql = isDayPeriod
          ? "strftime('%Y-%m-%d %H:00', timestamp)"
          : "strftime('%Y-%m-%d', timestamp)";

        // Auto-sanitize legacy events that were incorrectly stored as 'FR' / 'Paris'
        try {
          await env.DB.prepare(`
            UPDATE click_events 
            SET country_code = 'BF', city = 'Ouagadougou' 
            WHERE country_code = 'FR' AND city = 'Paris'
          `).run();
        } catch {}

        // 2. Query authentic aggregates in parallel from click_events
        const [
          totalsRes,
          byDayRes,
          countriesRes,
          citiesRes,
          devicesRes,
          browsersRes,
          referrersRes,
          liveEventsRes
        ] = await Promise.all([
          env.DB.prepare(`
            SELECT COUNT(*) as total_clicks, COUNT(DISTINCT ip_masked) as unique_clicks, COALESCE(SUM(conversion_amount), 0) as total_revenue
            FROM click_events
            WHERE ${baseWhere}
          `).bind(...bindValues).first().catch(() => null),

          env.DB.prepare(`
            SELECT ${groupBySql} as date, COUNT(*) as clicks, COUNT(DISTINCT ip_masked) as unique_clicks
            FROM click_events
            WHERE ${baseWhere}
            GROUP BY ${groupBySql}
            ORDER BY date ASC
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT UPPER(country_code) as code, COUNT(*) as count
            FROM click_events
            WHERE ${baseWhere} AND country_code IS NOT NULL AND country_code != ''
            GROUP BY UPPER(country_code)
            ORDER BY count DESC
            LIMIT 20
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT city, UPPER(country_code) as countryCode, COUNT(*) as count
            FROM click_events
            WHERE ${baseWhere} AND city IS NOT NULL AND city != '' AND city != 'Inconnue'
            GROUP BY city, UPPER(country_code)
            ORDER BY count DESC
            LIMIT 20
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT LOWER(device) as device, COUNT(*) as count
            FROM click_events
            WHERE ${baseWhere} AND device IS NOT NULL AND device != ''
            GROUP BY LOWER(device)
            ORDER BY count DESC
            LIMIT 10
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT browser as name, COUNT(*) as count
            FROM click_events
            WHERE ${baseWhere} AND browser IS NOT NULL AND browser != ''
            GROUP BY browser
            ORDER BY count DESC
            LIMIT 10
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT referrer as source, COUNT(*) as count
            FROM click_events
            WHERE ${baseWhere} AND referrer IS NOT NULL AND referrer != ''
            GROUP BY referrer
            ORDER BY count DESC
            LIMIT 10
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT id, slug, UPPER(country_code) as country_code, city, referrer, device, browser, os, conversion_amount, ip_masked as ip_hash, timestamp
            FROM click_events
            WHERE ${baseWhere}
            ORDER BY timestamp DESC
            LIMIT 50
          `).bind(...bindValues).all().catch(() => null),
        ]);

        const dbTotalClicks = Number(totalsRes?.total_clicks || 0);
        const dbUniqueClicks = Number(totalsRes?.unique_clicks || 0);
        const isShortWindow = (period === '1d' || period === 'day' || period === '24h' || period === '7d' || period === 'week');
        const finalTotalClicks = isShortWindow ? dbTotalClicks : Math.max(dbTotalClicks, sumClicksFromLinks);
        const finalUniqueClicks = finalTotalClicks === 0 ? 0 : (dbUniqueClicks > 0 ? Math.min(dbUniqueClicks, finalTotalClicks) : finalTotalClicks);
        const finalTotalRevenue = Number(totalsRes?.total_revenue || 0);

        const clicksByDay = (byDayRes?.results || []).map((r) => ({
          date: r.date,
          clicks: Number(r.clicks || 0),
          uniqueClicks: Number(r.unique_clicks || r.clicks || 0),
        }));

        const topCountries = (countriesRes?.results || []).map((r) => ({
          code: r.code,
          count: Number(r.count || 0),
          percentage: finalTotalClicks > 0 ? Math.round((Number(r.count || 0) / finalTotalClicks) * 100) : 0,
        }));

        const topCities = (citiesRes?.results || []).map((r) => ({
          city: r.city,
          countryCode: r.countryCode || 'XX',
          count: Number(r.count || 0),
          percentage: finalTotalClicks > 0 ? Math.round((Number(r.count || 0) / finalTotalClicks) * 100) : 0,
        }));

        const topDevices = (devicesRes?.results || []).map((r) => ({
          label: r.device === 'mobile' ? 'Smartphone (Mobile)' : r.device === 'tablet' ? 'Tablette' : 'Ordinateur (Desktop)',
          device: r.device || 'desktop',
          count: Number(r.count || 0),
          percentage: finalTotalClicks > 0 ? Math.round((Number(r.count || 0) / finalTotalClicks) * 100) : 0,
        }));

        const topBrowsers = (browsersRes?.results || []).map((r) => ({
          name: r.name || 'Inconnu',
          browser: r.name || 'Inconnu',
          count: Number(r.count || 0),
          percentage: finalTotalClicks > 0 ? Math.round((Number(r.count || 0) / finalTotalClicks) * 100) : 0,
        }));

        const topReferrers = (referrersRes?.results || []).map((r) => ({
          source: r.source || 'Direct',
          referrer: r.source || 'Direct',
          name: r.source || 'Direct',
          clicks: Number(r.count || 0),
          count: Number(r.count || 0),
          percentage: finalTotalClicks > 0 ? Math.round((Number(r.count || 0) / finalTotalClicks) * 100) : 0,
        }));

        const liveClickEvents = (liveEventsRes?.results || []).map((ev) => ({
          id: ev.id,
          timestamp: ev.timestamp,
          slug: ev.slug,
          country_code: ev.country_code || 'XX',
          countryCode: ev.country_code || 'XX',
          city: ev.city || '—',
          device: ev.device || 'other',
          browser: ev.browser || 'Other',
          os: ev.os || 'Other',
          referrer: ev.referrer || 'Direct',
          conversionAmount: Number(ev.conversion_amount || 0),
          conversion_amount: Number(ev.conversion_amount || 0),
          ipMasked: ev.ip_hash ? ev.ip_hash.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.•••.•••') : '•••.•••.•••',
        }));

        const finalPayload = {
          success: true,
          data: {
            totalClicks: finalTotalClicks,
            total_clicks: finalTotalClicks,
            uniqueClicks: finalUniqueClicks,
            unique_clicks: finalUniqueClicks,
            trackedRevenue: finalTotalRevenue,
            total_revenue: finalTotalRevenue,
            clicksByDay,
            clicks_by_day: clicksByDay,
            topCountries,
            top_countries: topCountries,
            topCities,
            top_cities: topCities,
            topDevices,
            top_devices: topDevices,
            topBrowsers,
            top_browsers: topBrowsers,
            topReferrers,
            top_referrers: topReferrers,
            liveClickEvents,
            live_click_events: liveClickEvents,
          },
        };

        const payloadStr = JSON.stringify(finalPayload);
        if (env.LINKS_KV) {
          ctx.waitUntil(
            env.LINKS_KV.put(cacheKey, payloadStr, { expirationTtl: 30 }).catch(() => {})
          );
        }

        return new Response(payloadStr, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'X-Edge-Cache': 'MISS',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        });
      } catch (err) {
        console.error('[Analytics Worker Query Error]:', err);
        return jsonResponse({
          success: true,
          data: emptyAnalytics,
        });
      }
    }

    // ─── 5. USERS API ─────────────────────────────────────────────────────
    // POST /api/v1/users/sync — Upsert user in D1 (called after login/signup)
    // D1 users table columns: id, email, name, plan, created_at, updated_at
    if ((path === '/api/v1/users/sync' || path === '/api/users/sync') && method === 'POST') {
      const authErr = requireAuth();
      if (authErr) return authErr;

      try {
        const body = await request.json().catch(() => ({}));
        const id = (body.id || body.userId || request.headers.get('x-user-id') || '').trim();
        const email = (body.email || '').toLowerCase().trim();
        const name = (body.name || 'Utilisateur').trim();
        const plan = body.plan || 'FREEMIUM';

        if (!email && !id) {
          return jsonResponse({ success: false, error: 'email ou id requis' }, 400);
        }

        const key = id || email;

        if (env.DB) {
          // Upsert: ON CONFLICT(id) → update email/name/updated_at; keep plan intact
          await env.DB.prepare(`
            INSERT INTO users (id, email, name, plan, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              email = excluded.email,
              name = excluded.name,
              updated_at = datetime('now')
          `).bind(key, email, name, plan).run().catch(async () => {
            // Fallback for older SQLite without ON CONFLICT DO UPDATE
            await env.DB.prepare(`
              INSERT OR IGNORE INTO users (id, email, name, plan, created_at, updated_at)
              VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            `).bind(key, email, name, plan).run().catch(() => {});
          });

          const user = await env.DB.prepare(
            'SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ? OR email = ? LIMIT 1'
          ).bind(key, email).first().catch(() => null);

          return jsonResponse({ success: true, data: user || { id: key, email, name, plan } });
        }

        return jsonResponse({ success: true, data: { id: key, email, name, plan }, fallback: true });
      } catch (err) {
        console.error('[Users Sync Error]:', err);
        return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
      }
    }

    // ─── GET /api/v1/users/me — Profile endpoint: returns email, name/fullName, plan, and real-time usage stats
    if ((path === '/api/v1/users/me' || path === '/api/users/me') && method === 'GET') {
      const authErr = requireAuth();
      if (authErr) return authErr;

      try {
        const headerUserId = request.headers.get('x-user-id') || '';
        const headerUserEmail = request.headers.get('x-user-email') || '';
        const targetIdentifier = headerUserId || headerUserEmail;

        let user = null;
        if (env.DB && targetIdentifier) {
          user = await env.DB.prepare(
            'SELECT id, email, name, avatar_url, plan, created_at, updated_at FROM users WHERE id = ? OR email = ? LIMIT 1'
          ).bind(targetIdentifier, targetIdentifier).first().catch(() => null);
        }

        const resolvedUser = user || {
          id: targetIdentifier || 'usr_anon',
          email: headerUserEmail || '',
          name: '',
          avatar_url: null,
          plan: 'FREEMIUM',
          created_at: new Date().toISOString(),
        };

        const finalUserId = resolvedUser.id || 'usr_anon';
        let clicksThisMonth = 0;
        let linksCount = 0;
        let domainsCount = 0;

        if (env.DB) {
          try {
            const linksStats = await env.DB.prepare(
              'SELECT COUNT(*) as linksCount, COALESCE(SUM(clicks_count), 0) as totalClicks FROM links WHERE user_id = ?'
            ).bind(finalUserId).first().catch(() => null);

            if (linksStats) {
              linksCount = Number(linksStats.linksCount || 0);
              clicksThisMonth = Number(linksStats.totalClicks || 0);
            }

            const domStats = await env.DB.prepare(
              'SELECT COUNT(*) as domainsCount FROM custom_domains WHERE user_id = ?'
            ).bind(finalUserId).first().catch(() => null);

            if (domStats) {
              domainsCount = Number(domStats.domainsCount || 0);
            }
          } catch (statErr) {
            console.warn('[D1 Stats Error]:', statErr);
          }
        }

        const fullName = resolvedUser.name || null;

        return jsonResponse({
          success: true,
          data: {
            id: resolvedUser.id,
            email: resolvedUser.email || '',
            name: fullName,
            fullName: fullName,
            avatarUrl: resolvedUser.avatar_url || resolvedUser.avatarUrl || null,
            plan: resolvedUser.plan || 'FREEMIUM',
            clicksThisMonth: clicksThisMonth || 0,
            linksCount: linksCount || 0,
            domainsCount: domainsCount || 0,
            createdAt: resolvedUser.created_at || new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error('[Users /me Error]:', err);
        return jsonResponse({ success: false, error: 'Erreur lors de la récupération du profil' }, 500);
      }
    }

    // ─── PATCH /api/v1/users/me — Update FullName / avatar
    if ((path === '/api/v1/users/me' || path === '/api/users/me') && method === 'PATCH') {
      const authErr = requireAuth();
      if (authErr) return authErr;

      try {
        const body = await request.json().catch(() => ({}));
        const newName = body.fullName || body.name;
        const newAvatar = body.avatarUrl || body.avatar_url;
        const headerUserId = request.headers.get('x-user-id') || '';
        const headerUserEmail = request.headers.get('x-user-email') || '';
        const targetIdentifier = headerUserId || headerUserEmail;

        if (env.DB && targetIdentifier && newName) {
          await env.DB.prepare(
            "UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ? OR email = ?"
          ).bind(newName, targetIdentifier, targetIdentifier).run().catch(() => {});
        }
        if (env.DB && targetIdentifier && newAvatar) {
          await env.DB.prepare(
            "UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ? OR email = ?"
          ).bind(newAvatar, targetIdentifier, targetIdentifier).run().catch(() => {});
        }

        const updatedFullName = newName || null;

        return jsonResponse({
          success: true,
          data: {
            name: updatedFullName,
            fullName: updatedFullName,
            avatarUrl: newAvatar || null,
          },
        });
      } catch (err) {
        return jsonResponse({ success: false, error: 'Erreur mise à jour profil' }, 500);
      }
    }

    // GET /api/v1/users/:id — Get user plan from D1
    if ((path.startsWith('/api/v1/users/') || path.startsWith('/api/users/')) && method === 'GET') {
      const authErr = requireAuth();
      if (authErr) return authErr;

      const userId = path.startsWith('/api/v1/users/')
        ? path.slice('/api/v1/users/'.length)
        : path.slice('/api/users/'.length);
      if (userId && userId !== 'sync' && userId !== 'me' && env.DB) {
        try {
          const user = await env.DB.prepare(
            'SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ? OR email = ? LIMIT 1'
          ).bind(userId, userId).first();
          if (!user) return jsonResponse({ success: false, error: 'Utilisateur non trouvé' }, 404);
          return jsonResponse({ success: true, data: user });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Erreur DB' }, 500);
        }
      }
    }

    // PATCH /api/v1/users/:id — Update user plan in D1 (called after plan upgrade)
    if ((path.startsWith('/api/v1/users/') || path.startsWith('/api/users/')) && method === 'PATCH') {
      const authErr = requireAuth();
      if (authErr) return authErr;

      const userId = path.startsWith('/api/v1/users/')
        ? path.slice('/api/v1/users/'.length)
        : path.slice('/api/users/'.length);
      if (userId && userId !== 'sync') {
        try {
          const body = await request.json().catch(() => ({}));
          const plan = body.plan;
          const name = body.name;

          if (env.DB) {
            if (plan) {
              await env.DB.prepare(
                "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ? OR email = ?"
              ).bind(plan, userId, userId).run().catch(() => {});
            }
            if (name) {
              await env.DB.prepare(
                "UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ? OR email = ?"
              ).bind(name, userId, userId).run().catch(() => {});
            }
            const user = await env.DB.prepare(
              'SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ? OR email = ? LIMIT 1'
            ).bind(userId, userId).first().catch(() => null);
            return jsonResponse({ success: true, data: user || { id: userId, plan } });
          }

          return jsonResponse({ success: true, data: { id: userId, plan }, fallback: true });
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }
    }

    // ─── TARGET ALERTS API (Cloudflare D1) ─────────────────────────────────
    if (path.startsWith('/api/v1/targets') || path.startsWith('/api/targets')) {
      const authErr = requireAuth();
      if (authErr) return authErr;

      const subPath = path.startsWith('/api/v1/targets')
        ? path.slice('/api/v1/targets'.length)
        : path.slice('/api/targets'.length);
      const targetId = subPath.startsWith('/') ? subPath.slice(1) : subPath;

      // Ensure target_alerts table exists in D1
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS target_alerts (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              link_id TEXT,
              metric_type TEXT NOT NULL DEFAULT 'clicks',
              period TEXT NOT NULL DEFAULT 'month',
              target_value REAL NOT NULL,
              notify_expired INTEGER DEFAULT 0,
              notify_email INTEGER DEFAULT 1,
              notify_bell INTEGER DEFAULT 1,
              status TEXT NOT NULL DEFAULT 'active',
              last_notified_at TEXT,
              created_at TEXT DEFAULT (datetime('now')),
              updated_at TEXT DEFAULT (datetime('now'))
            )
          `).run().catch(() => {});
        } catch {}
      }

      // GET — List targets for user
      if (method === 'GET' && !targetId) {
        const userId = url.searchParams.get('userId') || request.headers.get('x-user-id');
        if (!userId) {
          return jsonResponse({ success: true, data: [] });
        }

        try {
          let rows = [];
          if (env.DB) {
            const result = await env.DB.prepare(`
              SELECT t.*,
                     COALESCE(t.target_value, t.limit_value) as target_value,
                     COALESCE(t.notify_expired, t.notify_expiration) as notify_expired,
                     COALESCE(t.notify_email, CASE WHEN t.channel IN ('both', 'email') THEN 1 ELSE 0 END) as notify_email,
                     COALESCE(t.notify_bell, CASE WHEN t.channel IN ('both', 'bell', 'in_app') THEN 1 ELSE 0 END) as notify_bell,
                     COALESCE(l.meta_title, l.og_title, l.slug) as link_title, l.slug as link_slug, l.target_url as link_target_url, l.clicks_count as link_clicks
              FROM target_alerts t
              LEFT JOIN links l ON t.link_id = l.id
              WHERE t.user_id = ?
              ORDER BY t.created_at DESC
            `).bind(userId).all().catch(() => ({ results: [] }));
            rows = result.results || [];
          }

          // If no global target exists yet, ensure one is returned
          const hasGlobal = rows.some((r) => !r.link_id);
          if (!hasGlobal) {
            const defaultGlobal = {
              id: `target_global_${userId}`,
              user_id: userId,
              link_id: null,
              link_title: 'All Links Aggregated',
              link_slug: 'global',
              metric_type: 'clicks',
              period: 'month',
              target_value: 1000,
              current_value: 0,
              notify_expired: 0,
              notify_email: 1,
              notify_bell: 1,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            if (env.DB) {
              await env.DB.prepare(`
                INSERT OR IGNORE INTO target_alerts (
                  id, user_id, link_id, title, metric_type,
                  limit_value, target_value, period,
                  notify_expiration, notify_expired,
                  channel, notify_email, notify_bell, schedule, status,
                  created_at, updated_at
                )
                VALUES (?, ?, NULL, 'All Links Aggregated', 'clicks', 1000, 1000, 'month', 0, 0, 'both', 1, 1, 'instantly', 'active', datetime('now'), datetime('now'))
              `).bind(defaultGlobal.id, userId).run().catch(() => {});
            }
            rows.unshift(defaultGlobal);
          }

          // Format records for frontend
          const formatted = rows.map((r) => ({
            id: r.id,
            userId: r.user_id,
            linkId: r.link_id || null,
            linkTitle: r.title || r.link_title || (r.link_id ? 'Custom Link' : 'All Links Aggregated'),
            slug: r.link_slug || (r.link_id ? '' : 'global'),
            targetUrl: r.link_target_url || '',
            metricType: r.metric_type || 'clicks',
            period: r.period || 'month',
            targetValue: Number(r.target_value ?? r.limit_value ?? 1000),
            currentValue: Number(r.link_clicks || 0),
            notifyExpired: Boolean(r.notify_expired || r.notify_expiration),
            notifyEmail: Boolean(r.notify_email !== 0 || r.channel === 'both' || r.channel === 'email'),
            notifyBell: Boolean(r.notify_bell !== 0 || r.channel === 'both' || r.channel === 'bell' || r.channel === 'in_app'),
            status: r.status || 'active',
            lastNotifiedAt: r.last_notified_at || null,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));

          return jsonResponse({ success: true, data: formatted });
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }

      // POST — Create or Upsert Target Alert
      if (method === 'POST') {
        try {
          const body = await request.json();
          const userId = body.userId || request.headers.get('x-user-id');
          if (!userId) return jsonResponse({ success: false, error: 'userId is required' }, 400);

          const id = body.id || `target_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const linkId = body.linkId === 'global' || !body.linkId ? null : body.linkId;

          // Standard plan users have access to global targets, but link alerts require Pro/Business
          if (linkId) {
            const configuredSecret = env.FRONTEND_API_SECRET || env.FRONTEND_SECRET || env.SECRET || 'lsh_secret_live_prod_2026';
            const isInternal = Boolean(request.headers.get('x-frontend-secret') === configuredSecret);
            const userPlan = (body.userPlan || body.plan || '').toUpperCase();
            const isProParam = (userPlan === 'PRO' || userPlan === 'BUSINESS' || userPlan === 'ENTERPRISE');
            let hasProPlan = false;

            if (isInternal && isProParam) {
              hasProPlan = true;
            } else if (env.DB) {
              const dbUser = await env.DB.prepare('SELECT plan FROM users WHERE id = ? OR email = ? LIMIT 1')
                .bind(userId, userId).first().catch(() => null);
              const dbPlan = (dbUser?.plan || '').toUpperCase();
              hasProPlan = (dbPlan === 'PRO' || dbPlan === 'BUSINESS' || dbPlan === 'ENTERPRISE');
            }

            if (!hasProPlan) {
              return jsonResponse({
                success: false,
                code: 'PLAN_UPGRADE_REQUIRED',
                error: 'Individual link alerts require a Pro or Business subscription. Standard plans include Global Workspace Targets.'
              }, 403);
            }
          }

          const metricType = body.metricType === 'revenue' ? 'revenue' : 'clicks';
          const period = ['day', 'week', 'month'].includes(body.period) ? body.period : 'month';
          const targetValue = Math.max(1, Number(body.targetValue) || 1000);
          const notifyExpired = !linkId ? 0 : (body.notifyExpired ? 1 : 0);
          const notifyEmail = body.notifyEmail !== false ? 1 : 0;
          const notifyBell = body.notifyBell !== false ? 1 : 0;
          const status = body.status === 'paused' ? 'paused' : 'active';

          if (env.DB) {
            if (!linkId) {
              // Global target upsert
              const existingGlobal = await env.DB.prepare(
                'SELECT id FROM target_alerts WHERE user_id = ? AND link_id IS NULL AND metric_type = ? LIMIT 1'
              ).bind(userId, metricType).first().catch(() => null);

              if (existingGlobal) {
                await env.DB.prepare(`
                  UPDATE target_alerts
                  SET metric_type = ?, target_value = ?, limit_value = ?, notify_email = ?, notify_bell = ?, channel = ?, status = ?, updated_at = datetime('now')
                  WHERE id = ?
                `).bind(metricType, targetValue, targetValue, notifyEmail, notifyBell, (notifyEmail && notifyBell) ? 'both' : notifyEmail ? 'email' : 'none', status, existingGlobal.id).run();
                return jsonResponse({
                  success: true,
                  data: { id: existingGlobal.id, userId, linkId: null, metricType, period: 'month', targetValue, notifyExpired: false, notifyEmail: Boolean(notifyEmail), notifyBell: Boolean(notifyBell), status },
                });
              }
            }

            await env.DB.prepare(`
              INSERT INTO target_alerts (
                id, user_id, link_id, title, metric_type,
                limit_value, target_value, period,
                notify_expiration, notify_expired,
                channel, notify_email, notify_bell, schedule, status,
                created_at, updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'instantly', ?, datetime('now'), datetime('now'))
            `).bind(
              id, userId, linkId, body.title || (linkId ? 'Link Target Alert' : 'Global Target Alert'), metricType,
              targetValue, targetValue, period,
              notifyExpired, notifyExpired,
              (notifyEmail && notifyBell) ? 'both' : notifyEmail ? 'email' : notifyBell ? 'in_app' : 'none',
              notifyEmail, notifyBell, status
            ).run();
          }

          return jsonResponse({
            success: true,
            data: { id, userId, linkId, metricType, period, targetValue, notifyExpired: Boolean(notifyExpired), notifyEmail: Boolean(notifyEmail), notifyBell: Boolean(notifyBell), status },
          }, 201);
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }

      // PATCH — Update existing target
      if (method === 'PATCH' && targetId) {
        try {
          const body = await request.json();
          if (env.DB) {
            const updates = [];
            const bindings = [];

            if (body.metricType) { updates.push('metric_type = ?'); bindings.push(body.metricType); }
            if (body.period && ['day', 'week', 'month'].includes(body.period)) { updates.push('period = ?'); bindings.push(body.period); }
            if (body.targetValue !== undefined) {
              updates.push('target_value = ?', 'limit_value = ?');
              bindings.push(Number(body.targetValue), Number(body.targetValue));
            }
            if (body.notifyExpired !== undefined) {
              updates.push(
                'notify_expired = CASE WHEN link_id IS NULL THEN 0 ELSE ? END',
                'notify_expiration = CASE WHEN link_id IS NULL THEN 0 ELSE ? END'
              );
              bindings.push(body.notifyExpired ? 1 : 0, body.notifyExpired ? 1 : 0);
            }
            if (body.notifyEmail !== undefined) { updates.push('notify_email = ?'); bindings.push(body.notifyEmail ? 1 : 0); }
            if (body.notifyBell !== undefined) { updates.push('notify_bell = ?'); bindings.push(body.notifyBell ? 1 : 0); }
            if (body.notifyEmail !== undefined || body.notifyBell !== undefined) {
              const hasEmail = body.notifyEmail !== false;
              const hasBell = body.notifyBell !== false;
              updates.push('channel = ?');
              bindings.push((hasEmail && hasBell) ? 'both' : hasEmail ? 'email' : hasBell ? 'in_app' : 'none');
            }
            if (body.status !== undefined) { updates.push('status = ?'); bindings.push(body.status); }
            updates.push("updated_at = datetime('now')");

            bindings.push(targetId);
            await env.DB.prepare(`
              UPDATE target_alerts SET ${updates.join(', ')} WHERE id = ?
            `).bind(...bindings).run();
          }

          return jsonResponse({ success: true, updated: targetId });
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }

      // DELETE — Delete target
      if (method === 'DELETE' && targetId) {
        try {
          if (env.DB) {
            const existing = await env.DB.prepare('SELECT link_id FROM target_alerts WHERE id = ?').bind(targetId).first().catch(() => null);
            if (existing && !existing.link_id) {
              return jsonResponse({ success: false, error: 'Global workspace target cannot be deleted' }, 400);
            }
            await env.DB.prepare('DELETE FROM target_alerts WHERE id = ? AND link_id IS NOT NULL').bind(targetId).run();
          }
          return jsonResponse({ success: true, deleted: targetId });
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }
    }

    // ─── UPLOAD IMAGE API (KV Cloud Storage) ──────────────────────────────
    if ((path === '/api/v1/upload-image' || path === '/api/upload-image') && method === 'POST') {
      const authErr = requireAuth();
      if (authErr) return authErr;

      try {
        const body = await request.json().catch(() => ({}));
        const base64Data = body?.data || body?.image || '';
        if (!base64Data) {
          return jsonResponse({ success: false, error: 'No image data provided' }, 400);
        }
        const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        if (env.LINKS_KV) {
          await env.LINKS_KV.put(imageId, JSON.stringify({ og_image: base64Data }), {
            expirationTtl: 31536000,
          });
        }
        return jsonResponse({
          success: true,
          imageId,
          url: `https://${url.host}/api/v1/images/${imageId}.jpg`,
        });
      } catch (err) {
        return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
      }
    }

    // ─── PIXELS API (Cloud Storage) ───────────────────────────────────────
    if (path === '/api/v1/pixels' || path === '/api/pixels' || path.startsWith('/api/v1/pixels/')) {
      const authErr = requireAuth();
      if (authErr) return authErr;

      const userId = url.searchParams.get('userId') || request.headers.get('x-user-id') || 'usr_default';
      const kvKey = `pixels:${userId}`;

      if (method === 'GET') {
        let pixels = [];
        if (env.LINKS_KV) {
          const cached = await env.LINKS_KV.get(kvKey);
          if (cached) {
            try { pixels = JSON.parse(cached); } catch {}
          }
        }
        return jsonResponse({ success: true, data: { pixels } });
      }

      if (method === 'POST') {
        try {
          const body = await request.json().catch(() => ({}));
          const newPixel = {
            id: body.id || `px_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId,
            name: body.name || 'Pixel',
            type: body.type || 'meta',
            pixelId: body.pixelId || body.pixel_id || '',
            createdAt: new Date().toISOString(),
          };
          let pixels = [];
          if (env.LINKS_KV) {
            const cached = await env.LINKS_KV.get(kvKey);
            if (cached) {
              try { pixels = JSON.parse(cached); } catch {}
            }
            pixels.unshift(newPixel);
            await env.LINKS_KV.put(kvKey, JSON.stringify(pixels));
          }
          return jsonResponse({ success: true, data: newPixel }, 201);
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }

      if (method === 'PATCH') {
        try {
          const targetId = path.split('/').pop() || '';
          const body = await request.json().catch(() => ({}));
          let pixels = [];
          if (env.LINKS_KV) {
            const cached = await env.LINKS_KV.get(kvKey);
            if (cached) {
              try { pixels = JSON.parse(cached); } catch {}
            }
            pixels = pixels.map((p) => (p.id === targetId ? { ...p, ...body, updatedAt: new Date().toISOString() } : p));
            await env.LINKS_KV.put(kvKey, JSON.stringify(pixels));
          }
          return jsonResponse({ success: true, updated: targetId });
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }

      if (method === 'DELETE') {
        const targetId = path.split('/').pop() || url.searchParams.get('id') || '';
        if (env.LINKS_KV && targetId) {
          const cached = await env.LINKS_KV.get(kvKey);
          if (cached) {
            try {
              let pixels = JSON.parse(cached);
              pixels = pixels.filter((p) => p.id !== targetId);
              await env.LINKS_KV.put(kvKey, JSON.stringify(pixels));
            } catch {}
          }
        }
        return jsonResponse({ success: true, deleted: targetId });
      }
    }

    // ─── WEBHOOKS API (Cloud Storage) ─────────────────────────────────────
    if (path === '/api/v1/webhooks' || path === '/api/webhooks' || path.startsWith('/api/v1/webhooks/')) {
      const authErr = requireAuth();
      if (authErr) return authErr;

      const userId = url.searchParams.get('userId') || request.headers.get('x-user-id') || 'usr_default';
      const kvKey = `webhooks:${userId}`;

      if (method === 'GET') {
        let webhooks = [];
        if (env.LINKS_KV) {
          const cached = await env.LINKS_KV.get(kvKey);
          if (cached) {
            try { webhooks = JSON.parse(cached); } catch {}
          }
        }
        return jsonResponse({ success: true, data: webhooks });
      }

      if (method === 'POST') {
        try {
          const body = await request.json().catch(() => ({}));
          const newWebhook = {
            id: body.id || `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId,
            name: body.name || 'Webhook',
            url: body.url || '',
            events: body.events || ['click'],
            isActive: body.isActive !== false,
            createdAt: new Date().toISOString(),
          };
          let webhooks = [];
          if (env.LINKS_KV) {
            const cached = await env.LINKS_KV.get(kvKey);
            if (cached) {
              try { webhooks = JSON.parse(cached); } catch {}
            }
            webhooks.unshift(newWebhook);
            await env.LINKS_KV.put(kvKey, JSON.stringify(webhooks));
          }
          return jsonResponse({ success: true, data: newWebhook }, 201);
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }

      if (method === 'PATCH') {
        try {
          const targetId = path.split('/').pop() || '';
          const body = await request.json().catch(() => ({}));
          let webhooks = [];
          if (env.LINKS_KV) {
            const cached = await env.LINKS_KV.get(kvKey);
            if (cached) {
              try { webhooks = JSON.parse(cached); } catch {}
            }
            webhooks = webhooks.map((w) => (w.id === targetId ? { ...w, ...body, updatedAt: new Date().toISOString() } : w));
            await env.LINKS_KV.put(kvKey, JSON.stringify(webhooks));
          }
          return jsonResponse({ success: true, updated: targetId });
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }

      if (method === 'DELETE') {
        const targetId = path.split('/').pop() || url.searchParams.get('id') || '';
        if (env.LINKS_KV && targetId) {
          const cached = await env.LINKS_KV.get(kvKey);
          if (cached) {
            try {
              let webhooks = JSON.parse(cached);
              webhooks = webhooks.filter((w) => w.id !== targetId);
              await env.LINKS_KV.put(kvKey, JSON.stringify(webhooks));
            } catch {}
          }
        }
        return jsonResponse({ success: true, deleted: targetId });
      }
    }

    // ─── USER API KEYS (/api/v1/users/:userId/keys) ───────────────────────
    if (path.includes('/keys') && (path.startsWith('/api/v1/users/') || path.startsWith('/api/users/'))) {
      const authErr = requireAuth();
      if (authErr) return authErr;

      const segments = path.split('/').filter(Boolean);
      const usersIdx = segments.indexOf('users');
      const userId = usersIdx !== -1 ? decodeURIComponent(segments[usersIdx + 1] || '') : '';
      const keyId = segments.length > usersIdx + 3 ? decodeURIComponent(segments[usersIdx + 3]) : null;

      const kvKey = `user_keys:${userId}`;

      if (method === 'GET') {
        let keysList = [];
        if (env.LINKS_KV) {
          const cached = await env.LINKS_KV.get(kvKey);
          if (cached) {
            try { keysList = JSON.parse(cached); } catch {}
          }
        }
        return jsonResponse({ success: true, data: keysList });
      }

      if (method === 'POST') {
        try {
          const body = await request.json().catch(() => ({}));
          const newKey = {
            id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId,
            name: body.name || 'Clé API',
            scope: body.scope || 'read_write',
            key: `lsh_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`,
            createdAt: new Date().toISOString(),
            lastUsedAt: null,
          };
          let keysList = [];
          if (env.LINKS_KV) {
            const cached = await env.LINKS_KV.get(kvKey);
            if (cached) {
              try { keysList = JSON.parse(cached); } catch {}
            }
            keysList.unshift(newKey);
            await env.LINKS_KV.put(kvKey, JSON.stringify(keysList));
          }
          return jsonResponse({ success: true, data: newKey }, 201);
        } catch (err) {
          return jsonResponse({ success: false, error: String(err?.message || err) }, 500);
        }
      }

      if (method === 'DELETE' && keyId) {
        if (env.LINKS_KV) {
          const cached = await env.LINKS_KV.get(kvKey);
          if (cached) {
            try {
              let keysList = JSON.parse(cached);
              keysList = keysList.filter((k) => k.id !== keyId);
              await env.LINKS_KV.put(kvKey, JSON.stringify(keysList));
            } catch {}
          }
        }
        return jsonResponse({ success: true, deleted: keyId });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

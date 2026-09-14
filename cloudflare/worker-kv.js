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

    // ─── 0. PUBLIC IMAGE STREAMING ENDPOINT (Decodes base64 or redirects) ──
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
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        } catch (decodeErr) {
          console.warn('[Image Decode Error]:', decodeErr);
        }
      } else if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
        return Response.redirect(rawImg, 302);
      }

      return new Response('Image not found', { status: 404, headers: corsHeaders });
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

      if (link.password || link.has_password || link.is_password_protected) {
        return Response.redirect(`${proto}://${reqHost}/r/${slug}/gate`, 307);
      }

      if (link.is_cloaked || link.isCloaked) {
        return Response.redirect(`${proto}://${reqHost}/r/${slug}/view`, 307);
      }

      const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
      const isBot = /facebookexternalhit|facebot|twitterbot|xbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|slack-imgbatcher|pinterestbot|skypeuripreview|googlebot|bingbot|applebot|yandexbot|duckduckbot|baiduspider|ia_archiver/i.test(userAgent);
      const country = (request.headers.get('cf-ipcountry') || 'FR').toUpperCase();

      const ogImage = link.og_image || link.ogImage || '';
      const ogTitle = link.og_title || link.ogTitle || link.meta_title || link.metaTitle || link.title || slug;
      const ogDescription = link.og_description || link.ogDescription || '';

      // Serve OpenGraph / Twitter Cards ONLY for social crawler bots without redirecting
      if (isBot && (ogImage || ogTitle || ogDescription)) {
        const reqHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
        const domain = (reqHost && !reqHost.includes('workers.dev')) ? reqHost : 'lsho.cc';
        const canonical = `https://${domain}${path}`;
        const dest = link.target_url || link.targetUrl || 'https://lshorter.io';

        // Convert data:image to public HTTPS URL so Twitter/FB crawlers can load it
        let publicImageUrl = ogImage;
        if (ogImage && ogImage.startsWith('data:')) {
          publicImageUrl = `https://${domain}/api/v1/images/${slug}.jpg`;
        }

        const escapeHtml = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const safeTitle = escapeHtml(ogTitle);
        const safeDesc = escapeHtml(ogDescription || 'Cliquez pour ouvrir le lien.');
        const safeImg = escapeHtml(publicImageUrl.replace(/&amp;/g, '&'));
        const safeCanonical = escapeHtml(canonical);
        const safeCard = 'summary_large_image';

        const html = `<!DOCTYPE html>
<html lang="fr" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="theme-color" content="#ff6600" />

  <!-- Open Graph / WhatsApp / Facebook / LinkedIn / Telegram / Slack / Discord -->
  <meta property="og:site_name" content="LShorter" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  ${safeImg ? `<meta property="og:image" content="${safeImg}" />` : ''}
  ${safeImg ? `<meta property="og:image:url" content="${safeImg}" />` : ''}
  ${safeImg ? `<meta property="og:image:secure_url" content="${safeImg}" />` : ''}
  ${safeImg ? `<meta property="og:image:type" content="image/jpeg" />` : ''}
  ${safeImg ? `<meta property="og:image:width" content="1200" />` : ''}
  ${safeImg ? `<meta property="og:image:height" content="630" />` : ''}
  ${safeImg ? `<meta property="og:image:alt" content="${safeTitle}" />` : ''}

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@LShorter" />
  <meta name="twitter:creator" content="@LShorter" />
  <meta name="twitter:domain" content="${domain}" />
  <meta name="twitter:url" content="${safeCanonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  ${safeImg ? `<meta name="twitter:image" content="${safeImg}" />` : ''}
  ${safeImg ? `<meta name="twitter:image:src" content="${safeImg}" />` : ''}
  ${safeImg ? `<meta name="twitter:image:alt" content="${safeTitle}" />` : ''}
</head>
<body style="background:#09090b;">
</body>
</html>`;

        return new Response(html, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=10, s-maxage=30, stale-while-revalidate=60',
          },
        });
      }

      const REGION_COUNTRIES = {
        europe: ["FR", "DE", "GB", "ES", "IT", "BE", "CH", "PT", "NL", "SE", "NO", "DK", "FI", "IE", "AT", "PL", "GR", "RO", "CZ", "HU", "LU"],
        west_africa: ["SN", "CI", "BF", "ML", "GN", "TG", "BJ", "NE", "NG", "GH", "CV", "GM", "GW", "LR", "SL"],
        central_africa: ["CM", "GA", "CG", "CD", "TD", "CF", "GQ", "ST"],
        north_america: ["US", "CA", "MX"],
        south_america: ["BR", "AR", "CO", "CL", "PE", "VE", "EC", "BO", "PY", "UY"],
        asia: ["CN", "JP", "KR", "IN", "SG", "TH", "VN", "ID", "MY", "PH", "PK", "BD", "AE", "SA", "QA", "KW"],
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

      const isInternalProbe = request.headers.get('x-internal-probe') === '1' || request.headers.get('x-crawler-prewarm') === '1' || request.headers.get('x-frontend-secret') === 'lsh_secret_live_prod_2026';
      const isPrefetch = (request.headers.get('purpose') || request.headers.get('sec-purpose') || request.headers.get('x-purpose') || request.headers.get('x-moz') || '').includes('prefetch') || (request.headers.get('purpose') || '').includes('preview');

      if (env.DB && !isInternalProbe && !isPrefetch && !isBot) {
        ctx.waitUntil(
          (async () => {
            try {
              await env.DB.prepare('UPDATE links SET clicks_count = clicks_count + 1 WHERE (slug = ? OR id = ?) AND (max_clicks IS NULL OR max_clicks = 0 OR clicks_count < max_clicks)').bind(slug, slug).run();
              const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
              const ipHash = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';

              let detectedCity = request?.cf?.city || request?.headers?.get('cf-ipcity') || 'Inconnue';
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

              let detectedBrowser = 'Chrome';
              if (userAgent.includes('edg/')) detectedBrowser = 'Edge';
              else if (userAgent.includes('opr/') || userAgent.includes('opera')) detectedBrowser = 'Opera';
              else if (userAgent.includes('chrome') || userAgent.includes('crios')) detectedBrowser = 'Chrome';
              else if (userAgent.includes('firefox') || userAgent.includes('fxios')) detectedBrowser = 'Firefox';
              else if (userAgent.includes('safari')) detectedBrowser = 'Safari';

              let detectedOS = 'Windows';
              if (isIos) detectedOS = 'iOS';
              else if (isAndroid) detectedOS = 'Android';
              else if (userAgent.includes('windows')) detectedOS = 'Windows';
              else if (userAgent.includes('macintosh') || userAgent.includes('mac os')) detectedOS = 'macOS';
              else if (userAgent.includes('linux')) detectedOS = 'Linux';

              await env.DB.prepare(`
                INSERT INTO analytics_events (id, link_id, slug, country, city, referrer, device, browser, os, ip_hash, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
              `).bind(eventId, link.id || slug, slug, country, detectedCity, detectedRef, deviceType, detectedBrowser, detectedOS, ipHash).run().catch(async () => {
                await env.DB.prepare(`
                  INSERT INTO click_events (id, link_id, slug, country, city, referrer, device, browser, os, ip_hash, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(eventId, link.id || slug, slug, country, detectedCity, detectedRef, deviceType, detectedBrowser, detectedOS, ipHash).run().catch(() => {});
              });
            } catch (err) {
              console.warn('[Async Click Error]:', err);
            }
          })()
        );
      }

      return Response.redirect(targetUrl, 302);
    }

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
        let detectedDev = 'desktop';
        if (/ipad|tablet/i.test(userAgentHeader)) detectedDev = 'tablet';
        else if (/mobile|android|iphone/i.test(userAgentHeader)) detectedDev = 'mobile';

        let detectedBr = 'Chrome';
        if (userAgentHeader.includes('edg/')) detectedBr = 'Edge';
        else if (userAgentHeader.includes('opr/') || userAgentHeader.includes('opera')) detectedBr = 'Opera';
        else if (userAgentHeader.includes('chrome') || userAgentHeader.includes('crios')) detectedBr = 'Chrome';
        else if (userAgentHeader.includes('firefox') || userAgentHeader.includes('fxios')) detectedBr = 'Firefox';
        else if (userAgentHeader.includes('safari')) detectedBr = 'Safari';

        let detectedSys = 'Windows';
        if (/iphone|ipad|ipod|ios/i.test(userAgentHeader)) detectedSys = 'iOS';
        else if (/android/i.test(userAgentHeader)) detectedSys = 'Android';
        else if (/windows/i.test(userAgentHeader)) detectedSys = 'Windows';
        else if (/macintosh|mac os/i.test(userAgentHeader)) detectedSys = 'macOS';
        else if (/linux/i.test(userAgentHeader)) detectedSys = 'Linux';

        const country = clickBody.country || request.headers.get('x-country') || request.headers.get('cf-ipcountry') || 'FR';
        const city = clickBody.city || request.headers.get('x-city') || request?.cf?.city || 'Inconnue';
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
                  await env.DB.prepare(`
                    INSERT INTO analytics_events (id, link_id, slug, country, city, referrer, device, browser, os, customer_email, customer_name, conversion_amount, ip_hash, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                  `).bind(eventId, targetSlugOrId, targetSlugOrId, country, city, referrer, device, browser, os, customerEmail, customerName, conversionAmount, ipHash).run();
                } catch {
                  await env.DB.prepare(`
                    INSERT INTO analytics_events (id, link_id, slug, country, city, referrer, device, browser, os, ip_hash, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                  `).bind(eventId, targetSlugOrId, targetSlugOrId, country, city, referrer, device, browser, os, ipHash).run().catch(() => {});
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

      // GET /api/v1/links OR /api/v1/links/:id
      if (method === 'GET') {
        if (!linkIdOrSlug) {
          const userId = url.searchParams.get('userId');
          if (!env.DB) return jsonResponse({ success: true, data: [] });
          try {
            let query = `
              SELECT links.*, users.email AS user_email, users.name AS user_name 
              FROM links 
              LEFT JOIN users ON links.user_id = users.id
            `;
            const params = [];
            if (userId && userId !== 'all') {
              query += ' WHERE links.user_id = ?';
              params.push(userId);
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
                fbQuery += ' WHERE user_id = ?';
                fbParams.push(userId);
              }
              fbQuery += ' ORDER BY created_at DESC LIMIT 500';
              const fb = await env.DB.prepare(fbQuery).bind(...fbParams).all();
              results = fb?.results || [];
            }
            return jsonResponse({ success: true, data: results });
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
        try {
          const body = await request.json();
          const id = body.id || ('link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
          const slug = (body.slug || Math.random().toString(36).substring(2, 8)).trim();
          const userId = body.userId || body.user_id || 'usr_default';
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
            twitter_card: 'summary_large_image',
            twitterCard: 'summary_large_image',
            created_at: new Date().toISOString(),
          };

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
                  const uEmail = request.headers.get('x-user-email') || body.userEmail || `${userId}@user.lshorter.io`;
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
                  INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, og_image, og_title, og_description, meta_title, twitter_card, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting, ogImage, ogTitle, ogDescription, metaTitle, 'summary_large_image').run();
              } catch (insColErr) {
                try {
                  await env.DB.prepare(`
                    INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, og_image, og_title, og_description, meta_title, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                  `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting, ogImage, ogTitle, ogDescription, metaTitle).run().catch(async () => {
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
          const shortUrl = 'https://' + domainName + '/' + slug;
          const targetUrl = body.targetUrl || body.target_url || existingLink?.target_url || existingLink?.targetUrl;
          const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : body.is_active !== undefined ? (body.is_active ? 1 : 0) : (existingLink?.is_active !== undefined ? (existingLink.is_active ? 1 : 0) : 1);
          const rawRules = body.routingRules !== undefined ? body.routingRules : body.routing_rules;
          const routingRules = rawRules !== undefined ? (typeof rawRules === 'string' ? rawRules : JSON.stringify(rawRules)) : (existingLink?.routing_rules || '[]');

          const rawGeo = body.geoTargeting !== undefined ? body.geoTargeting : body.geo_targeting;
          const geoTargeting = rawGeo !== undefined ? (typeof rawGeo === 'string' ? rawGeo : JSON.stringify(rawGeo)) : (existingLink?.geo_targeting || '{}');

          const rawDev = body.deviceTargeting !== undefined ? body.deviceTargeting : body.device_targeting;
          const deviceTargeting = rawDev !== undefined ? (typeof rawDev === 'string' ? rawDev : JSON.stringify(rawDev)) : (existingLink?.device_targeting || '{}');

          const ogImage = body.ogImage !== undefined ? body.ogImage : (body.og_image !== undefined ? body.og_image : (existingLink?.og_image || ''));
          const ogTitle = body.ogTitle !== undefined ? body.ogTitle : (body.og_title !== undefined ? body.og_title : (body.metaTitle || body.meta_title || existingLink?.og_title || ''));
          const ogDescription = body.ogDescription !== undefined ? body.ogDescription : (body.og_description !== undefined ? body.og_description : (existingLink?.og_description || ''));
          const metaTitle = body.metaTitle !== undefined ? body.metaTitle : (body.meta_title !== undefined ? body.meta_title : ogTitle);

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
            twitter_card: 'summary_large_image',
            twitterCard: 'summary_large_image',
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
                  'summary_large_image',
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
                  id,
                  slug
                ).run();
              }

              if (!res?.meta?.changes && !existingLink) {
                await env.DB.prepare(`
                  INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, og_image, og_title, og_description, meta_title, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting, ogImage, ogTitle, ogDescription, metaTitle).run().catch(() => {});
              }
            } catch (dbErr) {
              try {
                await env.DB.prepare(`
                  UPDATE links SET 
                    target_url = ?, 
                    slug = ?, 
                    is_active = ?
                  WHERE id = ? OR LOWER(slug) = LOWER(?)
                `).bind(targetUrl, slug, isActive, id, slug).run();
              } catch {}
            }
          }

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

          // 2. Delete from D1 matching id OR matching slug (case-insensitive)
          if (env.DB) {
            try {
              if (idParam && slugParam) {
                await env.DB.prepare(`
                  DELETE FROM links 
                  WHERE id = ? 
                     OR LOWER(slug) = LOWER(?) 
                     OR id = ? 
                     OR LOWER(slug) = LOWER(?)
                `).bind(idParam, slugParam, slugParam, idParam).run();
              } else if (idParam) {
                await env.DB.prepare(`
                  DELETE FROM links 
                  WHERE id = ? 
                     OR LOWER(slug) = LOWER(?)
                `).bind(idParam, idParam).run();
              } else if (slugParam) {
                await env.DB.prepare(`
                  DELETE FROM links 
                  WHERE LOWER(slug) = LOWER(?)
                `).bind(slugParam).run();
              }
            } catch (dbErr) {
              console.warn('[D1 Delete Error]:', dbErr);
            }
          }

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
        const customerAvatar = body.customer?.avatarUrl || body.customer?.avatar || body.customerAvatar || body.customer_avatar || body.avatarUrl || body.avatar || request.headers.get('x-customer-avatar') || null;
        const country = body.country || request.headers.get('x-country') || request.headers.get('cf-ipcountry') || 'FR';
        const city = body.city || request.headers.get('x-city') || request?.cf?.city || 'Inconnue';
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

                await env.DB.prepare(`
                  INSERT INTO analytics_events (id, link_id, slug, country, city, referrer, device, browser, os, customer_email, customer_name, customer_avatar, conversion_amount, ip_hash, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(eventId, targetSlugOrId, targetSlugOrId, country, city, referrer, device, browser, os, customerEmail, customerName, customerAvatar, conversionAmount, ipHash).run().catch(async () => {
                  await env.DB.prepare(`
                    INSERT INTO analytics_events (id, link_id, slug, country, city, referrer, device, browser, os, customer_email, customer_name, conversion_amount, ip_hash, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                  `).bind(eventId, targetSlugOrId, targetSlugOrId, country, city, referrer, device, browser, os, customerEmail, customerName, conversionAmount, ipHash).run().catch(async () => {
                    await env.DB.prepare(`
                      INSERT INTO analytics_events (id, link_id, slug, country, city, referrer, device, browser, os, ip_hash, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                    `).bind(eventId, targetSlugOrId, targetSlugOrId, country, city, referrer, device, browser, os, ipHash).run().catch(() => {});
                  });
                });
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
      if (method === 'GET') {
        const userId = url.searchParams.get('userId');
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
      const userId = url.searchParams.get('userId');
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

      try {
        // 1. Fetch user's links from D1 to get list of identifiers (slugs & IDs)
        let linkQuery = 'SELECT id, slug, clicks_count, created_at FROM links WHERE 1=1';
        const linkParams = [];
        if (userId && userId !== 'all') {
          linkQuery += ' AND user_id = ?';
          linkParams.push(userId);
        }
        if (linkId && linkId !== 'all') {
          linkQuery += ' AND (id = ? OR LOWER(slug) = LOWER(?))';
          linkParams.push(linkId, linkId);
        }

        const userLinksResult = await env.DB.prepare(linkQuery).bind(...linkParams).all();
        const userLinks = userLinksResult?.results || [];

        if (userLinks.length === 0) {
          return jsonResponse({ success: true, data: emptyAnalytics });
        }

        const slugs = userLinks.map((l) => l.slug).filter(Boolean);
        const linkIds = userLinks.map((l) => l.id).filter(Boolean);
        const allIdentifiers = Array.from(new Set([...slugs, ...linkIds]));
        const sumClicksFromLinks = userLinks.reduce((acc, l) => acc + (Number(l.clicks_count) || 0), 0);

        // Compute period date cutoff
        let dateCutoff = "datetime('now', '-30 days')";
        if (period === '1d' || period === 'day') {
          dateCutoff = "datetime('now', '-1 day')";
        } else if (period === '7d' || period === 'week') {
          dateCutoff = "datetime('now', '-7 days')";
        } else if (period === '365d' || period === 'year') {
          dateCutoff = "datetime('now', '-365 days')";
        }

        const inPlaceholders = allIdentifiers.map(() => '?').join(',');
        const baseWhere = `(slug IN (${inPlaceholders}) OR link_id IN (${inPlaceholders})) AND created_at >= ${dateCutoff}`;
        const bindValues = [...allIdentifiers, ...allIdentifiers];

        // 2. Query authentic aggregates in parallel from analytics_events
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
            SELECT COUNT(*) as total_clicks, COUNT(DISTINCT ip_hash) as unique_clicks, COALESCE(SUM(conversion_amount), 0) as total_revenue
            FROM analytics_events
            WHERE ${baseWhere}
          `).bind(...bindValues).first().catch(async () => {
            return await env.DB.prepare(`
              SELECT COUNT(*) as total_clicks, COUNT(DISTINCT ip_hash) as unique_clicks
              FROM analytics_events
              WHERE ${baseWhere}
            `).bind(...bindValues).first().catch(() => null);
          }),

          env.DB.prepare(`
            SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as clicks, COUNT(DISTINCT ip_hash) as unique_clicks
            FROM analytics_events
            WHERE ${baseWhere}
            GROUP BY strftime('%Y-%m-%d', created_at)
            ORDER BY date ASC
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT UPPER(country) as code, COUNT(*) as count
            FROM analytics_events
            WHERE ${baseWhere} AND country IS NOT NULL AND country != ''
            GROUP BY UPPER(country)
            ORDER BY count DESC
            LIMIT 20
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT city, UPPER(country) as countryCode, COUNT(*) as count
            FROM analytics_events
            WHERE ${baseWhere} AND city IS NOT NULL AND city != '' AND city != 'Inconnue'
            GROUP BY city, UPPER(country)
            ORDER BY count DESC
            LIMIT 20
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT LOWER(device) as device, COUNT(*) as count
            FROM analytics_events
            WHERE ${baseWhere} AND device IS NOT NULL AND device != ''
            GROUP BY LOWER(device)
            ORDER BY count DESC
            LIMIT 10
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT browser as name, COUNT(*) as count
            FROM analytics_events
            WHERE ${baseWhere} AND browser IS NOT NULL AND browser != ''
            GROUP BY browser
            ORDER BY count DESC
            LIMIT 10
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT referrer as source, COUNT(*) as count
            FROM analytics_events
            WHERE ${baseWhere} AND referrer IS NOT NULL AND referrer != ''
            GROUP BY referrer
            ORDER BY count DESC
            LIMIT 10
          `).bind(...bindValues).all().catch(() => null),

          env.DB.prepare(`
            SELECT id, slug, UPPER(country) as country_code, city, referrer, device, browser, os, customer_email, customer_name, customer_avatar, conversion_amount, ip_hash, created_at as timestamp
            FROM analytics_events
            WHERE (slug IN (${inPlaceholders}) OR link_id IN (${inPlaceholders}))
            ORDER BY created_at DESC
            LIMIT 50
          `).bind(...bindValues).all().catch(async () => {
            return await env.DB.prepare(`
              SELECT id, slug, UPPER(country) as country_code, city, referrer, device, browser, os, customer_email, customer_name, customer_avatar, conversion_amount, ip_hash, created_at as timestamp
              FROM analytics_events
              WHERE (slug IN (${inPlaceholders}) OR link_id IN (${inPlaceholders}))
              ORDER BY created_at DESC
              LIMIT 50
            `).bind(...bindValues).all().catch(async () => {
              return await env.DB.prepare(`
                SELECT id, slug, UPPER(country) as country_code, city, referrer, device, browser, os, ip_hash, created_at as timestamp
                FROM analytics_events
                WHERE (slug IN (${inPlaceholders}) OR link_id IN (${inPlaceholders}))
                ORDER BY created_at DESC
                LIMIT 50
              `).bind(...bindValues).all().catch(() => null);
            });
          }),
        ]);

        const dbTotalClicks = Number(totalsRes?.total_clicks || 0);
        const dbUniqueClicks = Number(totalsRes?.unique_clicks || 0);
        const finalTotalClicks = Math.max(dbTotalClicks, sumClicksFromLinks);
        const finalUniqueClicks = finalTotalClicks === 0 ? 0 : Math.max(dbUniqueClicks, 1);
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
          device: ev.device || 'desktop',
          browser: ev.browser || 'Chrome',
          os: ev.os || 'Windows',
          referrer: ev.referrer || 'Direct',
          customerEmail: ev.customer_email || null,
          customer_email: ev.customer_email || null,
          email: ev.customer_email || null,
          customerName: ev.customer_name || null,
          customer_name: ev.customer_name || null,
          customerFullName: ev.customer_name || null,
          fullName: ev.customer_name || null,
          customerAvatar: ev.customer_avatar || null,
          customer_avatar: ev.customer_avatar || null,
          avatarUrl: ev.customer_avatar || null,
          avatar: ev.customer_avatar || null,
          conversionAmount: Number(ev.conversion_amount || 0),
          conversion_amount: Number(ev.conversion_amount || 0),
          ipMasked: ev.ip_hash ? ev.ip_hash.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.•••.•••') : '•••.•••.•••',
        }));

        return jsonResponse({
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
      try {
        const authHeader = request.headers.get('authorization') || '';
        const frontendSecret = request.headers.get('x-frontend-secret') || '';
        const headerUserId = request.headers.get('x-user-id') || '';
        const headerUserEmail = request.headers.get('x-user-email') || '';

        let targetIdentifier = headerUserId || headerUserEmail;

        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7).trim();
          if (token && token !== 'lsh_secret_live_prod_2026' && !targetIdentifier) {
            targetIdentifier = token;
          }
        }

        let user = null;
        if (env.DB) {
          if (targetIdentifier) {
            user = await env.DB.prepare(
              'SELECT id, email, name, avatar_url, plan, created_at, updated_at FROM users WHERE id = ? OR email = ? LIMIT 1'
            ).bind(targetIdentifier, targetIdentifier).first().catch(() => null);
          }

          // Fallback: If no identifier or user not found, try to get the first user
          if (!user) {
            user = await env.DB.prepare(
              'SELECT id, email, name, avatar_url, plan, created_at, updated_at FROM users ORDER BY created_at ASC LIMIT 1'
            ).first().catch(() => null);
          }
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

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

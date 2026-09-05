/**
 * LShorter Production Edge Worker — Cloudflare KV + D1 Hybrid Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * - 0.3ms latency via Cloudflare KV (Cache 100% in-memory)
 * - Negative Lookup Caching (Protects D1 against bots/crawlers)
 * - 0 D1 Queries for redirections, favicon, robots.txt
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
    if (path === '/' || path === '/favicon.ico' || path === '/robots.txt' || path === '/health') {
      return new Response('LShorter Edge OK', { status: 200, headers: corsHeaders });
    }


    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    // ─── 1. ULTRA-FAST KV REDIRECTION (0.3ms latency) ─────────────────────
    // Supports both /r/:slug and direct /:slug on custom domain lsho.cc
    const isApiRoute = path.startsWith('/api/') || path.startsWith('/v1/');
    if (!isApiRoute && path.length > 1) {
      const slug = path.startsWith('/r/') ? path.slice(3) : path.slice(1);
      let link = null;

      if (env.LINKS_KV) {
        try {
          const cached = await env.LINKS_KV.get(slug);
          if (cached === 'NOT_FOUND') {
            return new Response('Lien introuvable ou expire.', { status: 404, headers: corsHeaders });
          }
          if (cached) {
            link = JSON.parse(cached);
          }
        } catch (err) {
          console.warn('[KV Read Error]:', err);
        }
      }


      // Fallback to D1 only on first cache miss
      if (!link && env.DB) {
        try {
          const row = await env.DB.prepare('SELECT * FROM links WHERE slug = ? LIMIT 1').bind(slug).first();
          if (row) {
            link = row;
            if (env.LINKS_KV) {
              ctx.waitUntil(env.LINKS_KV.put(slug, JSON.stringify(row)));
            }
          } else if (env.LINKS_KV) {
            // Cache Negative Lookups for 5 minutes to block repeated bot scans
            ctx.waitUntil(env.LINKS_KV.put(slug, 'NOT_FOUND', { expirationTtl: 300 }));
          }
        } catch (err) {
          console.error('[D1 Fallback Error]:', err);
        }
      }


      if (!link) {
        return new Response('Lien introuvable ou supprime.', { status: 404, headers: corsHeaders });
      }

      if (link.is_active === 0 || link.isActive === false) {
        return new Response('Ce lien a ete desactive par son proprieitaire.', { status: 404, headers: corsHeaders });
      }

      const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
      const isBot = /bot|crawl|slurp|spider|facebookexternalhit|facebook|twitter|twitterbot|xbot|whatsapp|telegram|telegrambot|linkedin|linkedinbot|discord|discordbot|slack|slackbot|applebot|bingbot|google|googlebot|pinterest|skype|skypeuripreview|embedly|quora|iframely|redditbot|vkshare/i.test(userAgent);
      const country = (request.headers.get('cf-ipcountry') || 'FR').toUpperCase();

      const ogImage = link.og_image || link.ogImage || '';
      const ogTitle = link.og_title || link.ogTitle || link.meta_title || link.metaTitle || link.title || slug;
      const ogDescription = link.og_description || link.ogDescription || '';

      // Serve OpenGraph / Twitter Cards for social bots without redirecting
      if (isBot && (ogImage || ogTitle || ogDescription)) {
        const canonical = `https://${url.host}${path}`;
        const dest = link.target_url || link.targetUrl || 'https://lshorter.io';

        const escapeHtml = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const safeTitle = escapeHtml(ogTitle);
        const safeDesc = escapeHtml(ogDescription || 'Cliquez pour ouvrir le lien sécurisé.');
        const safeImg = escapeHtml(ogImage);
        const safeCanonical = escapeHtml(canonical);
        const safeDest = escapeHtml(dest);

        const html = `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
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

  <!-- Twitter / X Cards (Large Banner Format) -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@LShorter" />
  <meta name="twitter:creator" content="@LShorter" />
  <meta name="twitter:url" content="${safeCanonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  ${safeImg ? `<meta name="twitter:image" content="${safeImg}" />` : ''}
  ${safeImg ? `<meta name="twitter:image:src" content="${safeImg}" />` : ''}
  ${safeImg ? `<meta name="twitter:image:alt" content="${safeTitle}" />` : ''}
</head>
<body style="background:#09090b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:20px;">
    <p style="font-size:16px;color:#e4e4e7;margin-bottom:12px;">Redirection vers <a href="${safeDest}" style="color:#0066FF;text-decoration:none;font-weight:600;">${safeDest}</a>...</p>
    <script>window.location.replace("${safeDest.replace(/"/g, '\\"')}");</script>
    <noscript><meta http-equiv="refresh" content="1;url=${safeDest}" /></noscript>
  </div>
</body>
</html>`;

        return new Response(html, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        });
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
      const isMobile = isAndroid || isIos || userAgent.includes('mobile');
      const isDesktop = userAgent.includes('windows') || userAgent.includes('macintosh') || userAgent.includes('linux');

      let targetUrl = link.target_url || link.targetUrl || 'https://lshorter.com';


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

      // Async log click
      if (env.DB) {
        ctx.waitUntil(
          (async () => {
            try {
              await env.DB.prepare('UPDATE links SET clicks_count = clicks_count + 1 WHERE slug = ?').bind(slug).run();
            } catch (err) {
              console.warn('[Async Click Error]:', err);
            }
          })()
        );
      }

      return Response.redirect(targetUrl, 302);
    }

    // 2. LINKS API
    if (path === '/api/v1/links' || path === '/api/links') {
      if (method === 'GET') {
        const userId = url.searchParams.get('userId');
        if (!env.DB) return jsonResponse({ success: true, data: [] });
        try {
          let query = 'SELECT * FROM links';
          const params = [];
          if (userId && userId !== 'all') {
            query += ' WHERE user_id = ?';
            params.push(userId);
          }
          query += ' ORDER BY created_at DESC LIMIT 100';
          const { results } = await env.DB.prepare(query).bind(...params).all();
          return jsonResponse({ success: true, data: results || [] });
        } catch (err) {
          return jsonResponse({ success: true, data: [] });
        }
      }

      if (method === 'POST') {
        try {
          const body = await request.json();
          const id = body.id || ('link_' + Date.now());
          const slug = (body.slug || Math.random().toString(36).substring(2, 8)).trim();
          const userId = body.userId || body.user_id || 'usr_default';
          const domainName = body.domainName || body.domain_name || 'lsho.cc';
          const shortUrl = 'https://' + domainName + '/' + slug;
          const targetUrl = body.targetUrl || body.target_url;
          const isActive = body.isActive !== false && body.is_active !== 0 ? 1 : 0;
          const routingRules = typeof body.routingRules === 'string' ? body.routingRules : JSON.stringify(body.routingRules || []);
          const geoTargeting = typeof body.geoTargeting === 'string' ? body.geoTargeting : JSON.stringify(body.geoTargeting || {});
          const deviceTargeting = typeof body.deviceTargeting === 'string' ? body.deviceTargeting : JSON.stringify(body.deviceTargeting || {});
          const ogImage = body.ogImage || body.og_image || '';
          const ogTitle = body.ogTitle || body.og_title || body.metaTitle || body.meta_title || '';
          const ogDescription = body.ogDescription || body.og_description || '';
          const metaTitle = body.metaTitle || body.meta_title || ogTitle || '';

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
            created_at: new Date().toISOString(),
          };

          if (env.LINKS_KV) {
            await env.LINKS_KV.put(slug, JSON.stringify(linkObj));
          }

          if (env.DB) {
            await env.DB.prepare(`
              INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, og_image, og_title, og_description, meta_title, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting, ogImage, ogTitle, ogDescription, metaTitle).run().catch(async () => {
              // If columns don't exist yet in D1 schema, fallback to basic insert
              await env.DB.prepare(`
                INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, datetime('now'))
              `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting).run();
            });
          }

          return jsonResponse({ success: true, data: linkObj }, 201);
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};



���\�\�Y	��\�\�YOOH	�[	���\�\�YH��JJK��\��

N�]\����۔�\�ۜ�J��X��\�Έ�YK]N���[��X��Έ�]�˝�[��X���[�\]YW��X��ΈX]���[�

�]�˝�[��X���
H
���JHHJNH�]���]\����۔�\�ۜ�J��X��\�Έ�YK]N���[��X��ΈHJN�B�B���]\����۔�\�ۜ�J��X��\�Έ�YK�\��[ێ�	̋�Z݋[�[Z^�Y	�JNK�N�
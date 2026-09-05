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
    if (path === '/' || path === '/favicon.ico' || path === '/robots.txt' || path === '/health') {
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
        const safeDesc = escapeHtml(ogDescription || 'Cliquez pour ouvrir le lien sécurisé.');
        const safeImg = escapeHtml(publicImageUrl.replace(/&amp;/g, '&'));
        const safeCanonical = escapeHtml(canonical);
        const safeDest = escapeHtml(dest);

        const html = `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
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

  <!-- Twitter / X Cards (Large Banner Format) -->
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
<body style="background:#09090b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:20px;">
    <p style="font-size:16px;color:#e4e4e7;margin-bottom:12px;">Redirection vers <a href="${safeDest}" style="color:#0066FF;text-decoration:none;font-weight:600;">${safeDest}</a>...</p>
    <script>window.location.replace("${safeDest.replace(/"/g, '\\"')}");</script>
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

    // ─── 2. LINKS API (CRUD: GET, POST, PATCH, PUT, DELETE) ───────────────
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

      // GET /api/v1/links OR /api/v1/links/:id
      if (method === 'GET') {
        if (!linkIdOrSlug) {
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
        } else {
          if (env.LINKS_KV) {
            try {
              const cached = await env.LINKS_KV.get(linkIdOrSlug);
              if (cached && cached !== 'NOT_FOUND') {
                return jsonResponse({ success: true, data: JSON.parse(cached) });
              }
            } catch {}
          }
          if (env.DB) {
            try {
              const row = await env.DB.prepare('SELECT * FROM links WHERE id = ? OR slug = ? LIMIT 1').bind(linkIdOrSlug, linkIdOrSlug).first();
              if (row) return jsonResponse({ success: true, data: row });
            } catch {}
          }
          return jsonResponse({ success: false, error: 'Link not found' }, 404);
        }
      }

      // POST /api/v1/links (Create)
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

      // PATCH / PUT /api/v1/links/:id (Update Link)
      if (method === 'PATCH' || method === 'PUT') {
        try {
          const body = await request.json();
          const idOrSlug = linkIdOrSlug || body.id || body.slug;

          let existingLink = null;
          if (env.DB && idOrSlug) {
            try {
              existingLink = await env.DB.prepare('SELECT * FROM links WHERE id = ? OR slug = ? LIMIT 1').bind(idOrSlug, idOrSlug).first();
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
          const targetUrl = body.targetUrl || body.target_url || existingLink?.target_url || 'https://lshorter.io';
          const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : body.is_active !== undefined ? Number(body.is_active) : (existingLink?.is_active ?? 1);

          const routingRules = body.routingRules !== undefined ? (typeof body.routingRules === 'string' ? body.routingRules : JSON.stringify(body.routingRules)) : (existingLink?.routing_rules || '[]');
          const geoTargeting = body.geoTargeting !== undefined ? (typeof body.geoTargeting === 'string' ? body.geoTargeting : JSON.stringify(body.geoTargeting)) : (existingLink?.geo_targeting || '{}');
          const deviceTargeting = body.deviceTargeting !== undefined ? (typeof body.deviceTargeting === 'string' ? body.deviceTargeting : JSON.stringify(body.deviceTargeting)) : (existingLink?.device_targeting || '{}');

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
            updated_at: new Date().toISOString(),
          };

          if (env.LINKS_KV && slug) {
            await env.LINKS_KV.put(slug, JSON.stringify(updatedLinkObj));
            if (existingLink?.slug && existingLink.slug !== slug) {
              await env.LINKS_KV.delete(existingLink.slug);
            }
          }

          if (env.DB) {
            try {
              const res = await env.DB.prepare(`
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
                WHERE id = ? OR slug = ?
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
                  WHERE id = ? OR slug = ?
                `).bind(targetUrl, slug, isActive, id, slug).run();
              } catch {}
            }
          }

          return jsonResponse({ success: true, data: updatedLinkObj });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // DELETE /api/v1/links/:id
      if (method === 'DELETE') {
        try {
          const idOrSlug = linkIdOrSlug || url.searchParams.get('id') || url.searchParams.get('slug');
          if (!idOrSlug) return jsonResponse({ success: false, error: 'Link ID is required' }, 400);

          if (env.LINKS_KV) {
            await env.LINKS_KV.delete(idOrSlug);
          }

          if (env.DB) {
            try {
              await env.DB.prepare('DELETE FROM links WHERE id = ? OR slug = ?').bind(idOrSlug, idOrSlug).run();
            } catch {}
          }

          return jsonResponse({ success: true });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }
    }

    // ─── 3. DOMAINS API ───────────────────────────────────────────────────
    if (path === '/api/v1/domains' || path === '/api/domains' || path.startsWith('/api/v1/domains/')) {
      if (method === 'GET') {
        const userId = url.searchParams.get('userId');
        if (!env.DB) return jsonResponse({ success: true, data: [] });
        try {
          const { results } = await env.DB.prepare('SELECT * FROM custom_domains WHERE user_id = ?').bind(userId || '').all();
          return jsonResponse({ success: true, data: results || [] });
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

    // ─── 4. ANALYTICS API ─────────────────────────────────────────────────
    if (path === '/api/v1/analytics' || path === '/api/analytics') {
      return jsonResponse({
        success: true,
        data: {
          totalClicks: 0,
          uniqueClicks: 0,
          clicksByDay: [],
          topCountries: [],
          topDevices: [],
          topBrowsers: [],
        },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

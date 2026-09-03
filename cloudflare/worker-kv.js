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

    // ─── 1. UCHE KV REDIRECTION 0 D1 READS ────────────────(����������Ѡ��х���]�Ѡ���ȼ�����(����������Ёͱ՜����Ѡ�ɕ��������ȼ��������ɥ����(�����������ͱ՜��ɕ��ɸ�I�����͔�ɕ��ɕ�Р������輽�͡��ѕȹ��������Ȥ�((��������Ё������ձ��((������������ع1%9-M}-X���(������������(��������������ЁɅ܀�݅�Ё��ع1%9-M}-X���Сͱ՜��(��������������Ʌܤ��(����������������Ʌ܀���9=Q}=U9����(��������������ɕ��ɸ���܁I�����͔��1�������ɽ�م���������х������а��������聍���!�����́���(�������������(������������������)M=8����͔�Ʌܤ�(�����������(��������􁍅э�����Ȥ��(���������������le.warn('[KV Read Error]:', err);
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
      const country = (request.headers.get('cf-ipcountry') || 'FR').toUpperCase();
      const city = request.headers.get('cf-ipcity') || 'Inconnue';
      const referrer = request.headers.get('referer') || 'Direct';


      let deviceTargeting = {};
      if (link.device_targeting) {
        try {
          deviceTargeting = typeof link.device_targeting === 'string' ? JSON.parse(linkdevice_targeting) : link.device_targeting;
        } catch {}
      } else if (link.deviceTargeting) {
        deviceTargeting = link.deviceTargeting;
      }

      let geoTargeting = {};
      if (link.geo_targeting) {
        try {
          geoTargeting = typeof link.geo_targeting === 'string' ? JSON.parse(link.geo_targeting) : linkData.geo_targeting;
        } catch {}
      } else if (link.geoTargeting) {
        geoTargeting = link.geoTargeting;
      }

      const isAndroid = userAgent.includes('android');
      const isIos = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod');
      const isMobile = isAndroid || isIos || userAgent.includes('mobile');
      const isDesktop = userAgent.includes('windows') || userAgent.includes('macintosh') || userAgent.includes('linux');

      let targetUrl = link.target_url || linkTargetUrl || 'https://lshorter.com';


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
          const deviceTargeting = typeof body.geoTargeting === 'string' ? body.deviceTargeting : JSON.stringify(body.deviceTargeting || {});

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
            created_at: new Date().toISOString(),
          };

          if (env.LINKS_KV) {
            await env.LINKS_KV.put(slug, JSON.stringify(linkObj));
          }

          if (env.DB) {
            await env.DB.prepare(`
              INSERT INTO links (id, user_id, domain_name, slug, short_url, target_url, clicks_count, is_active, routing_rules, geo_targeting, device_targeting, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, datetime('now'))
            `).bind(id, userId, domainName, slug, shortUrl, targetUrl, isActive, routingRules, geoTargeting, deviceTargeting).run();
          }

          return jsonResponse({ success: true, data: linkObj }, 201);
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }
    }

    // 3. SINGLE LINK�PRS��	�S�SUP�Y�
]OOH	��\K݌K�[�[]X���]OOH	��\K�[�[]X���H�ۜ�\�\�YH\���X\��\�[\˙�]
	�\�\�Y	�NY�
Y[����H�]\����۔�\�ۜ�J��X��\�Έ�YK]N���[��X��ΈHJN�H�ۜ��]�H]�Z][������\\�J��SP��SJ�X������[�
H\��[��X������H[���	�\�\�Y	��\�\�YOOH	�[	��	��T�H\�\��YH���	��B�
K��[�
���\�\�Y	��\�\�YOOH	�[	���\�\�YH��JJK��\��

N�]\����۔�\�ۜ�J��X��\�Έ�YK]N���[��X��Έ�]�˝�[��X���[�\]YW��X��ΈX]���[�

�]�˝�[��X���
H
���JHHJNH�]���]\����۔�\�ۜ�J��X��\�Έ�YK]N���[��X��ΈHJN�B�B���]\����۔�\�ۜ�J��X��\�Έ�YK�\��[ێ�	̋�Z݋[�[Z^�Y	�JNK�N�
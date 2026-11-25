import vm from "vm";
import {
  buildPathLockBlockedHtml,
  buildPathLockHeadInjection,
  createPathLockContextCookie,
  getMergedUpstreamCookies,
  isReservedOriginCookie,
  parseProxyAssetFromPathname,
  rewriteHtmlForPathLock,
  verifyPathLockContextFromCookieHeader,
} from "@/lib/pathlock-proxy";

describe("PathLock Dynamic Routes Optimization & Integrity", () => {
  const prevSecret = process.env.FRONTEND_API_SECRET;

  beforeAll(() => {
    process.env.FRONTEND_API_SECRET = "test-pathlock-hmac-secret-key-2026";
  });

  afterAll(() => {
    if (prevSecret === undefined) {
      delete process.env.FRONTEND_API_SECRET;
    } else {
      process.env.FRONTEND_API_SECRET = prevSecret;
    }
  });

  test("parseProxyAssetFromPathname preserves percent-encoded dynamic route segments & trailing slashes", () => {
    const dynamicChunk = parseProxyAssetFromPathname(
      "/r/demo/proxy/__p/https/app.example.com/_next/static/chunks/app/products/%5Bid%5D/page-a1b2c3.js",
      "?v=1",
    );
    expect(dynamicChunk).not.toBeNull();
    expect(dynamicChunk?.url).toBe(
      "https://app.example.com/_next/static/chunks/app/products/%5Bid%5D/page-a1b2c3.js?v=1",
    );

    const catchAllChunk = parseProxyAssetFromPathname(
      "/r/demo/proxy/__p/https/app.example.com/_next/static/chunks/pages/%5B...slug%5D-999.js",
      "",
    );
    expect(catchAllChunk?.url).toBe(
      "https://app.example.com/_next/static/chunks/pages/%5B...slug%5D-999.js",
    );

    const trailingSlash = parseProxyAssetFromPathname(
      "/r/demo/proxy/__p/https/app.example.com/blog/my-post/",
      "?_rsc=abc123",
    );
    expect(trailingSlash?.url).toBe(
      "https://app.example.com/blog/my-post/?_rsc=abc123",
    );

    const rootWithoutSlash = parseProxyAssetFromPathname(
      "/r/demo/proxy/__p/https/app.example.com",
      "?_rsc=root123",
    );
    expect(rootWithoutSlash?.url).toBe(
      "https://app.example.com/?_rsc=root123",
    );

    const encodedTrailingSlash = parseProxyAssetFromPathname(
      "/r/demo/proxy/__p/https/app.example.com/docs/intro",
      "?_rsc=xyz&_plts=1",
    );
    expect(encodedTrailingSlash?.url).toBe(
      "https://app.example.com/docs/intro/?_rsc=xyz",
    );
  });

  test("HMAC-signed PathLock context cookie verifies validly, rejects tampering/wrong slug, and never leaks upstream", () => {
    const reqUrl = new URL("https://lsho.cc/r/shop-demo/proxy");
    const setCookie = createPathLockContextCookie(
      {
        slug: "shop-demo",
        targetUrl: "https://shop.example.com",
        hosts: ["shop.example.com", "cdn.example.com"],
      },
      reqUrl,
      "https",
      60_000,
    );
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain("lsh_pl_ctx=");
    expect(setCookie).toContain("Path=/r/shop-demo/proxy");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");

    const cookiePair = setCookie!.split(";")[0];
    expect(isReservedOriginCookie("lsh_pl_ctx")).toBe(true);
    expect(getMergedUpstreamCookies(`${cookiePair}; PHPSESSID=abc`)).toBe(
      "PHPSESSID=abc; __Secure-PHPSESSID=abc",
    );

    const verified = verifyPathLockContextFromCookieHeader(cookiePair, "shop-demo");
    expect(verified).not.toBeNull();
    expect(verified?.hosts).toEqual(["shop.example.com", "cdn.example.com"]);

    // Wrong slug must fail
    expect(verifyPathLockContextFromCookieHeader(cookiePair, "other-slug")).toBeNull();

    // Tampered token must fail
    expect(
      verifyPathLockContextFromCookieHeader(`${cookiePair}tampered`, "shop-demo"),
    ).toBeNull();
  });

  test("rewriteHtmlForPathLock rewrites data-srcset, inline style url(), strips SRI on proxied stylesheets, and rewrites importmaps", () => {
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="/assets/app.css" integrity="sha384-abc123" />
          <script type="importmap">{"imports":{"app":"/js/app.js"}}</script>
        </head>
        <body>
          <img data-src="/img/hero.jpg" data-srcset="/img/hero-1x.jpg 1x, /img/hero-2x.jpg 2x" />
          <div style="background-image: url('/img/bg.webp')"></div>
          <iframe src="/preview/base/preview-02"></iframe>
        </body>
      </html>
    `;
    const rewritten = rewriteHtmlForPathLock(
      html,
      "https://example.com/",
      "demo",
      ["example.com"],
    );

    expect(rewritten).toContain(
      `href="/r/demo/proxy/__p/https/example.com/assets/app.css"`,
    );
    expect(rewritten).not.toContain("sha384-abc123");
    expect(rewritten).toContain(
      `data-srcset="/r/demo/proxy/__p/https/example.com/img/hero-1x.jpg 1x, /r/demo/proxy/__p/https/example.com/img/hero-2x.jpg 2x"`,
    );
    expect(rewritten).toContain(
      `url('/r/demo/proxy/__p/https/example.com/img/bg.webp')`,
    );
    expect(rewritten).toContain(
      `"app":"/r/demo/proxy/__p/https/example.com/js/app.js"`,
    );
    expect(rewritten).toContain(
      `<iframe src="/r/demo/proxy?url=https%3A%2F%2Fexample.com%2Fpreview%2Fbase%2Fpreview-02&embed=1"></iframe>`,
    );
  });

  test("buildPathLockBlockedHtml notifies parent security gate without leaking raw target URL", () => {
    const html = buildPathLockBlockedHtml(
      "https://secret-saas.internal/admin",
      "Accès refusé",
    );
    expect(html).toContain("PATHLOCK_NAVIGATE");
    expect(html).toContain('"blocked":true');
    expect(html).not.toContain("Ouvrir le lien directement");
  });

  test("buildPathLockHeadInjection produces valid JS, handles URL objects in fetch(), rewrites res.url, drops blocked prefetches, and attaches bubble click fallback on window", async () => {
    const injected = buildPathLockHeadInjection({
      slug: "funnel-test",
      targetUrl: "https://example.com/",
      effectiveUrl: "https://example.com/",
      parsedBaseOrigin: "https://example.com",
      parsedBasePathname: "/",
      effectiveOrigin: "https://example.com",
      effectivePathname: "/",
      mode: "funnel",
      prefix: "block:/admin,/pricing",
      initialUnlocked: false,
      hasExistingImportMap: false,
    });

    const scriptMatch = injected.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).not.toBeNull();
    const scriptBody = scriptMatch![1];

    // Compile script in vm to verify zero syntax errors
    expect(() => new vm.Script(scriptBody)).not.toThrow();

    // Behavioral sandbox test for window.fetch(URL) + res.url rewriting + prefetch short-circuit + window bubble click order
    const fetchCalls: Array<{ input: unknown; init: unknown }> = [];
    const postedMessages: unknown[] = [];
    const docListeners: Record<string, Array<{ fn: (...args: any[]) => any; capture: boolean }>> = {};
    const winListeners: Record<string, Array<{ fn: (...args: any[]) => any; capture: boolean }>> = {};

    const mockOrigFetch = async (input: unknown, init?: unknown) => {
      fetchCalls.push({ input, init });
      const reqUrlStr =
        typeof input === "string"
          ? `https://lsho.cc${input}`
          : String((input as any)?.url || input);
      const fakeHeaders = new Map<string, string>([
        ["x-pathlock-final-url", "https://example.com/products/42?_rsc=xyz"],
        ["x-pathlock-redirected", "0"],
      ]);
      const res: any = {
        status: 200,
        url: reqUrlStr,
        redirected: false,
        headers: { get: (k: string) => fakeHeaders.get(k.toLowerCase()) || null },
        clone() {
          return { ...res };
        },
      };
      return res;
    };

    const sandbox: any = {
      URL,
      URLSearchParams,
      Headers,
      Response: class MockResponse {
        status: number;
        body: string | null;
        constructor(body: string | null, init?: { status?: number }) {
          const status = init?.status ?? 200;
          // Mirror real browser WHATWG Fetch spec: 204/205/304 reject non-null body
          if ((status === 204 || status === 205 || status === 304) && body !== null && body !== undefined) {
            throw new TypeError("Response with null body status cannot have body");
          }
          this.body = body;
          this.status = status;
        }
      },
      Element: {
        prototype: {
          setAttribute(this: any, k: string, v: string) {
            this.__attrs = this.__attrs || {};
            this.__attrs[k.toLowerCase()] = v;
          },
          getAttribute(this: any, k: string) {
            return (this.__attrs && this.__attrs[k.toLowerCase()]) || null;
          },
          querySelector(this: any, sel: string) {
            this.__lastElQs = sel;
            return null;
          },
          querySelectorAll(this: any, sel: string) {
            this.__lastElQsa = sel;
            return [];
          },
        },
      },
      Document: {
        prototype: {
          querySelector(this: any, sel: string) {
            this.__lastQs = sel;
            return null;
          },
          querySelectorAll(this: any, sel: string) {
            this.__lastQsa = sel;
            return [];
          },
        },
      },
      HTMLScriptElement: { prototype: {} },
      HTMLIFrameElement: { prototype: {} },
      HTMLLinkElement: { prototype: {} },
      HTMLImageElement: { prototype: {} },
      HTMLSourceElement: { prototype: {} },
      HTMLVideoElement: { prototype: {} },
      document: {
        addEventListener(type: string, fn: (...args: any[]) => any, capture = false) {
          docListeners[type] = docListeners[type] || [];
          docListeners[type].push({ fn, capture: Boolean(capture) });
        },
      },
      window: null as any,
      setTimeout,
      clearTimeout,
    };

    sandbox.window = {
      location: {
        origin: "https://lsho.cc",
        pathname: "/",
        search: "",
        hash: "",
        href: "https://lsho.cc/",
      },
      history: {
        state: null,
        pushState: () => {},
        replaceState: () => {},
      },
      parent: {
        postMessage: (msg: unknown) => postedMessages.push(msg),
      },
      navigator: {},
      fetch: mockOrigFetch,
      open: () => null,
      addEventListener(type: string, fn: (...args: any[]) => any, capture = false) {
        winListeners[type] = winListeners[type] || [];
        winListeners[type].push({ fn, capture: Boolean(capture) });
      },
    };

    vm.runInNewContext(scriptBody, sandbox);

    // 1. Verify Next.js App Router fetch(new URL(...)) IS rewritten and res.url IS restored to virtual origin
    const rscRes = await sandbox.window.fetch(
      new URL("https://lsho.cc/products/42?_rsc=xyz"),
      { headers: { RSC: "1", "Next-Url": "/" } },
    );
    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0].input).toBe(
      "/r/funnel-test/proxy/__p/https/example.com/products/42?_rsc=xyz",
    );
    expect(rscRes.url).toBe("https://lsho.cc/products/42?_rsc=xyz");

    // 2. Verify blocked route Next.js prefetch is dropped client-side in 0ms (no network call)
    const blockedPrefetchRes = await sandbox.window.fetch(
      new URL("https://lsho.cc/admin?_rsc=abc"),
      { headers: { RSC: "1", "Next-Router-Prefetch": "1" } },
    );
    expect(blockedPrefetchRes.status).toBe(204);
    expect(fetchCalls.length).toBe(1); // Still 1: zero network call fired!

    // 3. Verify blocked route active RSC navigation is blocked immediately without hitting network
    const blockedNavRes = await sandbox.window.fetch(
      new URL("https://lsho.cc/pricing?_rsc=def"),
      { headers: { RSC: "1" } },
    );
    expect(blockedNavRes.status).toBe(403);
    expect(fetchCalls.length).toBe(1);
    expect(
      postedMessages.some(
        (m: any) => m?.type === "PATHLOCK_NAVIGATE" && m?.blocked === true,
      ),
    ).toBe(true);

    // 4. Verify bubble click fallback is registered on WINDOW (not document), so React/Next.js on document runs first!
    const docBubbleClicks = (docListeners["click"] || []).filter((l) => !l.capture);
    const winBubbleClicks = (winListeners["click"] || []).filter((l) => !l.capture);
    expect(docBubbleClicks.length).toBe(0);
    expect(winBubbleClicks.length).toBe(1);

    // 5. Verify Turbopack / React Flight script/link getAttribute virtualization & querySelectorAll selector rewriting
    const fakeScript: any = { tagName: "SCRIPT", __attrs: {} };
    sandbox.Element.prototype.setAttribute.call(fakeScript, "src", "/_next/static/chunks/abc.js");
    expect(fakeScript.__attrs.src).toBe("/r/funnel-test/proxy/__p/https/example.com/_next/static/chunks/abc.js");
    expect(sandbox.Element.prototype.getAttribute.call(fakeScript, "src")).toBe("/_next/static/chunks/abc.js");

    const fakeDoc: any = {};
    sandbox.Document.prototype.querySelectorAll.call(fakeDoc, 'script[src="/_next/static/chunks/abc.js"]');
    expect(fakeDoc.__lastQsa).toBe(
      'script[src="/r/funnel-test/proxy/__p/https/example.com/_next/static/chunks/abc.js"]',
    );

    const fakeHead: any = {};
    sandbox.Element.prototype.querySelector.call(fakeHead, 'link[href="/assets/main.css"]');
    expect(fakeHead.__lastElQs).toBe(
      'link[href="/r/funnel-test/proxy/__p/https/example.com/assets/main.css"]',
    );

    // 6. Verify dynamic <img> srcset & nested <iframe> src rewriting via setAttribute
    const fakeImg: any = { tagName: "IMG", __attrs: {} };
    sandbox.Element.prototype.setAttribute.call(
      fakeImg,
      "srcset",
      "/_next/image?url=%2Fa.png&w=640 1x, /_next/image?url=%2Fa.png&w=1280 2x",
    );
    expect(fakeImg.__attrs.srcset).toBe(
      "/r/funnel-test/proxy/__p/https/example.com/_next/image?url=%2Fa.png&w=640 1x, /r/funnel-test/proxy/__p/https/example.com/_next/image?url=%2Fa.png&w=1280 2x",
    );

    const fakeIframe: any = { tagName: "IFRAME", __attrs: {} };
    sandbox.Element.prototype.setAttribute.call(fakeIframe, "src", "/preview/base/preview-02");
    expect(fakeIframe.__attrs.src).toBe(
      "/r/funnel-test/proxy?url=https%3A%2F%2Fexample.com%2Fpreview%2Fbase%2Fpreview-02&embed=1",
    );

    // 7. Verify root & non-root trailing slashes avoid Next.js 308 redirects
    await sandbox.window.fetch(new URL("https://lsho.cc/?_rsc=root"), {
      headers: { RSC: "1", "Next-Router-Prefetch": "1" },
    });
    expect(fetchCalls[fetchCalls.length - 1].input).toBe(
      "/r/funnel-test/proxy/__p/https/example.com?_rsc=root",
    );

    await sandbox.window.fetch(new URL("https://lsho.cc/docs/intro/?_rsc=ts"), {
      headers: { RSC: "1" },
    });
    expect(fetchCalls[fetchCalls.length - 1].input).toBe(
      "/r/funnel-test/proxy/__p/https/example.com/docs/intro?_rsc=ts&_plts=1",
    );
  });
});

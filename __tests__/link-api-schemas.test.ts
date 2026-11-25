/** @jest-environment node */

import {
  linkCreateBodySchema,
  linkUpdateBodySchema,
  signupPinBodySchema,
  uploadJsonBodySchema,
  usernameSchema,
} from "@/lib/api-schemas";

describe("Link API Zod Schemas (Create & Update)", () => {
  test("accepts full LinkDrawer edit payload with null cleared fields", () => {
    const drawerEditPayload = {
      userId: "usr_123456",
      targetUrl: "https://lsho.cc/pricing",
      target_url: "https://lsho.cc/pricing",
      slug: "launch",
      domainName: "lsho.cc",
      isActive: true,
      is_active: 1,
      tags: [],
      ogTitle: "LShorter — URL Shortener & Intelligent Routing",
      og_title: "LShorter — URL Shortener & Intelligent Routing",
      metaTitle: "LShorter — URL Shortener & Intelligent Routing",
      meta_title: "LShorter — URL Shortener & Intelligent Routing",
      ogDescription:
        "Stop losing clicks. Redirect your visitors based on their country and device, using ultra-precise, real-time tracking. Get started—no credit card required.",
      og_description:
        "Stop losing clicks. Redirect your visitors based on their country and device, using ultra-precise, real-time tracking. Get started—no credit card required.",
      ogImage: "/banners/img_1795169570.jpg",
      og_image: "/banners/img_1795169570.jpg",
      previousOgImage: "/banners/img_1795169570.jpg",
      bannerStyle: "large_banner",
      banner_style: "large_banner",
      twitterCard: "summary_large_image",
      twitter_card: "summary_large_image",
      routingRules: [],
      routing_rules: [],
      geoTargeting: null,
      geo_targeting: null,
      deviceTargeting: null,
      device_targeting: null,
      isCloaked: false,
      is_cloaked: 0,
      hideReferrer: false,
      hide_referrer: 0,
      expiresAt: null,
      expires_at: null,
      maxClicks: null,
      max_clicks: null,
      fallbackUrl: null,
      fallback_url: null,
      abVariations: [],
      ab_variations: [],
      mainWeight: 100,
      main_weight: 100,
      redirectType: "302",
      redirect_type: "302",
      passParams: true,
      pass_params: true,
      pathLockMode: "off",
      path_lock_mode: "off",
      pathLockPrefix: null,
      path_lock_prefix: null,
      pathLockMessage: null,
      path_lock_message: null,
      pathLockPassword: null,
      path_lock_password: null,
      pixels: [],
    };

    const result = linkUpdateBodySchema.safeParse(drawerEditPayload);
    expect(result.success).toBe(true);
  });

  test("accepts retargeting pixel objects, structured routing rules, and A/B variations", () => {
    const proPayload = {
      targetUrl: "https://example.com/offer",
      slug: "pro-campaign",
      pixels: [
        {
          id: "px_1",
          platform: "meta",
          pixelId: "1234567890",
          name: "Meta Main",
        },
        "px_legacy_id",
      ],
      routingRules: [
        {
          id: "r_1",
          title: "France Mobile",
          conditions: [
            { id: "c_1", type: "pays", operator: "est", value: "FR" },
          ],
          destinationUrl: "https://example.com/fr",
        },
      ],
      abVariations: [
        { url: "https://example.com/variant-b", weight: 50 },
      ],
      mainWeight: 50,
      maxClicks: 5000,
      fallbackUrl: "https://example.com/expired",
      redirectType: 301,
      pathLockMode: "funnel",
      pathLockPrefix: "/checkout",
      pathLockMessage: "Restricted area",
      tags: ["launch", "Q&A"],
    };

    const createRes = linkCreateBodySchema.safeParse(proPayload);
    expect(createRes.success).toBe(true);
    if (createRes.success) {
      expect(createRes.data.redirectType).toBe("301");
    }

    const updateRes = linkUpdateBodySchema.safeParse(proPayload);
    expect(updateRes.success).toBe(true);
  });

  test("partial PATCH does not inject default empty tags array", () => {
    const toggleRes = linkUpdateBodySchema.safeParse({
      isActive: false,
      is_active: 0,
      status: "Paused",
    });
    expect(toggleRes.success).toBe(true);
    if (toggleRes.success) {
      expect(toggleRes.data.tags).toBeUndefined();
    }

    const qrRes = linkUpdateBodySchema.safeParse({
      qrCodeConfig: JSON.stringify({ version: 3 }),
      qrCode: "data:image/png;base64,AAAA",
    });
    expect(qrRes.success).toBe(true);
    if (qrRes.success) {
      expect(qrRes.data.tags).toBeUndefined();
    }
  });

  test("rejects malicious slugs and URL schemes", () => {
    for (const badSlug of [
      "'; DROP TABLE links;--",
      "test' OR '1'='1",
      "../../../etc/passwd",
    ]) {
      const res = linkCreateBodySchema.safeParse({
        slug: badSlug,
        targetUrl: "https://example.com/safe",
      });
      expect(res.success).toBe(false);
    }

    for (const badUrl of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///etc/passwd",
    ]) {
      expect(
        linkCreateBodySchema.safeParse({ targetUrl: badUrl }).success
      ).toBe(false);
      expect(
        linkUpdateBodySchema.safeParse({ fallbackUrl: badUrl }).success
      ).toBe(false);
      expect(
        linkUpdateBodySchema.safeParse({
          routingRules: [{ destinationUrl: badUrl }],
        }).success
      ).toBe(false);
      expect(
        linkUpdateBodySchema.safeParse({
          abVariations: [{ url: badUrl, weight: 50 }],
        }).success
      ).toBe(false);
    }
  });

  test("rejects invalid numeric limits and enums", () => {
    expect(linkUpdateBodySchema.safeParse({ maxClicks: 0 }).success).toBe(false);
    expect(linkUpdateBodySchema.safeParse({ maxClicks: -10 }).success).toBe(false);
    expect(linkUpdateBodySchema.safeParse({ redirectType: "999" }).success).toBe(false);
    expect(linkUpdateBodySchema.safeParse({ pathLockMode: "invalid" }).success).toBe(false);
    expect(linkUpdateBodySchema.safeParse({ pathLockAction: "invalid" }).success).toBe(false);
  });

  test("validates pathLockAction and pathLockFallbackPath safely", () => {
    expect(
      linkCreateBodySchema.safeParse({
        targetUrl: "https://ui.shadcn.com/",
        pathLockMode: "funnel",
        pathLockPrefix: "/create, /docs/installation",
        pathLockAction: "fallback",
        pathLockFallbackPath: "/create",
      }).success
    ).toBe(true);

    expect(
      linkUpdateBodySchema.safeParse({
        pathLockAction: "fallback",
        pathLockFallbackPath: "",
      }).success
    ).toBe(true);

    for (const badPath of [
      "//evil.com/phish",
      "https://evil.com/phish",
      "javascript:alert(1)",
      "/has space",
    ]) {
      expect(
        linkUpdateBodySchema.safeParse({
          pathLockAction: "fallback",
          pathLockFallbackPath: badPath,
        }).success
      ).toBe(false);
    }
  });

  test("uploadJsonBodySchema accepts valid image data URIs and rejects HTML/scripts", () => {
    expect(
      uploadJsonBodySchema.safeParse({
        data: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      }).success
    ).toBe(true);
    expect(
      uploadJsonBodySchema.safeParse({
        data: "data:text/html;base64,PHNjcmlwdD4=",
      }).success
    ).toBe(false);
  });

  test("usernameSchema and signupPinBodySchema accept standard short names (2-50 chars)", () => {
    expect(usernameSchema.safeParse("Samuel").success).toBe(true);
    expect(usernameSchema.safeParse("Al").success).toBe(true);
    expect(usernameSchema.safeParse("A").success).toBe(false);
    expect(usernameSchema.safeParse("A".repeat(51)).success).toBe(false);
    expect(
      signupPinBodySchema.safeParse({
        action: "send",
        name: "Samuel",
        email: "samuel@example.com",
        password: "strongpassword123",
      }).success
    ).toBe(true);
  });
});

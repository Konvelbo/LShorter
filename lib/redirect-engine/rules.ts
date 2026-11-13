import { LinkMetadata, VisitorDetails, RuleCondition } from "./types";
import { REGION_COUNTRIES, parseVisitorDetails } from "./geo";

export function normalizeDestinationUrl(rawUrl: string): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return "/";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function parseJsonObject<T = Record<string, string>>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === "object") return raw as T;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function evaluateRoutingRules(
  link: LinkMetadata,
  visitor: VisitorDetails,
): string | null {
  let rules = link.routingRules || link.routing_rules;
  if (typeof rules === "string") {
    try {
      rules = JSON.parse(rules);
    } catch {
      rules = [];
    }
  }

  if (Array.isArray(rules) && rules.length > 0) {
    for (const rule of rules) {
      if (!rule) continue;
      const destUrl =
        rule.destinationUrl ||
        rule.url ||
        rule.destination_url ||
        rule.targetUrl ||
        rule.target_url;
      if (!destUrl) continue;

      const conditions: RuleCondition[] =
        Array.isArray(rule.conditions) && rule.conditions.length > 0
          ? rule.conditions
          : rule.conditionType || rule.condition_type
            ? [
                {
                  type: rule.conditionType || rule.condition_type || "",
                  operator: rule.operator || "est",
                  value: rule.conditionValue || rule.condition_value || "",
                },
              ]
            : [];

      if (conditions.length === 0) continue;

      let allConditionsMet = true;
      for (const cond of conditions) {
        if (!cond || !cond.type || !cond.value) continue;
        const val = String(cond.value).trim().toLowerCase();
        const op = cond.operator || "est";
        const cType = String(cond.type).trim().toLowerCase();
        let isMet = false;

        if (cType === "pays" || cType === "country") {
          const match = visitor.countryCode.toLowerCase() === val;
          isMet = op === "est" ? match : !match;
        } else if (cType === "continent" || cType === "region") {
          const regionList = REGION_COUNTRIES[val] || [];
          const match = regionList.includes(visitor.countryCode);
          isMet = op === "est" ? match : !match;
        } else if (cType === "navigateur" || cType === "browser") {
          const match =
            visitor.browser === val ||
            (val === "samsung internet" && visitor.browser === "samsung");
          isMet = op === "est" ? match : !match;
        } else if (cType === "appareil" || cType === "device") {
          const normOs = val === "mac" ? "macos" : val === "iphone" || val === "ipad" ? "ios" : val;
          let match =
            visitor.device === val ||
            (val === "mobile" && (visitor.isMobile || visitor.isTablet));
          if (
            !match &&
            (normOs === "ios" ||
              normOs === "android" ||
              normOs === "windows" ||
              normOs === "macos" ||
              normOs === "linux")
          ) {
            match = visitor.os === normOs;
          }
          isMet = op === "est" ? match : !match;
        } else if (cType === "plateforme" || cType === "os") {
          const normOs = val === "mac" ? "macos" : val === "iphone" || val === "ipad" ? "ios" : val;
          let match = visitor.os === normOs;
          if (!match && (val === "mobile" || val === "desktop" || val === "tablet")) {
            match =
              visitor.device === val ||
              (val === "mobile" && (visitor.isMobile || visitor.isTablet));
          }
          isMet = op === "est" ? match : !match;
        } else {
          isMet = true;
        }

        if (!isMet) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        return normalizeDestinationUrl(destUrl);
      }
    }
  }

  // Fallback to legacy single-condition geoTargeting & deviceTargeting maps
  const deviceTargeting = parseJsonObject<Record<string, string>>(
    link.deviceTargeting || link.device_targeting,
    {},
  );
  if (visitor.os === "android" && deviceTargeting.android) {
    return normalizeDestinationUrl(deviceTargeting.android);
  }
  if (visitor.os === "ios" && (deviceTargeting.ios || deviceTargeting.iphone || deviceTargeting.ipad)) {
    return normalizeDestinationUrl(
      deviceTargeting.ios || deviceTargeting.iphone || deviceTargeting.ipad,
    );
  }
  if ((visitor.isMobile || visitor.isTablet) && deviceTargeting.mobile) {
    return normalizeDestinationUrl(deviceTargeting.mobile);
  }
  if (visitor.isDesktop) {
    const desktopDest =
      (visitor.os === "windows" && deviceTargeting.windows) ||
      (visitor.os === "macos" && (deviceTargeting.macos || deviceTargeting.mac)) ||
      deviceTargeting.desktop;
    if (desktopDest) {
      return normalizeDestinationUrl(desktopDest);
    }
  }

  const geoTargeting = parseJsonObject<Record<string, string>>(
    link.geoTargeting || link.geo_targeting,
    {},
  );
  const ccUpper = (visitor.countryCode || "").toUpperCase();
  const ccLower = ccUpper.toLowerCase();
  if (ccUpper && (geoTargeting[ccUpper] || geoTargeting[ccLower])) {
    return normalizeDestinationUrl(geoTargeting[ccUpper] || geoTargeting[ccLower]);
  }

  return null;
}

export function resolveAbTargetUrl(
  link: LinkMetadata,
  defaultTarget: string,
): string {
  const safeDefault = normalizeDestinationUrl(defaultTarget);
  let variations = link.abVariations || link.ab_variations;
  if (typeof variations === "string") {
    try {
      variations = JSON.parse(variations);
    } catch {
      variations = [];
    }
  }

  if (!Array.isArray(variations) || variations.length === 0) {
    return safeDefault;
  }

  const validVars = variations.filter(
    (v: any) => v && v.url && typeof v.url === "string" && v.url.trim() && Number(v.weight) > 0,
  );
  if (validVars.length === 0) return safeDefault;

  const mainWeight =
    link.mainWeight !== undefined && link.mainWeight !== null
      ? Number(link.mainWeight)
      : link.main_weight !== undefined && link.main_weight !== null
        ? Number(link.main_weight)
        : 100;

  const totalWeight =
    mainWeight + validVars.reduce((sum: number, v: any) => sum + Number(v.weight), 0);
  if (totalWeight <= 0) return safeDefault;

  const rand = Math.random() * totalWeight;
  let cumulative = mainWeight;

  if (rand < cumulative) {
    return safeDefault;
  }

  for (const v of validVars) {
    cumulative += Number(v.weight);
    if (rand < cumulative) {
      return normalizeDestinationUrl(v.url.trim());
    }
  }

  return safeDefault;
}

/**
 * Preserves UTM tracking parameters configured on the link's primary target URL
 * even when dynamic routing or A/B split testing overrides the destination.
 */
export function preserveUtmParams(
  destinationUrl: string,
  baseTargetUrl: string,
): string {
  try {
    const dest = new URL(normalizeDestinationUrl(destinationUrl));
    const base = new URL(normalizeDestinationUrl(baseTargetUrl));

    base.searchParams.forEach((val, key) => {
      if (key.toLowerCase().startsWith("utm_") && !dest.searchParams.has(key)) {
        dest.searchParams.set(key, val);
      }
    });
    return dest.toString();
  } catch {
    return normalizeDestinationUrl(destinationUrl);
  }
}

export function appendForwardedParams(
  targetUrl: string,
  requestUrl: string,
  passParams: boolean = true,
): string {
  if (!passParams) return targetUrl;
  try {
    const targetObj = new URL(normalizeDestinationUrl(targetUrl));
    const reqObj = new URL(requestUrl);

    reqObj.searchParams.forEach((val, key) => {
      if (
        key === "preview" ||
        key === "banner" ||
        key === "inspect" ||
        key === "debug" ||
        key === "domain"
      ) {
        return;
      }
      if (!targetObj.searchParams.has(key)) {
        targetObj.searchParams.set(key, val);
      }
    });
    return targetObj.toString();
  } catch {
    return targetUrl;
  }
}

export function evaluateTargetUrl(
  baseTargetUrl: string,
  req: Request,
  meta?: any,
  detectedCountry?: string,
): string {
  if (!meta) return normalizeDestinationUrl(baseTargetUrl);
  const country =
    detectedCountry ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    "";

  const visitor = parseVisitorDetails(req, {
    countryCode: country,
    city: "",
    rawIp: "127.0.0.1",
  });

  const abDest = resolveAbTargetUrl(meta, baseTargetUrl);
  const ruleDest = evaluateRoutingRules(meta, visitor);
  const chosen = ruleDest || abDest;
  const withUtms = preserveUtmParams(chosen, baseTargetUrl);
  const passParams = meta.passParams !== false && meta.pass_params !== false;
  return appendForwardedParams(withUtms, req.url, passParams);
}


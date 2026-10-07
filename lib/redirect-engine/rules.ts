import { LinkMetadata, VisitorDetails, RoutingRule, RuleCondition } from "./types";
import { REGION_COUNTRIES, parseVisitorDetails } from "./geo";

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

  if (!Array.isArray(rules) || rules.length === 0) {
    return null;
  }

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
        let match =
          visitor.device === val ||
          (val === "mobile" && (visitor.isMobile || visitor.isTablet));
        if (
          !match &&
          (val === "ios" ||
            val === "android" ||
            val === "windows" ||
            val === "macos" ||
            val === "linux")
        ) {
          match = visitor.os === val;
        }
        isMet = op === "est" ? match : !match;
      } else if (cType === "plateforme" || cType === "os") {
        let match = visitor.os === val;
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
      return destUrl;
    }
  }

  return null;
}

export function resolveAbTargetUrl(
  link: LinkMetadata,
  defaultTarget: string,
): string {
  let variations = link.abVariations || link.ab_variations;
  if (typeof variations === "string") {
    try {
      variations = JSON.parse(variations);
    } catch {
      variations = [];
    }
  }

  if (!Array.isArray(variations) || variations.length === 0) {
    return defaultTarget;
  }

  const validVars = variations.filter(
    (v: any) => v && v.url && typeof v.url === "string" && v.url.trim() && Number(v.weight) > 0,
  );
  if (validVars.length === 0) return defaultTarget;

  const mainWeight =
    link.mainWeight !== undefined && link.mainWeight !== null
      ? Number(link.mainWeight)
      : link.main_weight !== undefined && link.main_weight !== null
        ? Number(link.main_weight)
        : 100;

  const totalWeight =
    mainWeight + validVars.reduce((sum: number, v: any) => sum + Number(v.weight), 0);

  const rand = Math.random() * totalWeight;
  let cumulative = mainWeight;

  if (rand < cumulative) {
    return defaultTarget;
  }

  for (const v of validVars) {
    cumulative += Number(v.weight);
    if (rand < cumulative) {
      return v.url.trim();
    }
  }

  return defaultTarget;
}

export function appendForwardedParams(
  targetUrl: string,
  requestUrl: string,
  passParams: boolean = true,
): string {
  if (!passParams) return targetUrl;
  try {
    const targetObj = new URL(targetUrl);
    const reqObj = new URL(requestUrl);

    reqObj.searchParams.forEach((val, key) => {
      // Do not forward test/debug inspector parameters
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
  if (!meta) return baseTargetUrl;
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

  const ruleDest = evaluateRoutingRules(meta, visitor);
  const target = ruleDest || baseTargetUrl;
  const passParams = meta.passParams !== false && meta.pass_params !== false;
  return appendForwardedParams(target, req.url, passParams);
}


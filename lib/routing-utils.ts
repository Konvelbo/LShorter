export interface Condition {
  id: string;
  type: "pays" | "region" | "appareil" | "plateforme";
  operator: "est" | "nest_pas";
  value: string;
}

export interface RoutingRule {
  id: string;
  title: string;
  isCollapsed?: boolean;
  conditions: Condition[];
  destinationUrl: string;
}

export const REGION_COUNTRIES: Record<string, string[]> = {
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

/**
 * Compiles visual routing rules into:
 * - routingRules: array of structured rules with multi-conditions (primary engine)
 * - geoTargeting / deviceTargeting: only populated for single-condition rules (legacy fallback)
 */
export function compileRoutingRules(rules: RoutingRule[]) {
  const geoTargeting: Record<string, string> = {};
  const deviceTargeting: Record<string, string> = {};

  const validRules = (rules || [])
    .filter((r) => r && r.destinationUrl && r.destinationUrl.trim())
    .map((r) => {
      let dest = r.destinationUrl.trim();
      if (!/^https?:\/\//i.test(dest)) {
        dest = `https://${dest}`;
      }
      return {
        ...r,
        destinationUrl: dest,
      };
    });

  validRules.forEach((r) => {
    const dest = r.destinationUrl;

    // ONLY populate legacy single-condition maps if the rule has EXACTLY 1 condition and operator is "est"
    // Rules with 2+ conditions MUST NOT be flattened into OR-based legacy maps!
    if (r.conditions && r.conditions.length === 1) {
      const c = r.conditions[0];
      if (c && c.value && c.operator === "est") {
        if (c.type === "pays") {
          geoTargeting[c.value.toUpperCase()] = dest;
        } else if (c.type === "region") {
          const regionKey = c.value.toLowerCase();
          const countries = REGION_COUNTRIES[regionKey];
          if (countries) {
            countries.forEach((code) => {
              geoTargeting[code] = dest;
            });
          }
        } else if (c.type === "appareil") {
          const val = c.value.toLowerCase();
          if (val === "mobile") {
            deviceTargeting.android = dest;
            deviceTargeting.ios = dest;
            deviceTargeting.mobile = dest;
          } else if (val === "tablet") {
            deviceTargeting.tablet = dest;
            deviceTargeting.ipad = dest;
          } else if (val === "desktop") {
            deviceTargeting.windows = dest;
            deviceTargeting.macos = dest;
            deviceTargeting.linux = dest;
            deviceTargeting.desktop = dest;
          }
        } else if (c.type === "plateforme") {
          const val = c.value.toLowerCase();
          if (val === "ios") {
            deviceTargeting.ios = dest;
          } else if (val === "android") {
            deviceTargeting.android = dest;
          } else if (val === "windows") {
            deviceTargeting.windows = dest;
          } else if (val === "macos" || val === "mac") {
            deviceTargeting.macos = dest;
          } else if (val === "linux") {
            deviceTargeting.linux = dest;
          }
        }
      }
    }
  });

  return {
    geoTargeting: Object.keys(geoTargeting).length ? geoTargeting : undefined,
    deviceTargeting: Object.keys(deviceTargeting).length ? deviceTargeting : undefined,
    routingRules: validRules.length ? validRules : undefined,
  };
}

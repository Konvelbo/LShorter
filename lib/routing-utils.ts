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

/**
 * Compiles visual routing rules into:
 * - geoTargeting: { [countryIso2]: destinationUrl }
 * - deviceTargeting: { [deviceTypeOrOS]: destinationUrl }
 * - routingRules: array of structured rules with multi-conditions
 */
export function compileRoutingRules(rules: RoutingRule[]) {
  const geoTargeting: Record<string, string> = {};
  const deviceTargeting: Record<string, string> = {};

  const regionCountries: Record<string, string[]> = {
    europe: [
      "FR", "DE", "GB", "ES", "IT", "BE", "CH", "PT", "NL", "SE",
      "NO", "DK", "FI", "IE", "AT", "PL", "GR", "RO", "CZ", "HU", "LU"
    ],
    west_africa: [
      "SN", "CI", "BF", "ML", "GN", "TG", "BJ", "NE", "NG", "GH",
      "CV", "GM", "GW", "LR", "SL"
    ],
    central_africa: [
      "CM", "GA", "CG", "CD", "TD", "CF", "GQ", "ST"
    ],
    north_america: [
      "US", "CA", "MX"
    ],
    south_america: [
      "BR", "AR", "CO", "CL", "PE", "VE", "EC", "BO", "PY", "UY"
    ],
    asia: [
      "CN", "JP", "KR", "IN", "SG", "TH", "VN", "ID", "MY", "PH",
      "PK", "BD", "AE", "SA", "QA", "KW"
    ],
  };

  const validRules = (rules || []).filter((r) => r.destinationUrl?.trim());

  validRules.forEach((r) => {
    let dest = r.destinationUrl.trim();
    if (!/^https?:\/\//i.test(dest)) {
      dest = `https://${dest}`;
    }

    r.conditions.forEach((c) => {
      if (!c.value) return;

      // 1. GÉOGRAPHIE : PAYS
      if (c.type === "pays") {
        geoTargeting[c.value.toUpperCase()] = dest;
      }

      // 2. GÉOGRAPHIE : RÉGION / CONTINENT
      else if (c.type === "region") {
        const regionKey = c.value.toLowerCase();
        const countries = regionCountries[regionKey];
        if (countries) {
          countries.forEach((code) => {
            geoTargeting[code] = dest;
          });
        }
      }

      // 3. APPAREIL (Device Type) : Mobile, Tablette, Desktop
      else if (c.type === "appareil") {
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
      }

      // 4. PLATEFORME (OS) : iOS, Android, Windows, macOS, Linux
      else if (c.type === "plateforme") {
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
    });
  });

  return {
    geoTargeting: Object.keys(geoTargeting).length ? geoTargeting : undefined,
    deviceTargeting: Object.keys(deviceTargeting).length ? deviceTargeting : undefined,
    routingRules: validRules.length ? validRules : undefined,
  };
}

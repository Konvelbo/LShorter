import { VisitorGeo, VisitorDetails } from "./types";
import { parseUserAgent } from "./device";
import { detectVisitorGeoAsync as detectDeviceGeoAsync } from "../device-detection";

export const REGION_COUNTRIES: Record<string, string[]> = {
  // Français
  afrique: [
    "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ",
    "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR",
    "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RE",
    "RW", "SC", "SD", "SH", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN",
    "TZ", "UG", "YT", "ZA", "ZM", "ZW"
  ],
  europe: [
    "AL", "AD", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK",
    "EE", "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU", "IE", "IM",
    "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL",
    "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SJ", "SK", "SM", "UA", "VA", "XK"
  ],
  asie: [
    "AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CN", "GE", "HK", "ID", "IL", "IN",
    "IQ", "IR", "JO", "JP", "KG", "KH", "KP", "KR", "KW", "KZ", "LA", "LB", "LK",
    "MM", "MN", "MO", "MV", "MY", "NP", "OM", "PH", "PK", "PS", "QA", "SA", "SG",
    "SY", "TH", "TJ", "TL", "TM", "TR", "TW", "UZ", "VN", "YE"
  ],
  "amerique du nord": [
    "AG", "AI", "AW", "BB", "BL", "BM", "BQ", "BS", "BZ", "CA", "CR", "CU", "CW",
    "DM", "DO", "GD", "GL", "GP", "GT", "HN", "HT", "JM", "KN", "KY", "LC", "MF",
    "MQ", "MS", "MX", "NI", "PA", "PM", "PR", "SV", "SX", "TC", "TT", "US", "VC",
    "VG", "VI"
  ],
  "amerique du sud": [
    "AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GY", "PE", "PY", "SR", "UY", "VE"
  ],
  oceanie: [
    "AS", "AU", "CK", "FJ", "FM", "GU", "KI", "MH", "MP", "NC", "NF", "NR", "NU", "NZ",
    "PF", "PG", "PN", "PW", "SB", "TK", "TO", "TV", "UM", "VU", "WF", "WS"
  ],

  // English aliases
  africa: [
    "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ",
    "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR",
    "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RE",
    "RW", "SC", "SD", "SH", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN",
    "TZ", "UG", "YT", "ZA", "ZM", "ZW"
  ],
  asia: [
    "AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CN", "GE", "HK", "ID", "IL", "IN",
    "IQ", "IR", "JO", "JP", "KG", "KH", "KP", "KR", "KW", "KZ", "LA", "LB", "LK",
    "MM", "MN", "MO", "MV", "MY", "NP", "OM", "PH", "PK", "PS", "QA", "SA", "SG",
    "SY", "TH", "TJ", "TL", "TM", "TR", "TW", "UZ", "VN", "YE"
  ],
  "north america": [
    "AG", "AI", "AW", "BB", "BL", "BM", "BQ", "BS", "BZ", "CA", "CR", "CU", "CW",
    "DM", "DO", "GD", "GL", "GP", "GT", "HN", "HT", "JM", "KN", "KY", "LC", "MF",
    "MQ", "MS", "MX", "NI", "PA", "PM", "PR", "SV", "SX", "TC", "TT", "US", "VC",
    "VG", "VI"
  ],
  "south america": [
    "AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GY", "PE", "PY", "SR", "UY", "VE"
  ],
  oceania: [
    "AS", "AU", "CK", "FJ", "FM", "GU", "KI", "MH", "MP", "NC", "NF", "NR", "NU", "NZ",
    "PF", "PG", "PN", "PW", "SB", "TK", "TO", "TV", "UM", "VU", "WF", "WS"
  ],
};

export function getContinentForCountry(countryCode: string): string {
  const code = (countryCode || "").toUpperCase();
  if (!code || code === "XX") return "Unknown";

  for (const [continent, countries] of Object.entries(REGION_COUNTRIES)) {
    if (countries.includes(code)) {
      return continent.charAt(0).toUpperCase() + continent.slice(1);
    }
  }
  return "Unknown";
}

export async function detectVisitorGeoAsync(req: Request): Promise<VisitorGeo> {
  const detected = await detectDeviceGeoAsync(req).catch(() => ({
    countryCode: "XX",
    city: "",
    rawIp: "127.0.0.1",
  }));
  return {
    countryCode: detected.countryCode || "XX",
    city: detected.city || "",
    rawIp: detected.rawIp || "127.0.0.1",
  };
}


export function parseVisitorDetails(req: Request, geo: VisitorGeo): VisitorDetails {
  const userAgent = req.headers.get("user-agent") || "";
  const parsedUa = parseUserAgent(userAgent);
  const countryCode = geo.countryCode.toUpperCase();
  const continent = getContinentForCountry(countryCode);

  return {
    ip: geo.rawIp,
    country: countryCode,
    countryCode,
    city: geo.city,
    continent,
    device: parsedUa.device,
    os: parsedUa.os,
    browser: parsedUa.browser,
    isMobile: parsedUa.isMobile,
    isTablet: parsedUa.isTablet,
    isDesktop: parsedUa.isDesktop,
    userAgent,
  };
}

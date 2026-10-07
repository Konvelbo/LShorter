import { VisitorGeo, VisitorDetails } from "./types";
import { parseUserAgent } from "./device";

export const REGION_COUNTRIES: Record<string, string[]> = {
  // Français
  afrique: [
    "DZ","AO","BJ","BW","BF","BI","CV","CM","CF","TD","KM","CG","CD","CI",
    "DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR",
    "LY","MG","MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN",
    "SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","ZM","ZW"
  ],
  europe: [
    "AL","AD","AM","AT","AZ","BY","BE","BA","BG","HR","CY","CZ","DK","EE",
    "FI","FR","GE","DE","GR","HU","IS","IE","IT","KZ","XK","LV","LI","LT",
    "LU","MT","MD","MC","ME","NL","MK","NO","PL","PT","RO","RU","SM","RS",
    "SK","SI","ES","SE","CH","TR","UA","GB","VA"
  ],
  asie: [
    "AF","AM","AZ","BH","BD","BT","BN","KH","CN","CY","GE","IN","ID","IR",
    "IQ","IL","JP","JO","KZ","KW","KG","LA","LB","MY","MV","MN","MM","NP",
    "KP","OM","PK","PS","PH","QA","SA","SG","KR","LK","SY","TW","TJ","TH",
    "TL","TR","TM","AE","UZ","VN","YE"
  ],
  "amerique du nord": [
    "AG","BS","BB","BZ","CA","CR","CU","DM","DO","SV","GD","GT","HT","HN",
    "JM","MX","NI","PA","KN","LC","VC","TT","US"
  ],
  "amerique du sud": [
    "AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE"
  ],
  oceanie: [
    "AU","FJ","KI","MH","FM","NR","NZ","PW","PG","WS","SB","TO","TV","VU"
  ],

  // English aliases
  africa: [
    "DZ","AO","BJ","BW","BF","BI","CV","CM","CF","TD","KM","CG","CD","CI",
    "DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR",
    "LY","MG","MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN",
    "SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","ZM","ZW"
  ],
  asia: [
    "AF","AM","AZ","BH","BD","BT","BN","KH","CN","CY","GE","IN","ID","IR",
    "IQ","IL","JP","JO","KZ","KW","KG","LA","LB","MY","MV","MN","MM","NP",
    "KP","OM","PK","PS","PH","QA","SA","SG","KR","LK","SY","TW","TJ","TH",
    "TL","TR","TM","AE","UZ","VN","YE"
  ],
  "north america": [
    "AG","BS","BB","BZ","CA","CR","CU","DM","DO","SV","GD","GT","HT","HN",
    "JM","MX","NI","PA","KN","LC","VC","TT","US"
  ],
  "south america": [
    "AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE"
  ],
  oceania: [
    "AU","FJ","KI","MH","FM","NR","NZ","PW","PG","WS","SB","TO","TV","VU"
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
  const countryHeader =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    "";

  const cityHeader =
    req.headers.get("cf-ipcity") ||
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("x-city") ||
    "";

  const clientIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (countryHeader && countryHeader !== "XX") {
    return {
      countryCode: countryHeader.toUpperCase(),
      city: cityHeader ? decodeURIComponent(cityHeader) : "",
      rawIp: clientIp,
    };
  }

  // Localhost fallback
  if (
    clientIp === "127.0.0.1" ||
    clientIp === "::1" ||
    clientIp.startsWith("192.168.") ||
    clientIp.startsWith("10.")
  ) {
    return {
      countryCode: "FR",
      city: "Paris",
      rawIp: clientIp,
    };
  }

  return {
    countryCode: "XX",
    city: "",
    rawIp: clientIp,
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

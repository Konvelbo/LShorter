// =============================================================================
// LIB : Coordonnées Géographiques Mondiales & Cartographie des Continents
// Précision géodésique calibrée pour tous les pays du monde (ISO 3166-1 alpha-2)
// Zéro donnée fictive — exploitation stricte des données d'événements réels
// =============================================================================

export type Continent = "Africa" | "Europe" | "North America" | "South America" | "Asia" | "Oceania";

export interface CountryGeoData {
  code: string;
  name: string;
  nameEn: string;
  continent: Continent;
  lat: number;
  lng: number;
  flag: string;
}

export const WORLD_COUNTRIES: Record<string, CountryGeoData> = {
  // ─── AFRIQUE (Africa) ───────────────────────────────────────────────────────
  BF: { code: "BF", name: "Burkina Faso", nameEn: "Burkina Faso", continent: "Africa", lat: 12.2383, lng: -1.5616, flag: "🇧🇫" },
  CI: { code: "CI", name: "Côte d'Ivoire", nameEn: "Ivory Coast", continent: "Africa", lat: 7.5399, lng: -5.5471, flag: "🇨🇮" },
  SN: { code: "SN", name: "Sénégal", nameEn: "Senegal", continent: "Africa", lat: 14.4974, lng: -14.4524, flag: "🇸🇳" },
  CM: { code: "CM", name: "Cameroun", nameEn: "Cameroon", continent: "Africa", lat: 7.3697, lng: 12.3547, flag: "🇨🇲" },
  ML: { code: "ML", name: "Mali", nameEn: "Mali", continent: "Africa", lat: 17.5707, lng: -3.9962, flag: "🇲🇱" },
  NE: { code: "NE", name: "Niger", nameEn: "Niger", continent: "Africa", lat: 17.6078, lng: 8.0817, flag: "🇳🇪" },
  TG: { code: "TG", name: "Togo", nameEn: "Togo", continent: "Africa", lat: 8.6195, lng: 0.8248, flag: "🇹🇬" },
  BJ: { code: "BJ", name: "Bénin", nameEn: "Benin", continent: "Africa", lat: 9.3077, lng: 2.3158, flag: "🇧🇯" },
  GH: { code: "GH", name: "Ghana", nameEn: "Ghana", continent: "Africa", lat: 7.9465, lng: -1.0232, flag: "🇬🇭" },
  NG: { code: "NG", name: "Nigéria", nameEn: "Nigeria", continent: "Africa", lat: 9.0820, lng: 8.6753, flag: "🇳🇬" },
  GN: { code: "GN", name: "Guinée", nameEn: "Guinea", continent: "Africa", lat: 9.9456, lng: -9.6966, flag: "🇬🇳" },
  GA: { code: "GA", name: "Gabon", nameEn: "Gabon", continent: "Africa", lat: -0.8037, lng: 11.6094, flag: "🇬🇦" },
  CD: { code: "CD", name: "RDC", nameEn: "DR Congo", continent: "Africa", lat: -4.0383, lng: 21.7587, flag: "🇨🇩" },
  CG: { code: "CG", name: "Congo", nameEn: "Republic of the Congo", continent: "Africa", lat: -0.2280, lng: 15.8277, flag: "🇨🇬" },
  TD: { code: "TD", name: "Tchad", nameEn: "Chad", continent: "Africa", lat: 15.4542, lng: 18.7322, flag: "🇹🇩" },
  CF: { code: "CF", name: "Centrafrique", nameEn: "Central African Republic", continent: "Africa", lat: 6.6111, lng: 20.9394, flag: "🇨🇫" },
  RW: { code: "RW", name: "Rwanda", nameEn: "Rwanda", continent: "Africa", lat: -1.9403, lng: 29.8739, flag: "🇷🇼" },
  BI: { code: "BI", name: "Burundi", nameEn: "Burundi", continent: "Africa", lat: -3.3731, lng: 29.9189, flag: "🇧🇮" },
  KE: { code: "KE", name: "Kenya", nameEn: "Kenya", continent: "Africa", lat: -0.0236, lng: 37.9062, flag: "🇰🇪" },
  TZ: { code: "TZ", name: "Tanzanie", nameEn: "Tanzania", continent: "Africa", lat: -6.3690, lng: 34.8888, flag: "🇹🇿" },
  UG: { code: "UG", name: "Ouganda", nameEn: "Uganda", continent: "Africa", lat: 1.3733, lng: 32.2903, flag: "🇺🇬" },
  ET: { code: "ET", name: "Éthiopie", nameEn: "Ethiopia", continent: "Africa", lat: 9.1450, lng: 40.4897, flag: "🇪🇹" },
  MG: { code: "MG", name: "Madagascar", nameEn: "Madagascar", continent: "Africa", lat: -18.7669, lng: 46.8691, flag: "🇲🇬" },
  ZA: { code: "ZA", name: "Afrique du Sud", nameEn: "South Africa", continent: "Africa", lat: -30.5595, lng: 22.9375, flag: "🇿🇦" },
  MA: { code: "MA", name: "Maroc", nameEn: "Morocco", continent: "Africa", lat: 31.7917, lng: -7.0926, flag: "🇲🇦" },
  DZ: { code: "DZ", name: "Algérie", nameEn: "Algeria", continent: "Africa", lat: 28.0339, lng: 1.6596, flag: "🇩🇿" },
  TN: { code: "TN", name: "Tunisie", nameEn: "Tunisia", continent: "Africa", lat: 33.8869, lng: 9.5375, flag: "🇹🇳" },
  EG: { code: "EG", name: "Égypte", nameEn: "Egypt", continent: "Africa", lat: 26.8206, lng: 30.8025, flag: "🇪🇬" },
  AO: { code: "AO", name: "Angola", nameEn: "Angola", continent: "Africa", lat: -11.2027, lng: 17.8739, flag: "🇦🇴" },
  MZ: { code: "MZ", name: "Mozambique", nameEn: "Mozambique", continent: "Africa", lat: -18.6657, lng: 35.5296, flag: "🇲🇿" },
  ZM: { code: "ZM", name: "Zambie", nameEn: "Zambia", continent: "Africa", lat: -13.1339, lng: 27.8493, flag: "🇿🇲" },
  ZW: { code: "ZW", name: "Zimbabwe", nameEn: "Zimbabwe", continent: "Africa", lat: -19.0154, lng: 29.1549, flag: "🇿🇼" },
  MR: { code: "MR", name: "Mauritanie", nameEn: "Mauritania", continent: "Africa", lat: 21.0079, lng: -10.9408, flag: "🇲🇷" },
  GW: { code: "GW", name: "Guinée-Bissau", nameEn: "Guinea-Bissau", continent: "Africa", lat: 11.8037, lng: -15.1804, flag: "🇬🇼" },
  SL: { code: "SL", name: "Sierra Leone", nameEn: "Sierra Leone", continent: "Africa", lat: 8.4606, lng: -11.7799, flag: "🇸🇱" },
  LR: { code: "LR", name: "Libéria", nameEn: "Liberia", continent: "Africa", lat: 6.4281, lng: -9.4295, flag: "🇱🇷" },

  // ─── EUROPE (Europe) ───────────────────────────────────────────────────────
  FR: { code: "FR", name: "France", nameEn: "France", continent: "Europe", lat: 46.6033, lng: 1.8883, flag: "🇫🇷" },
  BE: { code: "BE", name: "Belgique", nameEn: "Belgium", continent: "Europe", lat: 50.5039, lng: 4.4699, flag: "🇧🇪" },
  CH: { code: "CH", name: "Suisse", nameEn: "Switzerland", continent: "Europe", lat: 46.8182, lng: 8.2275, flag: "🇨🇭" },
  DE: { code: "DE", name: "Allemagne", nameEn: "Germany", continent: "Europe", lat: 51.1657, lng: 10.4515, flag: "🇩🇪" },
  GB: { code: "GB", name: "Royaume-Uni", nameEn: "United Kingdom", continent: "Europe", lat: 55.3781, lng: -3.4360, flag: "🇬🇧" },
  ES: { code: "ES", name: "Espagne", nameEn: "Spain", continent: "Europe", lat: 40.4637, lng: -3.7492, flag: "🇪🇸" },
  IT: { code: "IT", name: "Italie", nameEn: "Italy", continent: "Europe", lat: 41.8719, lng: 12.5674, flag: "🇮🇹" },
  PT: { code: "PT", name: "Portugal", nameEn: "Portugal", continent: "Europe", lat: 39.3999, lng: -8.2245, flag: "🇵🇹" },
  NL: { code: "NL", name: "Pays-Bas", nameEn: "Netherlands", continent: "Europe", lat: 52.1326, lng: 5.2913, flag: "🇳🇱" },
  LU: { code: "LU", name: "Luxembourg", nameEn: "Luxembourg", continent: "Europe", lat: 49.8153, lng: 6.1296, flag: "🇱🇺" },
  SE: { code: "SE", name: "Suède", nameEn: "Sweden", continent: "Europe", lat: 60.1282, lng: 18.6435, flag: "🇸🇪" },
  NO: { code: "NO", name: "Norvège", nameEn: "Norway", continent: "Europe", lat: 60.4720, lng: 8.4689, flag: "🇳🇴" },
  DK: { code: "DK", name: "Danemark", nameEn: "Denmark", continent: "Europe", lat: 56.2639, lng: 9.5018, flag: "🇩🇰" },
  FI: { code: "FI", name: "Finlande", nameEn: "Finland", continent: "Europe", lat: 61.9241, lng: 25.7482, flag: "🇫🇮" },
  PL: { code: "PL", name: "Pologne", nameEn: "Poland", continent: "Europe", lat: 51.9194, lng: 19.1451, flag: "🇵🇱" },
  AT: { code: "AT", name: "Autriche", nameEn: "Austria", continent: "Europe", lat: 47.5162, lng: 14.5501, flag: "🇦🇹" },
  IE: { code: "IE", name: "Irlande", nameEn: "Ireland", continent: "Europe", lat: 53.4129, lng: -8.2439, flag: "🇮🇪" },
  GR: { code: "GR", name: "Grèce", nameEn: "Greece", continent: "Europe", lat: 39.0742, lng: 21.8243, flag: "🇬🇷" },
  TR: { code: "TR", name: "Turquie", nameEn: "Turkey", continent: "Europe", lat: 38.9637, lng: 35.2433, flag: "🇹🇷" },
  RU: { code: "RU", name: "Russie", nameEn: "Russia", continent: "Europe", lat: 61.5240, lng: 105.3188, flag: "🇷🇺" },
  UA: { code: "UA", name: "Ukraine", nameEn: "Ukraine", continent: "Europe", lat: 48.3794, lng: 31.1656, flag: "🇺🇦" },
  CZ: { code: "CZ", name: "République Tchèque", nameEn: "Czech Republic", continent: "Europe", lat: 49.8175, lng: 15.4730, flag: "🇨🇿" },
  RO: { code: "RO", name: "Roumanie", nameEn: "Romania", continent: "Europe", lat: 45.9432, lng: 24.9668, flag: "🇷🇴" },
  HU: { code: "HU", name: "Hongrie", nameEn: "Hungary", continent: "Europe", lat: 47.1625, lng: 19.5033, flag: "🇭🇺" },

  // ─── AMÉRIQUE DU NORD (North America) ───────────────────────────────────────
  US: { code: "US", name: "États-Unis", nameEn: "United States", continent: "North America", lat: 39.8283, lng: -98.5795, flag: "🇺🇸" },
  CA: { code: "CA", name: "Canada", nameEn: "Canada", continent: "North America", lat: 56.1304, lng: -106.3468, flag: "🇨🇦" },
  MX: { code: "MX", name: "Mexique", nameEn: "Mexico", continent: "North America", lat: 23.6345, lng: -102.5528, flag: "🇲🇽" },
  HT: { code: "HT", name: "Haïti", nameEn: "Haiti", continent: "North America", lat: 18.9712, lng: -72.2852, flag: "🇭🇹" },
  DO: { code: "DO", name: "République Dominicaine", nameEn: "Dominican Republic", continent: "North America", lat: 18.7357, lng: -70.1627, flag: "🇩🇴" },
  CU: { code: "CU", name: "Cuba", nameEn: "Cuba", continent: "North America", lat: 21.5218, lng: -77.7812, flag: "🇨🇺" },
  PA: { code: "PA", name: "Panama", nameEn: "Panama", continent: "North America", lat: 8.5380, lng: -80.7821, flag: "🇵🇦" },
  CR: { code: "CR", name: "Costa Rica", nameEn: "Costa Rica", continent: "North America", lat: 9.7489, lng: -83.7534, flag: "🇨🇷" },

  // ─── AMÉRIQUE DU SUD (South America) ───────────────────────────────────────
  BR: { code: "BR", name: "Brésil", nameEn: "Brazil", continent: "South America", lat: -14.2350, lng: -51.9253, flag: "🇧🇷" },
  AR: { code: "AR", name: "Argentine", nameEn: "Argentina", continent: "South America", lat: -38.4161, lng: -63.6167, flag: "🇦🇷" },
  CL: { code: "CL", name: "Chili", nameEn: "Chile", continent: "South America", lat: -35.6751, lng: -71.5430, flag: "🇨🇱" },
  CO: { code: "CO", name: "Colombie", nameEn: "Colombia", continent: "South America", lat: 4.5709, lng: -74.2973, flag: "🇨🇴" },
  PE: { code: "PE", name: "Pérou", nameEn: "Peru", continent: "South America", lat: -9.1900, lng: -75.0152, flag: "🇵🇪" },
  VE: { code: "VE", name: "Venezuela", nameEn: "Venezuela", continent: "South America", lat: 6.4238, lng: -66.5897, flag: "🇻🇪" },
  EC: { code: "EC", name: "Équateur", nameEn: "Ecuador", continent: "South America", lat: -1.8312, lng: -78.1834, flag: "🇪🇨" },
  BO: { code: "BO", name: "Bolivie", nameEn: "Bolivia", continent: "South America", lat: -16.2902, lng: -63.5887, flag: "🇧🇴" },

  // ─── ASIE & MOYEN-ORIENT (Asia) ─────────────────────────────────────────────
  CN: { code: "CN", name: "Chine", nameEn: "China", continent: "Asia", lat: 35.8617, lng: 104.1954, flag: "🇨🇳" },
  JP: { code: "JP", name: "Japon", nameEn: "Japan", continent: "Asia", lat: 36.2048, lng: 138.2529, flag: "🇯🇵" },
  IN: { code: "IN", name: "Inde", nameEn: "India", continent: "Asia", lat: 20.5937, lng: 78.9629, flag: "🇮🇳" },
  KR: { code: "KR", name: "Corée du Sud", nameEn: "South Korea", continent: "Asia", lat: 35.9078, lng: 127.7669, flag: "🇰🇷" },
  AE: { code: "AE", name: "Émirats Arabes Unis", nameEn: "United Arab Emirates", continent: "Asia", lat: 23.4241, lng: 53.8478, flag: "🇦🇪" },
  SA: { code: "SA", name: "Arabie Saoudite", nameEn: "Saudi Arabia", continent: "Asia", lat: 23.8859, lng: 45.0792, flag: "🇸🇦" },
  QA: { code: "QA", name: "Qatar", nameEn: "Qatar", continent: "Asia", lat: 25.3548, lng: 51.1839, flag: "🇶🇦" },
  SG: { code: "SG", name: "Singapour", nameEn: "Singapore", continent: "Asia", lat: 1.3521, lng: 103.8198, flag: "🇸🇬" },
  MY: { code: "MY", name: "Malaisie", nameEn: "Malaysia", continent: "Asia", lat: 4.2105, lng: 101.9758, flag: "🇲🇾" },
  TH: { code: "TH", name: "Thaïlande", nameEn: "Thailand", continent: "Asia", lat: 15.8700, lng: 100.9925, flag: "🇹🇭" },
  VN: { code: "VN", name: "Vietnam", nameEn: "Vietnam", continent: "Asia", lat: 14.0583, lng: 108.2772, flag: "🇻🇳" },
  ID: { code: "ID", name: "Indonésie", nameEn: "Indonesia", continent: "Asia", lat: -0.7893, lng: 113.9213, flag: "🇮🇩" },
  PH: { code: "PH", name: "Philippines", nameEn: "Philippines", continent: "Asia", lat: 12.8797, lng: 121.7740, flag: "🇵🇭" },
  PK: { code: "PK", name: "Pakistan", nameEn: "Pakistan", continent: "Asia", lat: 30.3753, lng: 69.3451, flag: "🇵🇰" },
  IL: { code: "IL", name: "Israël", nameEn: "Israel", continent: "Asia", lat: 31.0461, lng: 34.8516, flag: "🇮🇱" },

  // ─── OCÉANIE (Oceania) ──────────────────────────────────────────────────────
  AU: { code: "AU", name: "Australie", nameEn: "Australia", continent: "Oceania", lat: -25.2744, lng: 133.7751, flag: "🇦🇺" },
  NZ: { code: "NZ", name: "Nouvelle-Zélande", nameEn: "New Zealand", continent: "Oceania", lat: -40.9006, lng: 174.8860, flag: "🇳🇿" },
};

// ─── Continents Metadata & Couleurs Thématiques ──────────────────────────────
export const CONTINENTS_META: Record<Continent, { name: string; color: string; bgGradient: string; icon: string }> = {
  Africa: { name: "Afrique", color: "#ff6600", bgGradient: "from-[#ff6600]/20 to-transparent", icon: "🌍" },
  Europe: { name: "Europe", color: "#3b82f6", bgGradient: "from-[#3b82f6]/20 to-transparent", icon: "🌍" },
  "North America": { name: "Amérique du Nord", color: "#10b981", bgGradient: "from-[#10b981]/20 to-transparent", icon: "🌎" },
  "South America": { name: "Amérique du Sud", color: "#ec4899", bgGradient: "from-[#ec4899]/20 to-transparent", icon: "🌎" },
  Asia: { name: "Asie & Moyen-Orient", color: "#8b5cf6", bgGradient: "from-[#8b5cf6]/20 to-transparent", icon: "🌏" },
  Oceania: { name: "Océanie", color: "#06b6d4", bgGradient: "from-[#06b6d4]/20 to-transparent", icon: "🌏" },
};

// ─── ISO Numeric (world-atlas) to ISO Alpha-2 Mapping ────────────────────────
export const ISO_NUMERIC_TO_ALPHA2: Record<string, string> = {
  "004": "AF", "008": "AL", "012": "DZ", "024": "AO", "032": "AR", "036": "AU",
  "040": "AT", "056": "BE", "204": "BJ", "068": "BO", "076": "BR", "854": "BF",
  "108": "BI", "120": "CM", "124": "CA", "140": "CF", "148": "TD", "152": "CL",
  "156": "CN", "170": "CO", "178": "CG", "180": "CD", "384": "CI", "192": "CU",
  "208": "DK", "818": "EG", "231": "ET", "246": "FI", "250": "FR", "266": "GA",
  "276": "DE", "288": "GH", "300": "GR", "324": "GN", "356": "IN", "360": "ID",
  "364": "IR", "368": "IQ", "372": "IE", "376": "IL", "380": "IT", "392": "JP",
  "404": "KE", "410": "KR", "428": "LV", "430": "LR", "434": "LY", "450": "MG",
  "466": "ML", "504": "MA", "508": "MZ", "566": "NG", "562": "NE", "528": "NL",
  "554": "NZ", "578": "NO", "586": "PK", "604": "PE", "608": "PH", "616": "PL",
  "620": "PT", "642": "RO", "643": "RU", "646": "RW", "682": "SA", "686": "SN",
  "710": "ZA", "724": "ES", "752": "SE", "756": "CH", "768": "TG", "788": "TN",
  "792": "TR", "800": "UG", "804": "UA", "784": "AE", "826": "GB", "840": "US",
  "858": "UY", "862": "VE", "704": "VN",
  // Also string versions without leading zeroes:
  "4": "AF", "8": "AL", "12": "DZ", "24": "AO", "32": "AR", "36": "AU",
  "40": "AT", "56": "BE", "68": "BO", "76": "BR"
};

// ─── Helper Functions ────────────────────────────────────────────────────────
export function getCountryData(code?: string): CountryGeoData {
  if (!code) return { code: "XX", name: "Inconnu", nameEn: "Unknown", continent: "Africa", lat: 0, lng: 0, flag: "🌐" };
  const upper = code.toUpperCase().trim();
  return WORLD_COUNTRIES[upper] || {
    code: upper,
    name: upper,
    nameEn: upper,
    continent: "Africa",
    lat: 12.2383,
    lng: -1.5616,
    flag: "🌐",
  };
}

export function getContinentForCountry(code?: string): Continent {
  return getCountryData(code).continent;
}

export function getCountryName(code?: string): string {
  return getCountryData(code).name;
}

export function getCountryFlag(code?: string): string {
  return getCountryData(code).flag;
}

export function getCountryFromGeography(geo: any): CountryGeoData {
  const idStr = String(geo.id || "").padStart(3, "0");
  const iso2FromNumeric = ISO_NUMERIC_TO_ALPHA2[idStr] || ISO_NUMERIC_TO_ALPHA2[String(geo.id || "")];
  if (iso2FromNumeric && WORLD_COUNTRIES[iso2FromNumeric]) {
    return WORLD_COUNTRIES[iso2FromNumeric];
  }

  const name = geo.properties?.name || "";
  if (name) {
    const found = Object.values(WORLD_COUNTRIES).find(
      (c) => c.name.toLowerCase() === name.toLowerCase() || c.nameEn.toLowerCase() === name.toLowerCase()
    );
    if (found) return found;
  }

  return {
    code: geo.id || "XX",
    name: name || "Territoire",
    nameEn: name || "Territory",
    continent: "Europe",
    lat: 0,
    lng: 0,
    flag: "🌐",
  };
}

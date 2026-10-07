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
  UY: { code: "UY", name: "Uruguay", nameEn: "Uruguay", continent: "South America", lat: -32.5228, lng: -55.7658, flag: "🇺🇾" },
  PY: { code: "PY", name: "Paraguay", nameEn: "Paraguay", continent: "South America", lat: -23.4425, lng: -58.4438, flag: "🇵🇾" },
  GF: { code: "GF", name: "Guyane française", nameEn: "French Guiana", continent: "South America", lat: 3.9339, lng: -53.1258, flag: "🇬🇫" },
  SR: { code: "SR", name: "Suriname", nameEn: "Suriname", continent: "South America", lat: 3.9193, lng: -56.0278, flag: "🇸🇷" },
  GY: { code: "GY", name: "Guyana", nameEn: "Guyana", continent: "South America", lat: 4.8604, lng: -58.9302, flag: "🇬🇾" },

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

// ─── Continents Metadata & Theme Colors ─────────────────────────────────────
export const CONTINENTS_META: Record<Continent, { name: string; color: string; bgGradient: string; icon: string }> = {
  Africa: { name: "Africa", color: "#ff6600", bgGradient: "from-[#ff6600]/20 to-transparent", icon: "🌍" },
  Europe: { name: "Europe", color: "#3b82f6", bgGradient: "from-[#3b82f6]/20 to-transparent", icon: "🌍" },
  "North America": { name: "North America", color: "#10b981", bgGradient: "from-[#10b981]/20 to-transparent", icon: "🌎" },
  "South America": { name: "South America", color: "#ec4899", bgGradient: "from-[#ec4899]/20 to-transparent", icon: "🌎" },
  Asia: { name: "Asia & Middle East", color: "#8b5cf6", bgGradient: "from-[#8b5cf6]/20 to-transparent", icon: "🌏" },
  Oceania: { name: "Oceania", color: "#06b6d4", bgGradient: "from-[#06b6d4]/20 to-transparent", icon: "🌏" },
};

// ─── ISO 3166-1 Alpha-2 to Continent Mapping (All Countries) ────────────────
export const ISO2_TO_CONTINENT: Record<string, Continent> = {
  // Africa
  DZ: "Africa", AO: "Africa", BJ: "Africa", BW: "Africa", BF: "Africa", BI: "Africa",
  CV: "Africa", CM: "Africa", CF: "Africa", TD: "Africa", KM: "Africa", CG: "Africa",
  CD: "Africa", CI: "Africa", DJ: "Africa", EG: "Africa", GQ: "Africa", ER: "Africa",
  SZ: "Africa", ET: "Africa", GA: "Africa", GM: "Africa", GH: "Africa", GN: "Africa",
  GW: "Africa", KE: "Africa", LS: "Africa", LR: "Africa", LY: "Africa", MG: "Africa",
  MW: "Africa", ML: "Africa", MR: "Africa", MU: "Africa", YT: "Africa", MA: "Africa",
  MZ: "Africa", NA: "Africa", NE: "Africa", NG: "Africa", RE: "Africa", RW: "Africa",
  SH: "Africa", ST: "Africa", SN: "Africa", SC: "Africa", SL: "Africa", SO: "Africa",
  ZA: "Africa", SS: "Africa", SD: "Africa", TZ: "Africa", TG: "Africa", TN: "Africa",
  UG: "Africa", EH: "Africa", ZM: "Africa", ZW: "Africa",

  // Europe
  AL: "Europe", AD: "Europe", AT: "Europe", BY: "Europe", BE: "Europe", BA: "Europe",
  BG: "Europe", HR: "Europe", CY: "Europe", CZ: "Europe", DK: "Europe", EE: "Europe",
  FO: "Europe", FI: "Europe", FR: "Europe", DE: "Europe", GI: "Europe", GR: "Europe",
  GG: "Europe", VA: "Europe", HU: "Europe", IS: "Europe", IE: "Europe", IM: "Europe",
  IT: "Europe", JE: "Europe", LV: "Europe", LI: "Europe", LT: "Europe", LU: "Europe",
  MT: "Europe", MD: "Europe", MC: "Europe", ME: "Europe", NL: "Europe", MK: "Europe",
  NO: "Europe", PL: "Europe", PT: "Europe", RO: "Europe", RU: "Europe", SM: "Europe",
  RS: "Europe", SK: "Europe", SI: "Europe", ES: "Europe", SJ: "Europe", SE: "Europe",
  CH: "Europe", UA: "Europe", GB: "Europe", UK: "Europe", AX: "Europe", XK: "Europe",

  // North America
  AI: "North America", AG: "North America", AW: "North America", BS: "North America",
  BB: "North America", BZ: "North America", BM: "North America", BQ: "North America",
  VG: "North America", CA: "North America", KY: "North America", CR: "North America",
  CU: "North America", CW: "North America", DM: "North America", DO: "North America",
  SV: "North America", GL: "North America", GD: "North America", GP: "North America",
  GT: "North America", HT: "North America", HN: "North America", JM: "North America",
  MQ: "North America", MX: "North America", MS: "North America", NI: "North America",
  PA: "North America", PR: "North America", BL: "North America", KN: "North America",
  LC: "North America", MF: "North America", PM: "North America", VC: "North America",
  SX: "North America", TT: "North America", TC: "North America", US: "North America",
  VI: "North America",

  // South America
  AR: "South America", BO: "South America", BR: "South America", CL: "South America",
  CO: "South America", EC: "South America", FK: "South America", GF: "South America",
  GY: "South America", PY: "South America", PE: "South America", SR: "South America",
  UY: "South America", VE: "South America",

  // Asia
  AF: "Asia", AM: "Asia", AZ: "Asia", BH: "Asia", BD: "Asia", BT: "Asia", BN: "Asia",
  KH: "Asia", CN: "Asia", GE: "Asia", HK: "Asia", IN: "Asia", ID: "Asia", IR: "Asia",
  IQ: "Asia", IL: "Asia", JP: "Asia", JO: "Asia", KZ: "Asia", KW: "Asia", KG: "Asia",
  LA: "Asia", LB: "Asia", MO: "Asia", MY: "Asia", MV: "Asia", MN: "Asia", MM: "Asia",
  NP: "Asia", KP: "Asia", OM: "Asia", PK: "Asia", PS: "Asia", PH: "Asia", QA: "Asia",
  SA: "Asia", SG: "Asia", KR: "Asia", LK: "Asia", SY: "Asia", TW: "Asia", TJ: "Asia",
  TH: "Asia", TL: "Asia", TR: "Asia", TM: "Asia", AE: "Asia", UZ: "Asia", VN: "Asia",
  YE: "Asia",

  // Oceania
  AS: "Oceania", AU: "Oceania", CK: "Oceania", FJ: "Oceania", PF: "Oceania", GU: "Oceania",
  KI: "Oceania", MH: "Oceania", FM: "Oceania", NR: "Oceania", NC: "Oceania", NZ: "Oceania",
  NU: "Oceania", NF: "Oceania", MP: "Oceania", PW: "Oceania", PG: "Oceania", PN: "Oceania",
  WS: "Oceania", SB: "Oceania", TK: "Oceania", TO: "Oceania", TV: "Oceania", VU: "Oceania",
  WF: "Oceania",
};

// ─── ISO Numeric (world-atlas) to ISO Alpha-2 Mapping ────────────────────────
export const ISO_NUMERIC_TO_ALPHA2: Record<string, string> = {
  "004": "AF", "008": "AL", "012": "DZ", "020": "AD", "024": "AO", "032": "AR", "036": "AU",
  "040": "AT", "056": "BE", "204": "BJ", "068": "BO", "076": "BR", "854": "BF",
  "108": "BI", "120": "CM", "124": "CA", "140": "CF", "148": "TD", "152": "CL",
  "156": "CN", "170": "CO", "178": "CG", "180": "CD", "384": "CI", "192": "CU",
  "208": "DK", "818": "EG", "231": "ET", "246": "FI", "250": "FR", "254": "GF", "266": "GA",
  "276": "DE", "288": "GH", "300": "GR", "324": "GN", "356": "IN", "360": "ID",
  "364": "IR", "368": "IQ", "372": "IE", "376": "IL", "380": "IT", "392": "JP",
  "404": "KE", "410": "KR", "428": "LV", "430": "LR", "434": "LY", "450": "MG",
  "466": "ML", "504": "MA", "508": "MZ", "566": "NG", "562": "NE", "528": "NL",
  "554": "NZ", "578": "NO", "586": "PK", "604": "PE", "608": "PH", "616": "PL",
  "620": "PT", "642": "RO", "643": "RU", "646": "RW", "682": "SA", "686": "SN",
  "710": "ZA", "724": "ES", "752": "SE", "756": "CH", "768": "TG", "788": "TN",
  "792": "TR", "800": "UG", "804": "UA", "784": "AE", "826": "GB", "840": "US",
  "858": "UY", "862": "VE", "704": "VN", "348": "HU", "203": "CZ", "703": "SK",
  "100": "BG", "191": "HR", "688": "RS", "705": "SI", "070": "BA", "807": "MK",
  "499": "ME", "233": "EE", "440": "LT", "112": "BY", "498": "MD", "352": "IS",
  "442": "LU", "492": "MC", "484": "MX", "320": "GT", "340": "HN", "222": "SV",
  "558": "NI", "188": "CR", "591": "PA", "740": "SR", "328": "GY", "398": "KZ",
  "860": "UZ", "795": "TM", "417": "KG", "762": "TJ", "496": "MN",
  // String versions without leading zeroes:
  "4": "AF", "8": "AL", "12": "DZ", "20": "AD", "24": "AO", "32": "AR", "36": "AU",
  "40": "AT", "56": "BE", "68": "BO", "76": "BR", "70": "BA"
};

// ─── TopoJSON MultiPolygon Preprocessor for France & Overseas Territories ──────
export function preprocessWorldGeographies(rawGeographies: any[]): any[] {
  if (!Array.isArray(rawGeographies)) return [];
  const result: any[] = [];
  for (const geo of rawGeographies) {
    // Split France feature (250) into Metropolitan France & French Guiana
    if (
      (geo.id === "250" || geo.id === 250) &&
      geo.geometry &&
      geo.geometry.type === "MultiPolygon" &&
      Array.isArray(geo.geometry.coordinates) &&
      geo.geometry.coordinates.length >= 2
    ) {
      // Coordinates[0] is French Guiana in South America (sample point [-51.65, 4.15])
      // Coordinates[1+] are Metropolitan France and Corsica in Europe
      const guianaCoords = [geo.geometry.coordinates[0]];
      const metroCoords = geo.geometry.coordinates.slice(1);

      result.push({
        ...geo,
        id: "250",
        rsmKey: "geo-250-france",
        properties: { ...geo.properties, name: "France", iso2: "FR" },
        geometry: {
          type: "MultiPolygon",
          coordinates: metroCoords,
        },
      });

      result.push({
        ...geo,
        id: "254",
        rsmKey: "geo-254-guiana",
        properties: { ...geo.properties, name: "French Guiana", iso2: "GF" },
        geometry: {
          type: "MultiPolygon",
          coordinates: guianaCoords,
        },
      });
    } else {
      result.push(geo);
    }
  }
  return result;
}

// ─── Helper Functions ────────────────────────────────────────────────────────
export function getCountryData(code?: string): CountryGeoData {
  if (!code) return { code: "XX", name: "Unknown", nameEn: "Unknown", continent: "Africa", lat: 0, lng: 0, flag: "🌐" };
  const upper = code.toUpperCase().trim();
  const c = WORLD_COUNTRIES[upper];
  const detectedContinent = ISO2_TO_CONTINENT[upper] || c?.continent || "Africa";
  if (c) {
    return { ...c, continent: detectedContinent, name: c.nameEn || c.name };
  }
  return {
    code: upper,
    name: upper,
    nameEn: upper,
    continent: detectedContinent,
    lat: 12.2383,
    lng: -1.5616,
    flag: getCountryFlag(upper),
  };
}

export function isValidCountryContinent(code?: string): boolean {
  if (!code) return false;
  const upper = code.toUpperCase().trim();
  if (upper === "XX" || upper === "UNKNOWN" || upper === "INCONNU" || upper === "LOCAL" || upper === "T1") {
    return false;
  }
  if (ISO2_TO_CONTINENT[upper] || WORLD_COUNTRIES[upper]?.continent) return true;
  const lower = upper.toLowerCase();
  return Object.values(WORLD_COUNTRIES).some(
    (c) => c.name.toLowerCase() === lower || c.nameEn.toLowerCase() === lower
  );
}

export function getContinentForCountry(code?: string): Continent {
  if (!code) return "Europe";
  const upper = code.toUpperCase().trim();
  if (ISO2_TO_CONTINENT[upper]) return ISO2_TO_CONTINENT[upper];
  if (WORLD_COUNTRIES[upper]?.continent) return WORLD_COUNTRIES[upper].continent;

  const lower = upper.toLowerCase();
  for (const c of Object.values(WORLD_COUNTRIES)) {
    if (
      c.name.toLowerCase() === lower ||
      c.nameEn.toLowerCase() === lower ||
      c.code.toLowerCase() === lower
    ) {
      return c.continent;
    }
  }
  return "Europe";
}

export function getCountryName(code?: string): string {
  const d = getCountryData(code);
  return d.nameEn || d.name;
}

export function getCountryFlag(code?: string): string {
  if (!code) return "🌐";
  const upper = code.trim().toUpperCase();
  const foundFlag = WORLD_COUNTRIES[upper]?.flag;
  if (foundFlag && foundFlag !== "🌐") {
    return foundFlag;
  }
  if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) {
    try {
      const codePoints = upper
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return "🌐";
    }
  }
  return "🌐";
}

export function getCountryFromGeography(geo: any): CountryGeoData {
  if (geo.properties?.iso2) {
    const iso2 = String(geo.properties.iso2).toUpperCase();
    if (WORLD_COUNTRIES[iso2]) {
      const c = WORLD_COUNTRIES[iso2];
      return { ...c, continent: ISO2_TO_CONTINENT[iso2] || c.continent, name: c.nameEn || c.name };
    }
    if (ISO2_TO_CONTINENT[iso2]) {
      return getCountryData(iso2);
    }
  }

  const rawId = String(geo.id || "").trim();
  const idStr = rawId.padStart(3, "0");

  if (rawId === "254" || idStr === "254") {
    const c = WORLD_COUNTRIES["GF"];
    return { ...c, continent: "South America", name: c?.nameEn || "French Guiana" };
  }

  const iso2FromNumeric = ISO_NUMERIC_TO_ALPHA2[idStr] || ISO_NUMERIC_TO_ALPHA2[rawId];
  if (iso2FromNumeric) {
    const upperIso = iso2FromNumeric.toUpperCase();
    if (WORLD_COUNTRIES[upperIso]) {
      const c = WORLD_COUNTRIES[upperIso];
      return { ...c, continent: ISO2_TO_CONTINENT[upperIso] || c.continent, name: c.nameEn || c.name };
    }
    if (ISO2_TO_CONTINENT[upperIso]) {
      return getCountryData(upperIso);
    }
  }

  const name = geo.properties?.name || "";
  if (name) {
    const found = Object.values(WORLD_COUNTRIES).find(
      (c) => c.name.toLowerCase() === name.toLowerCase() || c.nameEn.toLowerCase() === name.toLowerCase()
    );
    if (found) {
      return { ...found, continent: ISO2_TO_CONTINENT[found.code] || found.continent, name: found.nameEn || found.name };
    }
  }

  const fallbackContinent = (iso2FromNumeric && ISO2_TO_CONTINENT[iso2FromNumeric.toUpperCase()]) || "Europe";
  return {
    code: iso2FromNumeric || geo.id || "XX",
    name: name || "Territory",
    nameEn: name || "Territory",
    continent: fallbackContinent,
    lat: 0,
    lng: 0,
    flag: iso2FromNumeric ? getCountryFlag(iso2FromNumeric) : "🌐",
  };
}

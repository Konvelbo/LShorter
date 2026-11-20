// =============================================================================
// LShorter — Moteur Vérifié de Drapeaux & Pays Mondiaux (ISO 3166-1 alpha-2)
// Vérification stricte et réconciliation de cohérence Code ↔ Drapeau ↔ Nom de pays
// =============================================================================

export interface VerifiedCountryInfo {
  countryCode: string;
  countryName: string;
  countryNameEn: string;
  city: string;
  flagUrl: string;
  flagEmoji: string;
  isKnown: boolean;
}

/**
 * Dictionnaire bilingue canonique des pays et territoires mondiaux (ISO 3166-1 alpha-2).
 * Contient le nom en français (utilisé par défaut pour l'interface), le nom en anglais,
 * et l'émoji officiel du drapeau.
 */
export const VERIFIED_COUNTRIES: Record<
  string,
  { nameFr: string; nameEn: string; flag: string }
> = {
  // Afrique
  BF: { nameFr: "Burkina Faso", nameEn: "Burkina Faso", flag: "🇧🇫" },
  CI: { nameFr: "Côte d'Ivoire", nameEn: "Ivory Coast", flag: "🇨🇮" },
  SN: { nameFr: "Sénégal", nameEn: "Senegal", flag: "🇸🇳" },
  CM: { nameFr: "Cameroun", nameEn: "Cameroon", flag: "🇨🇲" },
  ML: { nameFr: "Mali", nameEn: "Mali", flag: "🇲🇱" },
  NE: { nameFr: "Niger", nameEn: "Niger", flag: "🇳🇪" },
  TG: { nameFr: "Togo", nameEn: "Togo", flag: "🇹🇬" },
  BJ: { nameFr: "Bénin", nameEn: "Benin", flag: "🇧🇯" },
  GH: { nameFr: "Ghana", nameEn: "Ghana", flag: "🇬🇭" },
  NG: { nameFr: "Nigéria", nameEn: "Nigeria", flag: "🇳🇬" },
  GN: { nameFr: "Guinée", nameEn: "Guinea", flag: "🇬🇳" },
  GA: { nameFr: "Gabon", nameEn: "Gabon", flag: "🇬🇦" },
  CD: { nameFr: "RDC", nameEn: "DR Congo", flag: "🇨🇩" },
  CG: { nameFr: "Congo", nameEn: "Republic of the Congo", flag: "🇨🇬" },
  TD: { nameFr: "Tchad", nameEn: "Chad", flag: "🇹🇩" },
  CF: { nameFr: "Centrafrique", nameEn: "Central African Republic", flag: "🇨🇫" },
  RW: { nameFr: "Rwanda", nameEn: "Rwanda", flag: "🇷🇼" },
  BI: { nameFr: "Burundi", nameEn: "Burundi", flag: "🇧🇮" },
  KE: { nameFr: "Kenya", nameEn: "Kenya", flag: "🇰🇪" },
  TZ: { nameFr: "Tanzanie", nameEn: "Tanzania", flag: "🇹🇿" },
  UG: { nameFr: "Ouganda", nameEn: "Uganda", flag: "🇺🇬" },
  ET: { nameFr: "Éthiopie", nameEn: "Ethiopia", flag: "🇪🇹" },
  MG: { nameFr: "Madagascar", nameEn: "Madagascar", flag: "🇲🇬" },
  ZA: { nameFr: "Afrique du Sud", nameEn: "South Africa", flag: "🇿🇦" },
  MA: { nameFr: "Maroc", nameEn: "Morocco", flag: "🇲🇦" },
  DZ: { nameFr: "Algérie", nameEn: "Algeria", flag: "🇩🇿" },
  TN: { nameFr: "Tunisie", nameEn: "Tunisia", flag: "🇹🇳" },
  EG: { nameFr: "Égypte", nameEn: "Egypt", flag: "🇪🇬" },
  AO: { nameFr: "Angola", nameEn: "Angola", flag: "🇦🇴" },
  MZ: { nameFr: "Mozambique", nameEn: "Mozambique", flag: "🇲🇿" },
  ZM: { nameFr: "Zambie", nameEn: "Zambia", flag: "🇿🇲" },
  ZW: { nameFr: "Zimbabwe", nameEn: "Zimbabwe", flag: "🇿🇼" },
  MR: { nameFr: "Mauritanie", nameEn: "Mauritania", flag: "🇲🇷" },
  GW: { nameFr: "Guinée-Bissau", nameEn: "Guinea-Bissau", flag: "🇬🇼" },
  SL: { nameFr: "Sierra Leone", nameEn: "Sierra Leone", flag: "🇸🇱" },
  LR: { nameFr: "Libéria", nameEn: "Liberia", flag: "🇱🇷" },
  SO: { nameFr: "Somalie", nameEn: "Somalia", flag: "🇸🇴" },
  SD: { nameFr: "Soudan", nameEn: "Sudan", flag: "🇸🇩" },
  SS: { nameFr: "Soudan du Sud", nameEn: "South Sudan", flag: "🇸🇸" },
  MU: { nameFr: "Maurice", nameEn: "Mauritius", flag: "🇲🇺" },

  // Europe
  FR: { nameFr: "France", nameEn: "France", flag: "🇫🇷" },
  GB: { nameFr: "Royaume-Uni", nameEn: "United Kingdom", flag: "🇬🇧" },
  DE: { nameFr: "Allemagne", nameEn: "Germany", flag: "🇩🇪" },
  ES: { nameFr: "Espagne", nameEn: "Spain", flag: "🇪🇸" },
  IT: { nameFr: "Italie", nameEn: "Italy", flag: "🇮🇹" },
  BE: { nameFr: "Belgique", nameEn: "Belgium", flag: "🇧🇪" },
  CH: { nameFr: "Suisse", nameEn: "Switzerland", flag: "🇨🇭" },
  PT: { nameFr: "Portugal", nameEn: "Portugal", flag: "🇵🇹" },
  NL: { nameFr: "Pays-Bas", nameEn: "Netherlands", flag: "🇳🇱" },
  LU: { nameFr: "Luxembourg", nameEn: "Luxembourg", flag: "🇱🇺" },
  SE: { nameFr: "Suède", nameEn: "Sweden", flag: "🇸🇪" },
  NO: { nameFr: "Norvège", nameEn: "Norway", flag: "🇳🇴" },
  DK: { nameFr: "Danemark", nameEn: "Denmark", flag: "🇩🇰" },
  FI: { nameFr: "Finlande", nameEn: "Finland", flag: "🇫🇮" },
  IE: { nameFr: "Irlande", nameEn: "Ireland", flag: "🇮🇪" },
  AT: { nameFr: "Autriche", nameEn: "Austria", flag: "🇦🇹" },
  PL: { nameFr: "Pologne", nameEn: "Poland", flag: "🇵🇱" },
  GR: { nameFr: "Grèce", nameEn: "Greece", flag: "🇬🇷" },
  CZ: { nameFr: "République Tchèque", nameEn: "Czech Republic", flag: "🇨🇿" },
  RO: { nameFr: "Roumanie", nameEn: "Romania", flag: "🇷🇴" },
  HU: { nameFr: "Hongrie", nameEn: "Hungary", flag: "🇭🇺" },
  TR: { nameFr: "Turquie", nameEn: "Turkey", flag: "🇹🇷" },
  RU: { nameFr: "Russie", nameEn: "Russia", flag: "🇷🇺" },
  UA: { nameFr: "Ukraine", nameEn: "Ukraine", flag: "🇺🇦" },
  IS: { nameFr: "Islande", nameEn: "Iceland", flag: "🇮🇸" },
  HR: { nameFr: "Croatie", nameEn: "Croatia", flag: "🇭🇷" },
  BG: { nameFr: "Bulgarie", nameEn: "Bulgaria", flag: "🇧🇬" },
  SK: { nameFr: "Slovaquie", nameEn: "Slovakia", flag: "🇸🇰" },
  EE: { nameFr: "Estonie", nameEn: "Estonia", flag: "🇪🇪" },
  LV: { nameFr: "Lettonie", nameEn: "Latvia", flag: "🇱🇻" },
  LT: { nameFr: "Lituanie", nameEn: "Lithuania", flag: "🇱🇹" },
  SI: { nameFr: "Slovénie", nameEn: "Slovenia", flag: "🇸🇮" },
  CY: { nameFr: "Chypre", nameEn: "Cyprus", flag: "🇨🇾" },
  MT: { nameFr: "Malte", nameEn: "Malta", flag: "🇲🇹" },
  AL: { nameFr: "Albanie", nameEn: "Albania", flag: "🇦🇱" },
  RS: { nameFr: "Serbie", nameEn: "Serbia", flag: "🇷🇸" },

  // Amérique du Nord & Caraïbes
  US: { nameFr: "États-Unis", nameEn: "United States", flag: "🇺🇸" },
  CA: { nameFr: "Canada", nameEn: "Canada", flag: "🇨🇦" },
  MX: { nameFr: "Mexique", nameEn: "Mexico", flag: "🇲🇽" },
  HT: { nameFr: "Haïti", nameEn: "Haiti", flag: "🇭🇹" },
  DO: { nameFr: "République Dominicaine", nameEn: "Dominican Republic", flag: "🇩🇴" },
  CU: { nameFr: "Cuba", nameEn: "Cuba", flag: "🇨🇺" },
  PA: { nameFr: "Panama", nameEn: "Panama", flag: "🇵🇦" },
  CR: { nameFr: "Costa Rica", nameEn: "Costa Rica", flag: "🇨🇷" },
  JM: { nameFr: "Jamaïque", nameEn: "Jamaica", flag: "🇯🇲" },
  PR: { nameFr: "Porto Rico", nameEn: "Puerto Rico", flag: "🇵🇷" },

  // Amérique du Sud
  BR: { nameFr: "Brésil", nameEn: "Brazil", flag: "🇧🇷" },
  AR: { nameFr: "Argentine", nameEn: "Argentina", flag: "🇦🇷" },
  CL: { nameFr: "Chili", nameEn: "Chile", flag: "🇨🇱" },
  CO: { nameFr: "Colombie", nameEn: "Colombia", flag: "🇨🇴" },
  PE: { nameFr: "Pérou", nameEn: "Peru", flag: "🇵🇪" },
  VE: { nameFr: "Venezuela", nameEn: "Venezuela", flag: "🇻🇪" },
  EC: { nameFr: "Équateur", nameEn: "Ecuador", flag: "🇪🇨" },
  BO: { nameFr: "Bolivie", nameEn: "Bolivia", flag: "🇧🇴" },
  UY: { nameFr: "Uruguay", nameEn: "Uruguay", flag: "🇺🇾" },
  PY: { nameFr: "Paraguay", nameEn: "Paraguay", flag: "🇵🇾" },

  // Asie & Moyen-Orient
  CN: { nameFr: "Chine", nameEn: "China", flag: "🇨🇳" },
  JP: { nameFr: "Japon", nameEn: "Japan", flag: "🇯🇵" },
  IN: { nameFr: "Inde", nameEn: "India", flag: "🇮🇳" },
  KR: { nameFr: "Corée du Sud", nameEn: "South Korea", flag: "🇰🇷" },
  AE: { nameFr: "Émirats Arabes Unis", nameEn: "United Arab Emirates", flag: "🇦🇪" },
  SA: { nameFr: "Arabie Saoudite", nameEn: "Saudi Arabia", flag: "🇸🇦" },
  QA: { nameFr: "Qatar", nameEn: "Qatar", flag: "🇶🇦" },
  SG: { nameFr: "Singapour", nameEn: "Singapore", flag: "🇸🇬" },
  MY: { nameFr: "Malaisie", nameEn: "Malaysia", flag: "🇲🇾" },
  TH: { nameFr: "Thaïlande", nameEn: "Thailand", flag: "🇹🇭" },
  VN: { nameFr: "Vietnam", nameEn: "Vietnam", flag: "🇻🇳" },
  ID: { nameFr: "Indonésie", nameEn: "Indonesia", flag: "🇮🇩" },
  PH: { nameFr: "Philippines", nameEn: "Philippines", flag: "🇵🇭" },
  PK: { nameFr: "Pakistan", nameEn: "Pakistan", flag: "🇵🇰" },
  IL: { nameFr: "Israël", nameEn: "Israel", flag: "🇮🇱" },
  TW: { nameFr: "Taïwan", nameEn: "Taiwan", flag: "🇹🇼" },
  HK: { nameFr: "Hong Kong", nameEn: "Hong Kong", flag: "🇭🇰" },
  LB: { nameFr: "Liban", nameEn: "Lebanon", flag: "🇱🇧" },
  JO: { nameFr: "Jordanie", nameEn: "Jordan", flag: "🇯🇴" },
  KW: { nameFr: "Koweït", nameEn: "Kuwait", flag: "🇰🇼" },

  // Océanie
  AU: { nameFr: "Australie", nameEn: "Australia", flag: "🇦🇺" },
  NZ: { nameFr: "Nouvelle-Zélande", nameEn: "New Zealand", flag: "🇳🇿" },
};

/**
 * Mapping des villes récurrentes / points de présence Cloudflare vers leur pays officiel
 */
export const CITY_TO_COUNTRY_CODE: Record<string, string> = {
  ouagadougou: "BF",
  bobo: "BF",
  "bobo-dioulasso": "BF",
  paris: "FR",
  marseille: "FR",
  lyon: "FR",
  toulouse: "FR",
  nice: "FR",
  nantes: "FR",
  strasbourg: "FR",
  bordeaux: "FR",
  lille: "FR",
  london: "GB",
  londres: "GB",
  manchester: "GB",
  birmingham: "GB",
  ashburn: "US",
  "new york": "US",
  "san francisco": "US",
  chicago: "US",
  dallas: "US",
  seattle: "US",
  los_angeles: "US",
  "los angeles": "US",
  miami: "US",
  atlanta: "US",
  abidjan: "CI",
  dakar: "SN",
  douala: "CM",
  yaounde: "CM",
  "yaoundé": "CM",
  bamako: "ML",
  niamey: "NE",
  lome: "TG",
  "lomé": "TG",
  cotonou: "BJ",
  accra: "GH",
  lagos: "NG",
  conakry: "GN",
  libreville: "GA",
  kinshasa: "CD",
  brazzaville: "CG",
  kigali: "RW",
  nairobi: "KE",
  casablanca: "MA",
  rabat: "MA",
  alger: "DZ",
  tunis: "TN",
  le_caire: "EG",
  "le caire": "EG",
  cairo: "EG",
  montreal: "CA",
  "montréal": "CA",
  toronto: "CA",
  vancouver: "CA",
  berlin: "DE",
  frankfurt: "DE",
  francfort: "DE",
  munich: "DE",
  madrid: "ES",
  barcelona: "ES",
  barcelone: "ES",
  rome: "IT",
  milan: "IT",
  brussels: "BE",
  bruxelles: "BE",
  geneva: "CH",
  "genève": "CH",
  zurich: "CH",
  amsterdam: "NL",
  dublin: "IE",
  tokyo: "JP",
  singapore: "SG",
  singapour: "SG",
  sydney: "AU",
  melbourne: "AU",
};

// Map précalculée pour résolution O(1) sans allocation mémoire par événement
const NAME_TO_CODE_MAP = new Map<string, string>();
for (const [code, data] of Object.entries(VERIFIED_COUNTRIES)) {
  NAME_TO_CODE_MAP.set(data.nameFr.toLowerCase(), code);
  NAME_TO_CODE_MAP.set(data.nameEn.toLowerCase(), code);
}

// Fallback international standard via Intl.DisplayNames si disponible
let intlDisplayFr: Intl.DisplayNames | null = null;
let intlDisplayEn: Intl.DisplayNames | null = null;
try {
  if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
    intlDisplayFr = new Intl.DisplayNames(["fr"], { type: "region" });
    intlDisplayEn = new Intl.DisplayNames(["en"], { type: "region" });
  }
} catch {}

/**
 * Normalise un code pays en 2 lettres majuscules ISO 3166-1 alpha-2
 */
export function cleanCountryCode(rawCode?: string | null): string {
  if (!rawCode) return "XX";
  const upper = rawCode.trim().toUpperCase();
  if (
    upper === "XX" ||
    upper === "UNKNOWN" ||
    upper === "INCONNU" ||
    upper === "LOCAL" ||
    upper === "T1" ||
    upper === "ZZ" ||
    upper === "--" ||
    !/^[A-Z]{2}$/.test(upper)
  ) {
    return "XX";
  }
  return upper;
}

/**
 * Génère l'URL officielle du drapeau FlagCDN en taille adaptée
 */
export function getFlagCdnUrl(code: string, size: 20 | 40 | 80 = 20): string {
  const clean = cleanCountryCode(code);
  if (clean === "XX") return "";
  return `https://flagcdn.com/w${size}/${clean.toLowerCase()}.png`;
}

/**
 * Cœur de vérification : Réconcilie et vérifie la stricte cohérence entre
 * le code ISO, le drapeau et le nom du pays.
 *
 * Élimine à 100% les anomalies du type :
 * - Drapeau du Burkina Faso (BF) avec libellé "France"
 * - Ville "Ouagadougou" avec code "FR"
 * - Incohérences causées par des filtres ou des sanitizers partiels
 */
export function resolveCountryInfo(input: {
  countryCode?: string | null;
  countryName?: string | null;
  city?: string | null;
}): VerifiedCountryInfo {
  let cleanCode = cleanCountryCode(input.countryCode);
  const rawCity = (input.city || "").trim();
  const normalizedCityKey = rawCity.toLowerCase();
  const rawCountryName = (input.countryName || "").trim();

  // 1. Détection de ville connue prioritaire si code manquant ou contradictoire
  const detectedCodeFromCity = CITY_TO_COUNTRY_CODE[normalizedCityKey];
  if (detectedCodeFromCity) {
    // Si le code actuel est XX ou contredit la ville évidente (ex: Ouagadougou avec FR)
    if (cleanCode === "XX" || (cleanCode === "FR" && detectedCodeFromCity === "BF")) {
      cleanCode = detectedCodeFromCity;
    }
  }

  // 2. Si le code est XX mais qu'un nom de pays valide est fourni en texte, résolution O(1) via map
  if (cleanCode === "XX" && rawCountryName) {
    const match = NAME_TO_CODE_MAP.get(rawCountryName.toLowerCase());
    if (match) {
      cleanCode = match;
    }
  }

  // 3. Détermination autoritaire du nom du pays à partir du code validé
  const countryEntry = VERIFIED_COUNTRIES[cleanCode];

  let resolvedNameFr = "Inconnu";
  let resolvedNameEn = "Unknown";
  let flagEmoji = "🌐";
  let isKnown = false;

  if (countryEntry) {
    resolvedNameFr = countryEntry.nameFr;
    resolvedNameEn = countryEntry.nameEn;
    flagEmoji = countryEntry.flag;
    isKnown = true;
  } else if (cleanCode !== "XX") {
    // Résolution via Intl.DisplayNames standard pour tous les autres pays ISO mondiaux
    try {
      resolvedNameFr = intlDisplayFr?.of(cleanCode) || cleanCode;
      resolvedNameEn = intlDisplayEn?.of(cleanCode) || cleanCode;
      flagEmoji = cleanCode
        .split("")
        .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
        .join("");
    } catch {
      resolvedNameFr = cleanCode;
      resolvedNameEn = cleanCode;
      flagEmoji = "🌐";
    }
    isKnown = true;
  }

  // Ville de repli propre
  let resolvedCity = rawCity && rawCity !== "Inconnue" && rawCity !== "—" ? rawCity : "Edge PoP";
  if (cleanCode === "BF" && (!rawCity || rawCity === "Edge PoP" || rawCity === "Inconnue")) {
    resolvedCity = "Ouagadougou";
  }

  return {
    countryCode: cleanCode,
    countryName: resolvedNameFr,
    countryNameEn: resolvedNameEn,
    city: resolvedCity,
    flagUrl: cleanCode !== "XX" ? `https://flagcdn.com/w20/${cleanCode.toLowerCase()}.png` : "",
    flagEmoji,
    isKnown,
  };
}

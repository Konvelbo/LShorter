"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Sparkles,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useSession } from "next-auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { showToast } from "@/components/ui/toast-provider";

// Exhaustive list of all countries worldwide
const ALL_COUNTRIES = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦" },
  { code: "AL", name: "Albanie", flag: "🇦🇱" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "AD", name: "Andorre", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AG", name: "Antigua-et-Barbuda", flag: "🇦🇬" },
  { code: "SA", name: "Arabie Saoudite", flag: "🇸🇦" },
  { code: "AR", name: "Argentine", flag: "🇦🇷" },
  { code: "AM", name: "Arménie", flag: "🇦🇲" },
  { code: "AU", name: "Australie", flag: "🇦🇺" },
  { code: "AT", name: "Autriche", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaïdjan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahreïn", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbade", flag: "🇧🇧" },
  { code: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯" },
  { code: "BT", name: "Bhoutan", flag: "🇧🇹" },
  { code: "BY", name: "Biélorussie", flag: "🇧🇾" },
  { code: "MM", name: "Birmanie (Myanmar)", flag: "🇲🇲" },
  { code: "BO", name: "Bolivie", flag: "🇧🇴" },
  { code: "BA", name: "Bosnie-Herzégovine", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brésil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgarie", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "KH", name: "Cambodge", flag: "🇰🇭" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CV", name: "Cap-Vert", flag: "🇨🇻" },
  { code: "CL", name: "Chili", flag: "🇨🇱" },
  { code: "CN", name: "Chine", flag: "🇨🇳" },
  { code: "CY", name: "Chypre", flag: "🇨🇾" },
  { code: "CO", name: "Colombie", flag: "🇨🇴" },
  { code: "KM", name: "Comores", flag: "🇰🇲" },
  { code: "CG", name: "Congo-Brazzaville", flag: "🇨🇬" },
  { code: "CD", name: "Congo-Kinshasa (RDC)", flag: "🇨🇩" },
  { code: "KP", name: "Corée du Nord", flag: "🇰🇵" },
  { code: "KR", name: "Corée du Sud", flag: "🇰🇷" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "HR", name: "Croatie", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "DK", name: "Danemark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominique", flag: "🇩🇲" },
  { code: "EG", name: "Égypte", flag: "🇪🇬" },
  { code: "AE", name: "Émirats arabes unis", flag: "🇦🇪" },
  { code: "EC", name: "Équateur", flag: "🇪🇨" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷" },
  { code: "ES", name: "Espagne", flag: "🇪🇸" },
  { code: "EE", name: "Estonie", flag: "🇪🇪" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
  { code: "US", name: "États-Unis", flag: "🇺🇸" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹" },
  { code: "FJ", name: "Fidji", flag: "🇫🇯" },
  { code: "FI", name: "Finlande", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambie", flag: "🇬🇲" },
  { code: "GE", name: "Géorgie", flag: "🇬🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Grèce", flag: "🇬🇷" },
  { code: "GD", name: "Grenade", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinée", flag: "🇬🇳" },
  { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼" },
  { code: "GQ", name: "Guinée équatoriale", flag: "🇬🇶" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haïti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HU", name: "Hongrie", flag: "🇭🇺" },
  { code: "IN", name: "Inde", flag: "🇮🇳" },
  { code: "ID", name: "Indonésie", flag: "🇮🇩" },
  { code: "IQ", name: "Irak", flag: "🇮🇶" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IE", name: "Irlande", flag: "🇮🇪" },
  { code: "IS", name: "Islande", flag: "🇮🇸" },
  { code: "IL", name: "Israël", flag: "🇮🇱" },
  { code: "IT", name: "Italie", flag: "🇮🇹" },
  { code: "JM", name: "Jamaïque", flag: "🇯🇲" },
  { code: "JP", name: "Japon", flag: "🇯🇵" },
  { code: "JO", name: "Jordanie", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KG", name: "Kirghizistan", flag: "🇰🇬" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KW", name: "Koweït", flag: "🇰🇼" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LV", name: "Lettonie", flag: "🇱🇻" },
  { code: "LB", name: "Liban", flag: "🇱🇧" },
  { code: "LR", name: "Libéria", flag: "🇱🇷" },
  { code: "LY", name: "Libye", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lituanie", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MK", name: "Macédoine du Nord", flag: "🇲🇰" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MY", name: "Malaisie", flag: "🇲🇾" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malte", flag: "🇲🇹" },
  { code: "MA", name: "Maroc", flag: "🇲🇦" },
  { code: "MU", name: "Maurice", flag: "🇲🇺" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷" },
  { code: "MX", name: "Mexique", flag: "🇲🇽" },
  { code: "MD", name: "Moldavie", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolie", flag: "🇲🇳" },
  { code: "ME", name: "Monténégro", flag: "🇲🇪" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "NA", name: "Namibie", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Népal", flag: "🇳🇵" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigéria", flag: "🇳🇬" },
  { code: "NO", name: "Norvège", flag: "🇳🇴" },
  { code: "NZ", name: "Nouvelle-Zélande", flag: "🇳🇿" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬" },
  { code: "UZ", name: "Ouzbékistan", flag: "🇺🇿" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palaos", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", flag: "🇵🇸" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱" },
  { code: "PE", name: "Pérou", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Pologne", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "CF", name: "République centrafricaine", flag: "🇨🇫" },
  { code: "DO", name: "République dominicaine", flag: "🇩🇴" },
  { code: "CZ", name: "République tchèque", flag: "🇨🇿" },
  { code: "RO", name: "Roumanie", flag: "🇷🇴" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "RU", name: "Russie", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KN", name: "Saint-Christophe-et-Niévès", flag: "🇰🇳" },
  { code: "LC", name: "Sainte-Lucie", flag: "🇱🇨" },
  { code: "SM", name: "Saint-Marin", flag: "🇸🇲" },
  { code: "VC", name: "Saint-Vincent-et-les-Grenadines", flag: "🇻🇨" },
  { code: "SB", name: "Salomon", flag: "🇸🇧" },
  { code: "SV", name: "Salvador", flag: "🇸🇻" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "ST", name: "Sao Tomé-et-Principe", flag: "🇸🇹" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "RS", name: "Serbie", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapour", flag: "🇸🇬" },
  { code: "SK", name: "Slovaquie", flag: "🇸🇰" },
  { code: "SI", name: "Slovénie", flag: "🇸🇮" },
  { code: "SO", name: "Somalie", flag: "🇸🇴" },
  { code: "SD", name: "Soudan", flag: "🇸🇩" },
  { code: "SS", name: "Soudan du Sud", flag: "🇸🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SE", name: "Suède", flag: "🇸🇪" },
  { code: "CH", name: "Suisse", flag: "🇨🇭" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SY", name: "Syrie", flag: "🇸🇾" },
  { code: "TJ", name: "Tadjikistan", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿" },
  { code: "TD", name: "Tchad", flag: "🇹🇩" },
  { code: "TH", name: "Thaïlande", flag: "🇹🇭" },
  { code: "TL", name: "Timor oriental", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinité-et-Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳" },
  { code: "TM", name: "Turkménistan", flag: "🇹🇲" },
  { code: "TR", name: "Turquie", flag: "🇹🇷" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yémen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambie", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
  { code: "OTHER", name: "Autre pays...", flag: "🌍" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [country, setCountry] = useState(ALL_COUNTRIES.find((c) => c.code === "FR") || ALL_COUNTRIES[0]);
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [city, setCity] = useState("");

  const filteredCountries = ALL_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const [profession, setProfession] = useState("commercant");
  const [professionOther, setProfessionOther] = useState("");

  const [source, setSource] = useState("twitter");
  const [sourceOther, setSourceOther] = useState("");

  const [useCases, setUseCases] = useState<string[]>([
    "packaging_qr",
    "utm_attribution",
  ]);
  const [useCasesOther, setUseCasesOther] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("all");

  const completeOnboardingMutation = useMutation(api.users.completeOnboarding);

  const totalSteps = 4;

  const toggleUseCase = (id: string) => {
    setUseCases((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Step 4 complete -> Submit to Convex DB
    setIsSubmitting(true);
    try {
      if (userId) {
        await completeOnboardingMutation({
          userId,
          country: country.code,
          city: city.trim() || undefined,
          language: "fr",
          profession,
          professionOther: profession === "other_prof" ? professionOther : undefined,
          source,
          sourceOther: source === "other_source" ? sourceOther : undefined,
          useCases,
          useCasesOther: useCases.includes("other_use") ? useCasesOther : undefined,
          // Backwards compatibility with previous Convex server validators
          role: profession || "other",
          goal: (useCases && useCases.length > 0 ? useCases.join(", ") : "general"),
          monthlyClicksEstimate: "10k-100k",
          workspaceName: "Mon Workspace",
        });
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast.success("Espace configuré avec succès !");
      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err) {
      console.error(err);
      showToast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      if (userId) {
        await completeOnboardingMutation({
          userId,
          country: "OTHER",
          city: undefined,
          language: "fr",
          profession: "general",
          source: "direct",
          useCases: ["general"],
          role: "general",
          goal: "general",
          monthlyClicksEstimate: "10k-100k",
          workspaceName: "Mon Workspace",
        });
      }
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-5xl bg-[#121215] border border-[#27272a] rounded-[10px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[590px]">
        
        {/* =========================================================================
            DESKTOP LEFT SIDEBAR: Vertical Stepper de Haut en Bas
            ========================================================================= */}
        <aside className="hidden md:flex w-72 bg-[#0d0d10] border-r border-[#222226] p-6 sm:p-8 flex-col justify-between shrink-0">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-[10px] bg-[#ff6600] flex items-center justify-center font-bebas text-xl text-white font-bold">
                LS
              </div>
              <span className="font-bebas text-2xl text-white tracking-wider">
                L<span className="text-[#ff6600]">SHORTER</span>
              </span>
            </div>

            {/* Vertical Stepper */}
            <div className="flex flex-col relative">
              {/* Step 1 */}
              <div
                onClick={() => setCurrentStep(1)}
                className="cursor-pointer flex items-start gap-4 pb-8 relative group"
              >
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-[#222226]">
                  <div
                    className={`w-full bg-[#ff6600] transition-all duration-300 ${
                      currentStep > 1 ? "h-full" : "h-0"
                    }`}
                  />
                </div>
                <div
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-bold shrink-0 relative z-10 transition-all ${
                    currentStep > 1
                      ? "bg-white text-black shadow-sm"
                      : currentStep === 1
                      ? "bg-[#ff6600] text-white ring-4 ring-[#ff6600]/15 shadow-sm"
                      : "bg-[#1c1c20] text-neutral-400 border border-[#27272a]"
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
                </div>
                <div className="pt-0.5">
                  <div
                    className={`text-xs font-semibold transition-colors ${
                      currentStep >= 1 ? "text-white" : "text-neutral-400"
                    }`}
                  >
                    Origine
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Pays & Localisation
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => setCurrentStep(2)}
                className="cursor-pointer flex items-start gap-4 pb-8 relative group"
              >
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-[#222226]">
                  <div
                    className={`w-full bg-[#ff6600] transition-all duration-300 ${
                      currentStep > 2 ? "h-full" : "h-0"
                    }`}
                  />
                </div>
                <div
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-bold shrink-0 relative z-10 transition-all ${
                    currentStep > 2
                      ? "bg-white text-black shadow-sm"
                      : currentStep === 2
                      ? "bg-[#ff6600] text-white ring-4 ring-[#ff6600]/15 shadow-sm"
                      : "bg-[#1c1c20] text-neutral-400 border border-[#27272a]"
                  }`}
                >
                  {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
                </div>
                <div className="pt-0.5">
                  <div
                    className={`text-xs font-semibold transition-colors ${
                      currentStep >= 2 ? "text-white" : "text-neutral-400"
                    }`}
                  >
                    Profession
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Rôle & Métier
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => setCurrentStep(3)}
                className="cursor-pointer flex items-start gap-4 pb-8 relative group"
              >
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-[#222226]">
                  <div
                    className={`w-full bg-[#ff6600] transition-all duration-300 ${
                      currentStep > 3 ? "h-full" : "h-0"
                    }`}
                  />
                </div>
                <div
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-bold shrink-0 relative z-10 transition-all ${
                    currentStep > 3
                      ? "bg-white text-black shadow-sm"
                      : currentStep === 3
                      ? "bg-[#ff6600] text-white ring-4 ring-[#ff6600]/15 shadow-sm"
                      : "bg-[#1c1c20] text-neutral-400 border border-[#27272a]"
                  }`}
                >
                  {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
                </div>
                <div className="pt-0.5">
                  <div
                    className={`text-xs font-semibold transition-colors ${
                      currentStep >= 3 ? "text-white" : "text-neutral-400"
                    }`}
                  >
                    Découverte
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Comment connu
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div
                onClick={() => setCurrentStep(4)}
                className="cursor-pointer flex items-start gap-4 relative group"
              >
                <div
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-bold shrink-0 relative z-10 transition-all ${
                    currentStep === 4
                      ? "bg-[#ff6600] text-white ring-4 ring-[#ff6600]/15 shadow-sm"
                      : "bg-[#1c1c20] text-neutral-400 border border-[#27272a]"
                  }`}
                >
                  4
                </div>
                <div className="pt-0.5">
                  <div
                    className={`text-xs font-semibold transition-colors ${
                      currentStep === 4 ? "text-white" : "text-neutral-400"
                    }`}
                  >
                    Objectifs & Usage
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Cas d'usage précis
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#222226] text-[11px] text-neutral-500 leading-relaxed">
            Vos informations permettent d'optimiser le routage et de personnaliser votre interface.
          </div>
        </aside>

        {/* =========================================================================
            RIGHT MAIN PANEL: Responsive Desktop & Mobile Form Contents
            ========================================================================= */}
        <main className="flex-1 p-5 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Mobile Header (Cyber Blue + Circular Stepper, No Fake Notch, No Top-Right Badge) */}
            <div className="md:hidden mb-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222226] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[10px] bg-[#0066FF] flex items-center justify-center font-bebas text-base text-white font-bold shadow-md shadow-[#0066FF]/30">
                    LS
                  </div>
                  <span className="font-bebas text-xl text-white tracking-wider">
                    L<span className="text-[#0066FF]">SHORTER</span>
                  </span>
                </div>
              </div>

              {/* Circular Stepper-13 on Mobile */}
              <div className="mb-4 px-1 relative">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-[#222226] -z-0">
                    <div
                      className="h-full bg-[#0066FF] transition-all duration-300"
                      style={{
                        width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  {[
                    { s: 1, label: "Origine" },
                    { s: 2, label: "Métier" },
                    { s: 3, label: "Source" },
                    { s: 4, label: "Usage" },
                  ].map((st) => (
                    <div
                      key={st.s}
                      onClick={() => setCurrentStep(st.s)}
                      className="flex flex-col items-center cursor-pointer relative z-10"
                    >
                      <div
                        className={`w-7 h-7 rounded-[10px] flex items-center justify-center text-[11px] font-bold transition-all ${
                          currentStep > st.s
                            ? "bg-white text-black shadow-sm"
                            : currentStep === st.s
                            ? "bg-[#0066FF] text-white ring-4 ring-[#0066FF]/20 shadow-md"
                            : "bg-[#1c1c20] text-neutral-400 border border-[#27272a]"
                        }`}
                      >
                        {currentStep > st.s ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : st.s}
                      </div>
                      <span
                        className={`text-[10px] font-medium mt-1 ${
                          currentStep === st.s
                            ? "text-[#38bdf8] font-bold"
                            : currentStep > st.s
                            ? "text-white"
                            : "text-neutral-400"
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <span className="text-xs font-mono text-[#ff6600] tracking-wider uppercase font-semibold">
                Étape 0{currentStep} / 04
              </span>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Passer
              </button>
            </div>

            {/* ================= STEP 1: Origine & Localisation ================= */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  D'où venez-vous ?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-5">
                  Précisez votre pays pour optimiser les points de présence Cloudflare Edge de vos liens.
                </p>

                <div className="space-y-4 max-w-lg">
                  {/* Compact Custom Country Dropdown with Search & Scrollbar */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Pays de résidence
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCountryMenuOpen(!isCountryMenuOpen);
                          setCountrySearch("");
                        }}
                        className="w-full h-10 px-3.5 rounded-[10px] bg-[#18181c] border border-[#27272a] hover:border-[#3f3f46] text-xs sm:text-sm text-white flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span> <span>{country.name}</span>
                        </span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isCountryMenuOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isCountryMenuOpen && (
                        <div className="absolute top-11 left-0 right-0 z-50 bg-[#18181c] border border-[#27272a] rounded-[10px] shadow-2xl p-2 flex flex-col gap-1.5">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Rechercher un pays..."
                              autoFocus
                              className="w-full h-8 pl-8 pr-3 rounded-[10px] bg-[#121215] border border-[#27272a] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600] md:focus:border-[#ff6600] focus:border-[#0066FF]"
                            />
                          </div>

                          {/* Scrollable list */}
                          <div className="space-y-0.5 text-xs max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                            {filteredCountries.map((c) => {
                              const isSelected = country.code === c.code;
                              return (
                                <div
                                  key={c.code}
                                  onClick={() => {
                                    setCountry(c);
                                    setIsCountryMenuOpen(false);
                                    setCountrySearch("");
                                  }}
                                  className={`p-2 rounded-[10px] hover:bg-[#222226] text-neutral-300 hover:text-white cursor-pointer flex items-center justify-between transition-colors ${
                                    isSelected ? "bg-[#222226] text-white font-semibold" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{c.flag}</span>
                                    <span>{c.name}</span>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-[#ff6600] md:text-[#ff6600] text-[#0066FF]" />
                                  )}
                                </div>
                              );
                            })}
                            {filteredCountries.length === 0 && (
                              <div className="py-4 text-center text-xs text-neutral-500">
                                Aucun pays trouvé
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Ville principale (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Paris, Montréal, Dakar, Abidjan, Yaoundé, Douala..."
                      className="w-full h-10 px-3.5 rounded-[10px] bg-[#18181c] border border-[#27272a] text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6600] md:focus:border-[#ff6600] focus:border-[#0066FF] transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: Profession & Métier ================= */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  Quelle est votre profession ?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-4">
                  Sélectionnez votre activité principale pour adapter vos raccourcis.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {[
                    {
                      id: "commercant",
                      title: "Commerçant",
                      sub: "Retail, e-commerce, restaurant",
                    },
                    {
                      id: "event",
                      title: "Créateur d'événement",
                      sub: "Salons, billetterie, festivals",
                    },
                    {
                      id: "dev",
                      title: "Développeur / Tech",
                      sub: "API, SDKs, Webhooks",
                    },
                    {
                      id: "marketer",
                      title: "Marketeur / Growth",
                      sub: "Ads, UTM, Attribution",
                    },
                    {
                      id: "creator",
                      title: "Créateur de contenu",
                      sub: "YouTube, TikTok, Bio",
                    },
                    {
                      id: "founder",
                      title: "Fondateur / CEO",
                      sub: "SaaS, Startup, PME",
                    },
                    {
                      id: "sales",
                      title: "Vente & Commercial",
                      sub: "Devis, RDV, vCards",
                    },
                    {
                      id: "public_health",
                      title: "Services Publics",
                      sub: "Démarches, notices, assos",
                    },
                    {
                      id: "other_prof",
                      title: "Autre métier...",
                      sub: "Préciser manuellement",
                    },
                  ].map((p) => {
                    const isSelected = profession === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setProfession(p.id)}
                        className={`p-3 rounded-[10px] cursor-pointer flex flex-col gap-0.5 transition-all ${
                          isSelected
                            ? "border border-[#ff6600] md:border-[#ff6600] border-[#0066FF] bg-[#ff6600]/10 md:bg-[#ff6600]/10 bg-[#0066FF]/10 text-white"
                            : "border border-[#27272a] bg-[#121215] text-neutral-300 hover:border-[#3f3f46]"
                        }`}
                      >
                        <div className="text-xs font-semibold">{p.title}</div>
                        <div className="text-[10px] text-neutral-500">{p.sub}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Textarea if Autre */}
                {profession === "other_prof" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={professionOther}
                      onChange={(e) => setProfessionOther(e.target.value)}
                      placeholder="Précisez votre profession / métier..."
                      className="w-full h-10 px-3.5 rounded-[10px] bg-[#18181c] border border-[#27272a] text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6600] md:focus:border-[#ff6600] focus:border-[#0066FF]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 3: Sources d'acquisition ================= */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  Comment avez-vous connu LShorter ?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-4">
                  Dites-nous par quel canal vous avez découvert notre solution.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {[
                    {
                      id: "twitter",
                      label: "X / Twitter",
                      icon: (
                        <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      ),
                    },
                    {
                      id: "youtube",
                      label: "YouTube",
                      icon: (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#FF0000"
                            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                          />
                        </svg>
                      ),
                    },
                    {
                      id: "tiktok",
                      label: "TikTok",
                      icon: (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.67c0 1.506-1.217 2.727-2.718 2.727-1.5 0-2.717-1.221-2.717-2.727 0-1.505 1.217-2.726 2.717-2.726.31 0 .607.054.885.148V9.582a6.13 6.13 0 0 0-.885-.065C6.012 9.517 3.22 12.316 3.22 15.77c0 3.454 2.792 6.253 6.236 6.253 3.444 0 6.235-2.799 6.235-6.253V8.924a8.214 8.214 0 0 0 4.898 1.602V7.081a4.814 4.814 0 0 1-1-.395z"
                            fill="#FE2C55"
                          />
                          <path
                            d="M18.589 5.686a4.793 4.793 0 0 1-3.77-4.245V1h-3.445v13.67c0 1.506-1.217 2.727-2.718 2.727-1.5 0-2.717-1.221-2.717-2.727 0-1.505 1.217-2.726 2.717-2.726.31 0 .607.054.885.148V8.582a6.13 6.13 0 0 0-.885-.065C5.012 8.517 2.22 11.316 2.22 14.77c0 3.454 2.792 6.253 6.236 6.253 3.444 0 6.235-2.799 6.235-6.253V7.924a8.214 8.214 0 0 0 4.898 1.602V6.081a4.814 4.814 0 0 1-1-.395z"
                            fill="#25F4EE"
                          />
                          <path
                            d="M19.089 6.186a4.793 4.793 0 0 1-3.77-4.245V1.5h-3.445v13.67c0 1.506-1.217 2.727-2.718 2.727-1.5 0-2.717-1.221-2.717-2.727 0-1.505 1.217-2.726 2.717-2.726.31 0 .607.054.885.148V9.082a6.13 6.13 0 0 0-.885-.065C5.512 9.017 2.72 11.816 2.72 15.27c0 3.454 2.792 6.253 6.236 6.253 3.444 0 6.235-2.799 6.235-6.253V8.424a8.214 8.214 0 0 0 4.898 1.602V6.581a4.814 4.814 0 0 1-1-.395z"
                            fill="#FFFFFF"
                          />
                        </svg>
                      ),
                    },
                    {
                      id: "instagram",
                      label: "Instagram",
                      icon: (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                          <defs>
                            <radialGradient id="ig-grad-wzd" cx="20%" cy="100%" r="150%">
                              <stop offset="0%" stopColor="#fdf497" />
                              <stop offset="5%" stopColor="#fdf497" />
                              <stop offset="45%" stopColor="#fd5949" />
                              <stop offset="60%" stopColor="#d6249f" />
                              <stop offset="90%" stopColor="#285AEB" />
                            </radialGradient>
                          </defs>
                          <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad-wzd)" />
                          <circle cx="12" cy="12" r="3.8" stroke="#fff" strokeWidth="1.6" fill="none" />
                          <circle cx="17.5" cy="6.5" r="1.1" fill="#fff" />
                        </svg>
                      ),
                    },
                    {
                      id: "linkedin",
                      label: "LinkedIn",
                      icon: (
                        <svg className="w-4 h-4 fill-[#0A66C2] shrink-0" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      ),
                    },
                    {
                      id: "facebook",
                      label: "Facebook",
                      icon: (
                        <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      ),
                    },
                    {
                      id: "google",
                      label: "Google",
                      icon: (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.3 0-6.1-2.2-7.1-5.3L1.9 16c1.8 3.6 5.5 7 10.1 7z"
                          />
                        </svg>
                      ),
                    },
                    {
                      id: "referral",
                      label: "Recommandation",
                      icon: (
                        <svg className="w-4 h-4 stroke-[#f59e0b] shrink-0" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      ),
                    },
                    {
                      id: "newsletter",
                      label: "Newsletter",
                      icon: (
                        <svg className="w-4 h-4 stroke-[#a855f7] shrink-0" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      ),
                    },
                    {
                      id: "other_source",
                      label: "Autre canal...",
                      icon: (
                        <svg className="w-4 h-4 stroke-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      ),
                    },
                  ].map((s) => {
                    const isSelected = source === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSource(s.id)}
                        className={`p-3 rounded-[10px] cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? "border border-[#ff6600] md:border-[#ff6600] border-[#0066FF] bg-[#ff6600]/10 md:bg-[#ff6600]/10 bg-[#0066FF]/10 text-white"
                            : "border border-[#27272a] bg-[#121215] text-neutral-300 hover:border-[#3f3f46]"
                        }`}
                      >
                        <span className="text-xs font-medium">{s.label}</span>
                        {s.icon}
                      </div>
                    );
                  })}
                </div>

                {/* Textarea if Autre */}
                {source === "other_source" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={sourceOther}
                      onChange={(e) => setSourceOther(e.target.value)}
                      placeholder="Précisez comment vous avez connu LShorter..."
                      className="w-full h-10 px-3.5 rounded-[10px] bg-[#18181c] border border-[#27272a] text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6600] md:focus:border-[#ff6600] focus:border-[#0066FF]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 4: Cas d'usage précis (6 Domaines) ================= */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  Comment comptez-vous utiliser LShorter ?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-3">
                  Sélectionnez vos cas d'usage parmi les domaines métier ci-dessous :
                </p>

                {/* Domain Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs border-b border-[#222226]">
                  {[
                    { id: "all", label: "Tous" },
                    { id: "ecommerce", label: "E-Commerce" },
                    { id: "marketing", label: "Marketing" },
                    { id: "sales", label: "Vente" },
                    { id: "events", label: "Événementiel" },
                    { id: "tech", label: "IT & Dév" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedDomainFilter(tab.id)}
                      className={`px-3 py-1 rounded-[10px] font-medium transition-all cursor-pointer shrink-0 ${
                        selectedDomainFilter === tab.id
                          ? "bg-[#ff6600] md:bg-[#ff6600] bg-[#0066FF] text-white"
                          : "bg-[#18181c] text-neutral-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Use Cases Cards */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {[
                    {
                      id: "packaging_qr",
                      cat: "ecommerce",
                      title: "Packaging, Étiquetage & Menus QR Code",
                      sub: "E-Commerce, notices produits et restaurants",
                    },
                    {
                      id: "utm_attribution",
                      cat: "marketing",
                      title: "Attribution & Suivi UTM (Ads, Influence, Bio Link)",
                      sub: "Marketing digital et redirection intelligente",
                    },
                    {
                      id: "sales_vcard",
                      cat: "sales",
                      title: "Cartes de visite connectées (vCard) & Prise de RDV",
                      sub: "Prospection commerciale et partage de devis",
                    },
                    {
                      id: "events_access",
                      cat: "events",
                      title: "Billetterie, Événements & Accès direct",
                      sub: "Conférences, sondages et contrôle d'accès",
                    },
                    {
                      id: "dev_routing",
                      cat: "tech",
                      title: "Routage dynamique, Deep Linking & Webhooks API",
                      sub: "Développement technique et intégration SDK",
                    },
                    {
                      id: "other_use",
                      cat: "all",
                      title: "Autre cas d'usage sur-mesure...",
                      sub: "Préciser votre besoin spécifique",
                    },
                  ]
                    .filter(
                      (item) =>
                        selectedDomainFilter === "all" ||
                        item.cat === "all" ||
                        item.cat === selectedDomainFilter
                    )
                    .map((item) => {
                      const isChecked = useCases.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleUseCase(item.id)}
                          className={`p-3 rounded-[10px] cursor-pointer flex items-center justify-between transition-all ${
                            isChecked
                              ? "border border-[#ff6600] md:border-[#ff6600] border-[#0066FF] bg-[#ff6600]/10 md:bg-[#ff6600]/10 bg-[#0066FF]/10 text-white"
                              : "border border-[#27272a] bg-[#121215] text-neutral-300 hover:border-[#3f3f46]"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              {item.sub}
                            </div>
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              isChecked
                                ? "text-[#ff6600] md:text-[#ff6600] text-[#0066FF]"
                                : "text-neutral-600"
                            }`}
                          >
                            {isChecked ? "✓" : "+"}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Textarea if Autre */}
                {useCases.includes("other_use") && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={useCasesOther}
                      onChange={(e) => setUseCasesOther(e.target.value)}
                      placeholder="Précisez votre cas d'usage spécifique..."
                      className="w-full h-10 px-3.5 rounded-[10px] bg-[#18181c] border border-[#27272a] text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6600] md:focus:border-[#ff6600] focus:border-[#0066FF]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= BOTTOM ACTIONS ================= */}
          <div className="pt-4 border-t border-[#222226] flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="h-10 px-4 sm:px-5 rounded-[10px] border border-[#27272a] hover:bg-white/5 text-xs font-semibold text-neutral-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="h-10 px-5 sm:px-6 rounded-[10px] bg-[#ff6600] md:bg-[#ff6600] bg-[#0066FF] hover:brightness-110 active:scale-95 text-xs font-bold text-white shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Enregistrement...</span>
              ) : currentStep === totalSteps ? (
                <>
                  <span>Terminer &amp; Enregistrer</span>
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continuer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </main>

      </div>
    </div>
  );
}

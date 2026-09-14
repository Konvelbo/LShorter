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

// Exhaustive list of all countries worldwide in English
const ALL_COUNTRIES = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "AL", name: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", flag: "🇰🇲" },
  { code: "CG", name: "Congo (Brazzaville)", flag: "🇨🇬" },
  { code: "CD", name: "Congo (DRC)", flag: "🇨🇩" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", flag: "🇬🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KP", name: "Korea (North)", flag: "🇰🇵" },
  { code: "KR", name: "Korea (South)", flag: "🇰🇷" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "LY", name: "Libya", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palau", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", flag: "🇵🇸" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", flag: "🇸🇲" },
  { code: "ST", name: "Sao Tome and Principe", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SY", name: "Syria", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
  { code: "OTHER", name: "Other country...", flag: "🌍" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [country, setCountry] = useState(ALL_COUNTRIES.find((c) => c.code === "US") || ALL_COUNTRIES[0]);
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
          language: "en",
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
          workspaceName: "My Workspace",
        });
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast.success("Workspace configured successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err) {
      console.error(err);
      showToast.error("Error saving onboarding details");
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
          language: "en",
          profession: "general",
          source: "direct",
          useCases: ["general"],
          role: "general",
          goal: "general",
          monthlyClicksEstimate: "10k-100k",
          workspaceName: "My Workspace",
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
            DESKTOP LEFT SIDEBAR: Vertical Stepper
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
                    Location
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Country &amp; Location
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
                    Role
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Occupation &amp; Team
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
                    Discovery
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    How you found us
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
                    Goals &amp; Usage
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Specific use cases
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#222226] text-[11px] text-neutral-500 leading-relaxed">
            Your information helps optimize edge routing and personalize your dashboard interface.
          </div>
        </aside>

        {/* =========================================================================
            RIGHT MAIN PANEL: Responsive Desktop & Mobile Form Contents
            ========================================================================= */}
        <main className="flex-1 p-5 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Mobile Header */}
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

              {/* Stepper on Mobile */}
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
                    { s: 1, label: "Origin" },
                    { s: 2, label: "Role" },
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
                Step 0{currentStep} / 04
              </span>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Skip
              </button>
            </div>

            {/* ================= STEP 1: Location ================= */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  Where are you based?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-5">
                  Select your country to optimize Cloudflare Edge points of presence for your links.
                </p>

                <div className="space-y-4 max-w-lg">
                  {/* Compact Custom Country Dropdown with Search & Scrollbar */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Country of residence
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
                              placeholder="Search country..."
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
                                No country found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary City */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Primary City (Optional)
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. New York, London, Paris, Tokyo, Berlin, Toronto..."
                      className="w-full h-10 px-3.5 rounded-[10px] bg-[#18181c] border border-[#27272a] text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6600] md:focus:border-[#ff6600] focus:border-[#0066FF] transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: Role & Occupation ================= */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  What is your primary role?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-4">
                  Select your primary activity to customize your workflow shortcuts.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {[
                    {
                      id: "commercant",
                      title: "Merchant / E-Commerce",
                      sub: "Retail, online store, restaurant",
                    },
                    {
                      id: "event",
                      title: "Event Organizer",
                      sub: "Conferences, ticketing, festivals",
                    },
                    {
                      id: "dev",
                      title: "Developer / Engineer",
                      sub: "APIs, SDKs, Webhooks",
                    },
                    {
                      id: "marketer",
                      title: "Marketer / Growth",
                      sub: "Ads, UTMs, Attribution",
                    },
                    {
                      id: "creator",
                      title: "Content Creator",
                      sub: "YouTube, TikTok, Bio Links",
                    },
                    {
                      id: "founder",
                      title: "Founder / Executive",
                      sub: "SaaS, Startup, Agency",
                    },
                    {
                      id: "sales",
                      title: "Sales & Account Exec",
                      sub: "Quotes, meetings, vCards",
                    },
                    {
                      id: "public_health",
                      title: "Public & Education",
                      sub: "Documents, notices, non-profits",
                    },
                    {
                      id: "other_prof",
                      title: "Other Occupation...",
                      sub: "Specify manually",
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

                {/* Textarea if Other */}
                {profession === "other_prof" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={professionOther}
                      onChange={(e) => setProfessionOther(e.target.value)}
                      placeholder="Specify your occupation / role..."
                      className="w-full h-10 px-3.5 rounded-[10px] bg-[#18181c] border border-[#27272a] text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6600] md:focus:border-[#ff6600] focus:border-[#0066FF]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 3: Acquisition Sources ================= */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  How did you hear about LShorter?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-4">
                  Tell us which channel introduced you to our platform.
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
                      label: "Word of Mouth",
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
                      label: "Other channel...",
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

                {/* Textarea if Other */}
                {source === "other_source" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={sourceOther}
                      onChange={(e) => setSourceOther(e.target.value)}
                      placeholder="Specify how you found LShorter..."
                      className="w-full h-10 px-3.5 rounded-[10px] bg-[#18181c] border border-[#27272a] text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6600] md:focus:border-[#ff6600] focus:border-[#0066FF]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 4: Specific Use Cases ================= */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  How do you plan to use LShorter?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-3">
                  Select your intended use cases from the categories below:
                </p>

                {/* Domain Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs border-b border-[#222226]">
                  {[
                    { id: "all", label: "All" },
                    { id: "ecommerce", label: "E-Commerce" },
                    { id: "marketing", label: "Marketing" },
                    { id: "sales", label: "Sales" },
                    { id: "events", label: "Events" },
                    { id: "tech", label: "IT & Dev" },
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
                      title: "Packaging, Labels & Menu QR Codes",
                      sub: "E-Commerce, product manuals, restaurants",
                    },
                    {
                      id: "utm_attribution",
                      cat: "marketing",
                      title: "Attribution & UTM Tracking (Ads, Influencer, Bio)",
                      sub: "Digital marketing and smart redirection",
                    },
                    {
                      id: "sales_vcard",
                      cat: "sales",
                      title: "Digital Business Cards (vCard) & Booking",
                      sub: "Sales prospecting and quote sharing",
                    },
                    {
                      id: "events_access",
                      cat: "events",
                      title: "Ticketing, Live Events & Direct Access",
                      sub: "Conferences, surveys, access control",
                    },
                    {
                      id: "dev_routing",
                      cat: "tech",
                      title: "Dynamic Routing, Deep Linking & API Webhooks",
                      sub: "Technical development and SDK integration",
                    },
                    {
                      id: "other_use",
                      cat: "all",
                      title: "Custom Bespoke Use Case...",
                      sub: "Specify your custom requirements",
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

                {/* Textarea if Other */}
                {useCases.includes("other_use") && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={useCasesOther}
                      onChange={(e) => setUseCasesOther(e.target.value)}
                      placeholder="Specify your custom requirements..."
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
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="h-10 px-5 sm:px-6 rounded-[10px] bg-[#ff6600] md:bg-[#ff6600] bg-[#0066FF] hover:brightness-110 active:scale-95 text-xs font-bold text-white shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : currentStep === totalSteps ? (
                <>
                  <span>Finish &amp; Launch</span>
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continue</span>
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

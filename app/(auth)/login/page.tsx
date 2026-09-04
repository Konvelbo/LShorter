"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Check,
  Zap,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import confetti from "canvas-confetti";
import { signIn } from "next-auth/react";
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal";

export default function LoginPage({ initialMode = "login" }: { initialMode?: "login" | "register" } = {}) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast.error("Veuillez saisir votre adresse e-mail.");
      return;
    }
    if (!password.trim()) {
      showToast.error("Veuillez saisir votre mot de passe.");
      return;
    }
    if (authMode === "register") {
      if (!confirmPassword.trim()) {
        showToast.error("Veuillez confirmer votre mot de passe.");
        return;
      }
      if (password !== confirmPassword) {
        showToast.error("Les mots de passe ne correspondent pas.");
        return;
      }
      if (password.length < 8) {
        showToast.error("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ");
      const userName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "Mon Compte";

      if (authMode === "register") {
        // Send registration to server route which securely hashes password and saves user
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: userName, email: cleanEmail, password }),
        });

        const json = await res.json();
        if (!res.ok) {
          if (json.error === "EMAIL_ALREADY_EXISTS") {
            showToast.error("Cette adresse email est déjà utilisée. Connectez-vous à la place.");
          } else {
            showToast.error(json.error || "Erreur lors de l'inscription.");
          }
          setIsLoading(false);
          return;
        }
      }

      // Sign in with NextAuth Credentials provider
      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        showToast.error("Email ou mot de passe incorrect.");
        setIsLoading(false);
        return;
      }

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      showToast.success(`Bienvenue sur LShorter, ${userName} !`);

      // For new registrations redirect to onboarding, else to dashboard
      if (authMode === "register") {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Auth error:", error);
      showToast.error("Une erreur est survenue lors de l'authentification. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  // Check URL parameters for OAuth errors and listen for authentication completion from the popup/new tab
  useEffect(() => {
    // Check if redirected with OAuth error in query params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "Configuration") {
          showToast.error(
            "Configuration OAuth incomplète : GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants dans Vercel."
          );
        } else if (err === "OAuthCallbackError" || err === "OAuthCallback") {
          showToast.error(
            "Erreur de callback OAuth : Vérifiez l'URI de redirection https://lsho.cc/api/auth/callback/google."
          );
        } else if (err === "AccessDenied") {
          showToast.error("Accès refusé par le fournisseur de connexion.");
        } else {
          showToast.error(`Erreur d'authentification : ${err}`);
        }
      }
    }

    let hasRedirected = false;

    const handleAuthSuccess = () => {
      if (hasRedirected) return;
      hasRedirected = true;
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      showToast.success("Connexion réussie !");
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    };

    // 1. Popup postMessage listener
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "LSHORTER_AUTH_SUCCESS") {
        handleAuthSuccess();
      }
    };
    window.addEventListener("message", onMessage);

    // 2. BroadcastChannel across tabs
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("lshorter_auth");
        channel.onmessage = (event) => {
          if (event.data === "AUTH_SUCCESS") {
            handleAuthSuccess();
          }
        };
      }
    } catch {
      // Ignore
    }

    // 3. Storage event fallback
    const onStorage = (event: StorageEvent) => {
      if (event.key === "lshorter_auth_event") {
        handleAuthSuccess();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
      if (channel) channel.close();
    };
  }, [router]);

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("OAuth Sign-in error:", error);
      showToast.error(
        `Erreur OAuth ${provider === "google" ? "Google" : "GitHub"}. Vérifiez votre configuration.`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff6600]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Centered Authentication Card */}
      <div className="w-full max-w-md flex flex-col gap-6 z-10 my-auto">
        {/* Brand Logo with LS Badge */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-3 group select-none">
            <div className="w-10 h-10 rounded-[10px] bg-[#ff6600] flex items-center justify-center shadow-lg shadow-[#ff6600]/30 font-bebas text-2xl text-white font-bold tracking-wider group-hover:scale-105 transition-transform">
              LS
            </div>
            <span className="font-bebas text-3xl text-white tracking-wider flex items-center gap-1">
              L<span className="text-[#ff6600]">SHORTER</span>
            </span>
          </Link>
        </div>
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#141416] border border-[#27272a] rounded-[10px] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`py-2.5 rounded-[8px] transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-[#ff6600] text-white shadow-md font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={`py-2.5 rounded-[8px] transition-all cursor-pointer ${
                authMode === "register"
                  ? "bg-[#ff6600] text-white shadow-md font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="font-bebas text-3xl text-white tracking-wide flex items-center gap-2">
              {authMode === "login" ? "BON RETOUR 👋" : "CRÉER UN COMPTE 🚀"}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {authMode === "login"
                ? "Connectez-vous à votre espace SaaS LShorter"
                : "Commencez gratuitement avec 100 000 clics/mois inclus"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {authMode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Votre nom
                </label>
                <Input
                  required
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Adresse email
              </label>
              <Input
                type="email"
                required
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-neutral-400 hover:text-white" />
                  ) : (
                    <Eye className="w-4 h-4 text-neutral-400 hover:text-white" />
                  )}
                </button>
              </div>
              {authMode === "login" && (
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] text-[#ff6600] hover:underline font-medium cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}
            </div>

            {authMode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                    title={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-neutral-400 hover:text-white" />
                    ) : (
                      <Eye className="w-4 h-4 text-neutral-400 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="glow"
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold tracking-wide mt-2 cursor-pointer"
            >
              {isLoading
                ? "Connexion en cours..."
                : authMode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-[#27272a]" />
            <span className="text-[11px] text-neutral-500 font-medium">ou continuer avec</span>
            <div className="flex-1 h-px bg-[#27272a]" />
          </div>

          {/* Google & GitHub Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => handleOAuthLogin("google")}
              type="button"
              className="w-full h-11 rounded-[10px] bg-[#141416] hover:bg-[#1f1f23] border border-[#27272a] flex items-center justify-center gap-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continuer avec Google</span>
            </button>

            <button
              onClick={() => handleOAuthLogin("github")}
              type="button"
              className="w-full h-11 rounded-[10px] bg-[#141416] hover:bg-[#1f1f23] border border-[#27272a] flex items-center justify-center gap-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continuer avec GitHub</span>
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
            En vous connectant, vous acceptez nos{" "}
            <a href="#" className="text-neutral-400 hover:underline">
              Conditions d&apos;utilisation
            </a>{" "}
            et notre{" "}
            <a href="#" className="text-neutral-400 hover:underline">
              Politique de confidentialité
            </a>
            .
          </p>
        </div>

        {/* Forgot Password Modal (Resend PIN) */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          initialEmail={email}
        />
      </div>
  );
}


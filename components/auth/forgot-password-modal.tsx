"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import confetti from "canvas-confetti";
import {
  sendPasswordResetPinAction,
  verifyResetPinAction,
  resetPasswordWithPinAction,
} from "@/app/actions/password-reset";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "pin" | "password">("email");
  const [email, setEmail] = useState(initialEmail);
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const pinInputRef = useRef<HTMLInputElement>(null);

  // Sync initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialEmail) setEmail(initialEmail);
      setStep("email");
      setPin("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, initialEmail]);

  // Resend PIN countdown timer (60s cooldown)
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus PIN input on step 2
  useEffect(() => {
    if (step === "pin") {
      setTimeout(() => pinInputRef.current?.focus(), 150);
    }
  }, [step]);

  if (!isOpen) return null;

  // Calculate password strength (0-100%)
  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.length >= 12) score += 15;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;
    return Math.min(100, score);
  };

  const passwordStrength = calculateStrength(newPassword);

  // 1. Send PIN Email
  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showToast.error("Veuillez saisir votre adresse e-mail.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendPasswordResetPinAction({ email: cleanEmail });
      if (res.success) {
        showToast.success(
          res.isDevFallback
            ? "Code PIN généré (mode test activé) !"
            : "Code PIN envoyé par e-mail avec succès !"
        );
        setStep("pin");
        setCountdown(60); // 60s cooldown
      } else {
        showToast.error(res.message || "Erreur lors de l'envoi du code.");
      }
    } catch (err: any) {
      showToast.error("Une erreur est survenue lors de l'envoi du code.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify PIN
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (cleanPin.length !== 6) {
      showToast.error("Le code PIN doit comporter 6 chiffres.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyResetPinAction({
        email: email.trim().toLowerCase(),
        pin: cleanPin,
      });

      if (res.valid) {
        showToast.success("Code PIN validé avec succès !");
        setStep("password");
      } else {
        showToast.error(res.message || "Code PIN invalide ou expiré.");
      }
    } catch {
      showToast.error("Erreur lors de la vérification du code.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithPinAction({
        email: email.trim().toLowerCase(),
        pin: pin.trim(),
        newPassword,
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        showToast.success("Mot de passe réinitialisé ! Vous pouvez vous connecter.");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast.error(res.message || "Erreur lors de la réinitialisation.");
      }
    } catch {
      showToast.error("Erreur inattendue lors de la mise à jour.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-[16px] bg-[#141416] border border-[#27272a] p-6 sm:p-8 shadow-2xl text-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`h-1.5 flex-1 rounded-full transition-all ${
              step === "email" ? "bg-[#ff6600]" : "bg-[#ff6600]/40"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-all ${
              step === "pin" ? "bg-[#ff6600]" : step === "password" ? "bg-[#ff6600]/40" : "bg-[#27272a]"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-all ${
              step === "password" ? "bg-[#ff6600]" : "bg-[#27272a]"
            }`}
          />
        </div>

        {/* STEP 1: Enter Email */}
        {step === "email" && (
          <form onSubmit={handleSendPin} className="flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bebas text-2xl text-white tracking-wide">
                  MOT DE PASSE OUBLIÉ ?
                </h3>
                <p className="text-xs text-neutral-400">
                  Recevez un code de sécurité à 6 chiffres par e-mail.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Adresse e-mail du compte
              </label>
              <Input
                type="email"
                required
                placeholder="votre-email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="glow"
              disabled={isLoading || !email.trim()}
              className="w-full h-11 text-xs font-bold uppercase tracking-wider gap-2 mt-2"
            >
              {isLoading ? "Envoi du code..." : "Envoyer le Code PIN"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* STEP 2: Enter 6-digit PIN */}
        {step === "pin" && (
          <form onSubmit={handleVerifyPin} className="flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bebas text-2xl text-white tracking-wide">
                  CODE DE VÉRIFICATION
                </h3>
                <p className="text-xs text-neutral-400">
                  Code envoyé à <span className="text-white font-medium">{email}</span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 text-center">
                Saisissez le code PIN à 6 chiffres
              </label>
              <input
                ref={pinInputRef}
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                required
                placeholder="123456"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full h-14 rounded-[12px] bg-[#1a1a1e] border-2 border-[#27272a] focus:border-[#ff6600] text-center font-mono text-3xl font-bold tracking-[0.6em] text-white focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-neutral-500 text-center mt-2">
                ⏱️ Ce code expire dans 15 minutes.
              </p>
            </div>

            <Button
              type="submit"
              variant="glow"
              disabled={isLoading || pin.length !== 6}
              className="w-full h-11 text-xs font-bold uppercase tracking-wider gap-2 mt-1"
            >
              {isLoading ? "Vérification..." : "Valider le Code"}
              <CheckCircle2 className="w-4 h-4" />
            </Button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Changer d&apos;email
              </button>

              <button
                type="button"
                disabled={countdown > 0 || isLoading}
                onClick={handleSendPin}
                className="text-[#ff6600] hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                {countdown > 0 ? `Renvoyer (${countdown}s)` : "Renvoyer le code"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter New Password */}
        {step === "password" && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-[10px] bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bebas text-2xl text-white tracking-wide">
                  NOUVEAU MOT DE PASSE
                </h3>
                <p className="text-xs text-neutral-400">
                  Définissez votre nouveau mot de passe sécurisé.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 8 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {newPassword && (
                <div className="flex flex-col gap-1 mt-2 text-[11px]">
                  <div className="flex justify-between text-neutral-400">
                    <span>Force</span>
                    <span className="text-white font-bold">{passwordStrength}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength < 50
                          ? "bg-amber-500"
                          : passwordStrength < 80
                          ? "bg-sky-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Retapez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="glow"
              disabled={isLoading || !newPassword || newPassword !== confirmPassword}
              className="w-full h-11 text-xs font-bold uppercase tracking-wider gap-2 mt-2"
            >
              {isLoading ? "Enregistrement..." : "Enregistrer et Se Connecter"}
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

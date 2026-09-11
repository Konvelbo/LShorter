"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import confetti from "canvas-confetti";

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  email: string;
  name?: string;
  onSuccess: (secret: string, recoveryCodes: string[]) => Promise<void>;
}

export function TwoFactorSetupModal({
  isOpen,
  onClose,
  userId,
  email,
  name,
  onSuccess,
}: TwoFactorSetupModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secret, setSecret] = useState("");
  const [formattedSecret, setFormattedSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSecretCopied, setIsSecretCopied] = useState(false);
  const [areCodesCopied, setAreCodesCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize generation when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setVerificationCode("");
      setErrorMessage("");
      setIsSecretCopied(false);
      setAreCodesCopied(false);
      generate2FACredentials();
    }
  }, [isOpen, email, name]);

  const generate2FACredentials = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          email: email || "user@lshorter.io",
          name: name || "LShorter User",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSecret(data.secret);
        setFormattedSecret(data.formattedSecret);
        setQrCodeUrl(data.qrCode);
        setRecoveryCodes(data.recoveryCodes);
      } else {
        setErrorMessage(data.error || "Impossible de générer le QR code 2FA.");
      }
    } catch {
      setErrorMessage("Erreur de connexion lors de la génération 2FA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setIsSecretCopied(true);
    showToast.success("Clé secrète copiée !");
    setTimeout(() => setIsSecretCopied(false), 2000);
  };

  const handleCopyRecoveryCodes = () => {
    if (!recoveryCodes.length) return;
    const text = [
      "================================================",
      "CODES DE SECOURS DOUBLE AUTHENTIFICATION LSHORTER",
      `Compte : ${email}`,
      `Généré le : ${new Date().toLocaleDateString("fr-FR")}`,
      "Chaque code ne peut être utilisé qu'une seule fois.",
      "================================================",
      "",
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
      "",
      "Conservez ces codes dans un endroit sûr et chiffré.",
    ].join("\n");

    navigator.clipboard.writeText(text);
    setAreCodesCopied(true);
    showToast.success("Codes de secours copiés dans le presse-papier !");
    setTimeout(() => setAreCodesCopied(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes.length) return;
    const text = [
      "================================================",
      "CODES DE SECOURS DOUBLE AUTHENTIFICATION LSHORTER",
      `Compte : ${email}`,
      `Date : ${new Date().toISOString()}`,
      "Chaque code ne peut être utilisé qu'une seule fois.",
      "================================================",
      "",
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lshorter-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast.success("Fichier des codes de secours téléchargé !");
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = verificationCode.trim().replace(/\s+/g, "");

    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMessage("Veuillez entrer le code complet à 6 chiffres.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          secret,
          code: cleanCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.valid) {
        // Code is mathematically verified against the Base32 secret!
        await onSuccess(secret, recoveryCodes);
        setStep(3);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        showToast.success("Code vérifié ! Enregistrez vos codes de secours.");
      } else {
        setErrorMessage("Code invalide ou expiré. Vérifiez l'heure de votre appareil et réessayez.");
      }
    } catch {
      setErrorMessage("Erreur de communication lors de la vérification.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-[14px] bg-[#121215] border border-[#27272a] shadow-2xl flex flex-col overflow-hidden text-neutral-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#222225] flex items-center justify-between bg-gradient-to-r from-[#141418] to-[#1a1a20]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#ff6600]/20 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Double Authentification (2FA / TOTP)</span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                {step === 1 && "Étape 1 sur 3 : Scanner le QR Code standard"}
                {step === 2 && "Étape 2 sur 3 : Vérifier le code à 6 chiffres"}
                {step === 3 && "Étape 3 sur 3 : Codes de secours d'urgence"}
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5 bg-[#09090b] px-2.5 py-1.5 rounded-full border border-[#27272a]">
            <div className={`w-2 h-2 rounded-full ${step >= 1 ? "bg-[#ff6600]" : "bg-neutral-600"}`} />
            <div className={`w-2 h-2 rounded-full ${step >= 2 ? "bg-[#ff6600]" : "bg-neutral-600"}`} />
            <div className={`w-2 h-2 rounded-full ${step === 3 ? "bg-emerald-500" : "bg-neutral-600"}`} />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-[8px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Scan QR Code */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-1">
                <p className="text-xs text-neutral-300">
                  Scannez ce QR Code avec votre application d&apos;authentification préférée :
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 text-[10px] text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-[#1c1c22] border border-[#2a2a32]">Google Authenticator</span>
                  <span className="px-2 py-0.5 rounded bg-[#1c1c22] border border-[#2a2a32]">Apple Mots de passe</span>
                  <span className="px-2 py-0.5 rounded bg-[#1c1c22] border border-[#2a2a32]">Microsoft Authenticator</span>
                  <span className="px-2 py-0.5 rounded bg-[#1c1c22] border border-[#2a2a32]">Authy / 1Password</span>
                </div>
              </div>

              {/* QR Code Canvas Frame */}
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-[12px] shadow-xl border-4 border-[#27272a] relative">
                  {isLoading ? (
                    <div className="w-48 h-48 flex flex-col items-center justify-center gap-2 text-neutral-800">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff6600]" />
                      <span className="text-[11px] font-medium font-mono">Génération du QR...</span>
                    </div>
                  ) : qrCodeUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={qrCodeUrl}
                      alt="Standard TOTP QR Code"
                      className="w-48 h-48 object-contain rounded-[4px]"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-neutral-500 text-xs">
                      Erreur de chargement
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Entry Secret Key */}
              <div className="flex flex-col gap-1.5 p-3 rounded-[10px] bg-[#0c0c0e] border border-[#222226]">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Vous ne pouvez pas scanner ? Clé de saisie manuelle :</span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="text-[#ff6600] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isSecretCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isSecretCopied ? "Copié" : "Copier"}</span>
                  </button>
                </div>
                <div className="font-mono text-xs font-bold text-white tracking-widest text-center py-1 select-all bg-[#141418] rounded-[6px] border border-[#1f1f25]">
                  {formattedSecret || "CHARGEMENT..."}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-xs h-10 px-4 border-[#27272a]"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="glow"
                  disabled={isLoading || !secret}
                  onClick={() => {
                    setErrorMessage("");
                    setStep(2);
                  }}
                  className="text-xs h-10 px-5 font-bold gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Suivant : Vérifier le code</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Verify Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] mb-1">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Saisissez le code de validation</h3>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Entrez le code temporaire à 6 chiffres affiché en ce moment dans votre application pour confirmer la liaison.
                </p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Input
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="000 000"
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerificationCode(val);
                    if (errorMessage) setErrorMessage("");
                  }}
                  className="h-14 w-56 text-center font-mono text-2xl tracking-[0.4em] bg-[#0c0c0e] border-[#27272a] focus:border-[#ff6600] text-white font-bold rounded-[10px]"
                />
                <span className="text-[11px] text-neutral-500">Le code change toutes les 30 secondes</span>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setErrorMessage("");
                    setStep(1);
                  }}
                  className="text-xs h-10 px-4 border-[#27272a] gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour au QR</span>
                </Button>
                <Button
                  type="submit"
                  variant="glow"
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="text-xs h-10 px-6 font-bold gap-1.5 cursor-pointer shadow-md"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Vérification...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Vérifier &amp; Activer</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Emergency Recovery Codes */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-[10px] bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-400">Double Authentification Activée avec Succès !</h4>
                  <p className="text-[11px] text-neutral-300">
                    Votre compte est désormais sécurisé selon les normes RFC 6238.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[10px] bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Sauvegardez vos codes de secours d&apos;urgence</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Si vous perdez votre téléphone ou changez d&apos;appareil, ces codes à usage unique sont le <strong>seul moyen</strong> de récupérer l&apos;accès à votre compte.
                </p>
              </div>

              {/* 8 Recovery Codes Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-[10px] bg-[#0c0c0e] border border-[#222226]">
                {recoveryCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-[6px] bg-[#141418] border border-[#1f1f25] text-center font-mono text-xs font-bold text-white select-all"
                  >
                    <span className="text-[10px] text-neutral-500 mr-1.5">{idx + 1}.</span>
                    {code}
                  </div>
                ))}
              </div>

              {/* Copy & Download Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyRecoveryCodes}
                  className="text-xs h-9 border-[#27272a] gap-1.5"
                >
                  {areCodesCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{areCodesCopied ? "Copié !" : "Copier les 8 codes"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadRecoveryCodes}
                  className="text-xs h-9 border-[#27272a] gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#ff6600]" />
                  <span>Télécharger (.txt)</span>
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="glow"
                  onClick={onClose}
                  className="w-full text-xs h-10 font-bold cursor-pointer"
                >
                  J&apos;ai bien sauvegardé mes codes &bull; Terminer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

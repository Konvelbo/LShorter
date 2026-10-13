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
          email: email || "user@lsho.cc",
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
        setErrorMessage(data.error || "Unable to generate 2FA QR code.");
      }
    } catch {
      setErrorMessage("Connection error during 2FA generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setIsSecretCopied(true);
    showToast.success("Secret key copied!");
    setTimeout(() => setIsSecretCopied(false), 2000);
  };

  const handleCopyRecoveryCodes = () => {
    if (!recoveryCodes.length) return;
    const text = [
      "================================================",
      "LSHORTER TWO-FACTOR AUTHENTICATION BACKUP CODES",
      `Account: ${email}`,
      `Generated on: ${new Date().toLocaleDateString("en-US")}`,
      "Each code can only be used once.",
      "================================================",
      "",
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
      "",
      "Keep these codes in a safe, encrypted place.",
    ].join("\n");

    navigator.clipboard.writeText(text);
    setAreCodesCopied(true);
    showToast.success("Backup codes copied to clipboard!");
    setTimeout(() => setAreCodesCopied(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes.length) return;
    const text = [
      "================================================",
      "LSHORTER TWO-FACTOR AUTHENTICATION BACKUP CODES",
      `Account: ${email}`,
      `Date: ${new Date().toISOString()}`,
      "Each code can only be used once.",
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
    showToast.success("Backup codes file downloaded!");
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = verificationCode.trim().replace(/\s+/g, "");

    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMessage("Please enter the complete 6-digit code.");
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
        showToast.success("Code verified! Save your backup codes.");
      } else {
        setErrorMessage("Invalid or expired code. Check your device clock and try again.");
      }
    } catch {
      setErrorMessage("Communication error during verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-[10px] bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-neutral-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-[#222225] flex items-center justify-between bg-zinc-50 dark:bg-gradient-to-r dark:from-[#141418] dark:to-[#1a1a20]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-brand-subtle border border-brand-subtle flex items-center justify-center text-brand shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Two-Factor Authentication (2FA / TOTP)</span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-neutral-400">
                {step === 1 && "Step 1 of 3: Scan the standard QR Code"}
                {step === 2 && "Step 2 of 3: Verify the 6-digit code"}
                {step === 3 && "Step 3 of 3: Emergency backup codes"}
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#09090b] px-2.5 py-1.5 rounded-full border border-zinc-200 dark:border-[#27272a]">
            <div className={`w-2 h-2 rounded-full ${step >= 1 ? "bg-brand" : "bg-neutral-400 dark:bg-neutral-600"}`} />
            <div className={`w-2 h-2 rounded-full ${step >= 2 ? "bg-brand" : "bg-neutral-400 dark:bg-neutral-600"}`} />
            <div className={`w-2 h-2 rounded-full ${step === 3 ? "bg-emerald-500" : "bg-neutral-400 dark:bg-neutral-600"}`} />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-[8px] bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Scan QR Code */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-1">
                <p className="text-xs text-zinc-600 dark:text-neutral-300">
                  Scan this QR Code with your preferred authenticator app:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 text-[10px] text-zinc-500 dark:text-neutral-400">
                  <span className="px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-[#1c1c22] border border-zinc-200 dark:border-[#2a2a32]">Google Authenticator</span>
                  <span className="px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-[#1c1c22] border border-zinc-200 dark:border-[#2a2a32]">Apple Passwords</span>
                  <span className="px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-[#1c1c22] border border-zinc-200 dark:border-[#2a2a32]">Microsoft Authenticator</span>
                  <span className="px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-[#1c1c22] border border-zinc-200 dark:border-[#2a2a32]">Authy / 1Password</span>
                </div>
              </div>

              {/* QR Code Canvas Frame */}
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-[10px] shadow-md border-2 border-zinc-200 dark:border-[#27272a] relative">
                  {isLoading ? (
                    <div className="w-48 h-48 flex flex-col items-center justify-center gap-2 text-neutral-800">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand" />
                      <span className="text-[11px] font-medium font-mono">Generating QR...</span>
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
                      Failed to load
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Entry Secret Key */}
              <div className="flex flex-col gap-1.5 p-3 rounded-[10px] bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#222226]">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-neutral-400">
                  <span>Can&apos;t scan? Manual entry secret key:</span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="text-brand hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isSecretCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{isSecretCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-mono text-xs font-bold text-zinc-900 dark:text-white tracking-widest text-center py-1 select-all bg-white dark:bg-[#141418] rounded-[6px] border border-zinc-200 dark:border-[#1f1f25]">
                  {formattedSecret || "LOADING..."}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-xs h-10 px-4 border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-200 rounded-[10px]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isLoading || !secret}
                  onClick={() => {
                    setErrorMessage("");
                    setStep(2);
                  }}
                  className="text-xs h-10 px-5 font-bold gap-1.5 cursor-pointer shadow-md bg-[#0066FF] hover:bg-[#0055d4] text-white rounded-[10px]"
                >
                  <span>Next: Verify Code</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Verify Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-brand-subtle border border-brand-subtle flex items-center justify-center text-brand mb-1">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Enter verification code</h3>
                <p className="text-xs text-zinc-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                  Enter the temporary 6-digit code currently displayed in your app to confirm setup.
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
                  className="h-14 w-56 text-center font-mono text-2xl tracking-[0.4em] bg-zinc-50 dark:bg-[#0c0c0e] border-zinc-200 dark:border-[#27272a] focus:border-[#0066FF] text-zinc-900 dark:text-white font-bold rounded-[10px]"
                />
                <span className="text-[11px] text-zinc-400 dark:text-neutral-500">The code changes every 30 seconds</span>
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
                  className="text-xs h-10 px-4 border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-200 gap-1 rounded-[10px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to QR</span>
                </Button>
                <Button
                  type="submit"
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="text-xs h-10 px-6 font-bold gap-1.5 cursor-pointer shadow-md bg-[#0066FF] hover:bg-[#0055d4] text-white rounded-[10px]"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify &amp; Enable</span>
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
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Two-Factor Authentication Enabled Successfully!</h4>
                  <p className="text-[11px] text-zinc-600 dark:text-neutral-300">
                    Your account is now secured following RFC 6238 standards.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[10px] bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Save your emergency backup codes</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-neutral-300 leading-relaxed">
                  If you lose your phone or switch devices, these one-time codes are the <strong>only way</strong> to recover access to your account.
                </p>
              </div>

              {/* 8 Recovery Codes Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-[10px] bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#222226]">
                {recoveryCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-[6px] bg-white dark:bg-[#141418] border border-zinc-200 dark:border-[#1f1f25] text-center font-mono text-xs font-bold text-zinc-900 dark:text-white select-all shadow-2xs"
                  >
                    <span className="text-[10px] text-zinc-400 dark:text-neutral-500 mr-1.5">{idx + 1}.</span>
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
                  className="text-xs h-9 border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-200 gap-1.5 rounded-[8px]"
                >
                  {areCodesCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{areCodesCopied ? "Copied!" : "Copy 8 codes"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadRecoveryCodes}
                  className="text-xs h-9 border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-200 gap-1.5 rounded-[8px]"
                >
                  <Download className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Download (.txt)</span>
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={onClose}
                  className="w-full text-xs h-10 font-bold cursor-pointer bg-[#0066FF] hover:bg-[#0055d4] text-white rounded-[10px]"
                >
                  I have saved my codes &bull; Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

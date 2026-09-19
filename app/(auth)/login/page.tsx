"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Loader2,
  KeyRound,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import confetti from "canvas-confetti";
import { signIn } from "next-auth/react";
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal";
import { cn } from "@/lib/utils";
import {
  sendSignupPinAction,
  completeSignupWithPinAction,
} from "@/app/actions/signup-verification";

export default function LoginPage({
  initialMode = "login",
}: {
  initialMode?: "login" | "register";
} = {}) {
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // ─── Signup PIN Email Verification State ─────────────────────────────────────
  const [showSignupPIN, setShowSignupPIN] = useState(false);
  const [signupPin, setSignupPin] = useState("");
  const [signupToken, setSignupToken] = useState<string>("");
  const [signupCountdown, setSignupCountdown] = useState(0);
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinDigitChange = (index: number, value: string) => {
    const cleanChar = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = cleanChar;
    setPinDigits(newDigits);
    setSignupPin(newDigits.join(""));

    if (cleanChar && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!pinDigits[index] && index > 0) {
        pinInputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...pinDigits];
        newDigits[index] = "";
        setPinDigits(newDigits);
        setSignupPin(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      pinInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);
    setSignupPin(pasted);
    const targetIdx = Math.min(pasted.length, 5);
    pinInputRefs.current[targetIdx]?.focus();
  };

  // Sync mode with URL parameter if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode") || params.get("tab");
      if (modeParam === "register" || modeParam === "signup") {
        setAuthMode("register");
      } else if (modeParam === "login" || modeParam === "signin") {
        setAuthMode("login");
      }
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (signupCountdown > 0) {
      const timer = setTimeout(() => setSignupCountdown(signupCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [signupCountdown]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("lshorter_theme") as "dark" | "light" | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(savedTheme);
      } else if (document.documentElement.classList.contains("light")) {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("lshorter_theme", nextTheme);
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(nextTheme);
      window.dispatchEvent(new CustomEvent("lshorter_theme_changed", { detail: nextTheme }));
    }
  };

  // ─── 2FA Login Challenge State (for existing accounts with 2FA) ─────────────
  const [show2FAChallenge, setShow2FAChallenge] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast.error("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      showToast.error("Please enter your password.");
      return;
    }

    // ── Registration Flow: Send 6-Digit PIN Code ───────────────────────────
    if (authMode === "register") {
      if (!name.trim()) {
        showToast.error("Please enter your name.");
        return;
      }
      if (!confirmPassword.trim()) {
        showToast.error("Please confirm your password.");
        return;
      }
      if (password !== confirmPassword) {
        showToast.error("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        showToast.error("Password must be at least 8 characters long.");
        return;
      }

      setIsLoading(true);
      try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanName =
          name.trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ");
        const userName =
          cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "My Account";

        let res: { success: boolean; message: string; isDevFallback?: boolean; email?: string; token?: string };

        try {
          const apiRes = await fetch("/api/auth/signup-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "send",
              name: userName,
              email: cleanEmail,
              password,
            }),
          });
          res = await apiRes.json();
        } catch {
          res = await sendSignupPinAction({
            name: userName,
            email: cleanEmail,
            password,
          });
        }

        if (res?.token) {
          setSignupToken(res.token);
        }

        if (!res?.success) {
          showToast.error(res?.message || "Registration failed.");
          setIsLoading(false);
          return;
        }

        setShowSignupPIN(true);
        setSignupCountdown(60);
        showToast.success(
          "A 6-digit validation PIN has been sent to your email!"
        );
        setIsLoading(false);
        return;
      } catch (err: any) {
        console.error("Registration error:", err);
        showToast.error(err?.message || "Error sending confirmation code.");
        setIsLoading(false);
        return;
      }
    }

    // ── Login Flow ─────────────────────────────────────────────────────────
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName =
        name.trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ");
      const userName =
        cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "My Account";

      // Sign in with NextAuth Credentials provider
      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        twoFactorCode: show2FAChallenge ? twoFactorCode.trim() : undefined,
        redirect: false,
      });

      if (result?.error) {
        // Handle 2FA required or invalid 2FA code
        if (
          result.error.includes("2FA_REQUIRED") ||
          result.code === "2FA_REQUIRED"
        ) {
          setShow2FAChallenge(true);
          setIsLoading(false);
          showToast.info("Two-factor authentication required for this account.");
          return;
        }
        if (
          result.error.includes("2FA_INVALID_CODE") ||
          result.code === "2FA_INVALID_CODE"
        ) {
          showToast.error(
            "Invalid or expired 2FA code. Please check your authenticator app or backup code.",
          );
          setIsLoading(false);
          return;
        }

        // If not in 2FA mode yet, check if the account requires 2FA before displaying bad password
        if (!show2FAChallenge) {
          try {
            const checkRes = await fetch("/api/auth/2fa/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "check-email",
                email: cleanEmail,
              }),
            });
            const checkData = await checkRes.json();
            if (checkData?.twoFactorEnabled) {
              setShow2FAChallenge(true);
              setIsLoading(false);
              showToast.info("Please enter your 6-digit code to continue.");
              return;
            }
          } catch {}
        }

        showToast.error("Invalid email or password.");
        setIsLoading(false);
        return;
      }

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      showToast.success(`Welcome to LShorter, ${userName}!`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Auth error:", error);
      showToast.error(
        "An error occurred during authentication. Please try again.",
      );
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify 6-digit PIN and activate account ──────────────────────
  const handleVerifySignupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = signupPin.trim();
    if (cleanPin.length !== 6) {
      showToast.error("Please enter the complete 6-digit PIN code.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      let res: { success: boolean; message: string; userId?: string };

      try {
        const apiRes = await fetch("/api/auth/signup-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            email: cleanEmail,
            pin: cleanPin,
            token: signupToken,
          }),
        });
        res = await apiRes.json();
      } catch {
        res = await completeSignupWithPinAction({
          email: cleanEmail,
          pin: cleanPin,
          token: signupToken,
        });
      }

      if (!res?.success) {
        showToast.error(res?.message || "Invalid or expired PIN code.");
        setIsLoading(false);
        return;
      }

      showToast.success("Account successfully verified and activated!");

      // Sign in automatically
      const signinRes = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (signinRes?.error) {
        showToast.success("Account verified! Please sign in with your credentials.");
        setShowSignupPIN(false);
        setAuthMode("login");
        setIsLoading(false);
        return;
      }

      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      router.push("/onboarding");
    } catch (err: any) {
      console.error("Signup validation error:", err);
      showToast.error(err?.message || "Error activating account.");
      setIsLoading(false);
    }
  };

  // ── Resend Signup PIN Code ───────────────────────────────────────────────
  const handleResendSignupPin = async () => {
    if (signupCountdown > 0) return;
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName =
        name.trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ");
      const userName =
        cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "My Account";

      let res: { success: boolean; message?: string; token?: string };
      try {
        const apiRes = await fetch("/api/auth/signup-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            name: userName,
            email: cleanEmail,
            password,
          }),
        });
        res = await apiRes.json();
      } catch {
        res = await sendSignupPinAction({
          name: userName,
          email: cleanEmail,
          password,
        });
      }

      if (res?.token) {
        setSignupToken(res.token);
      }

      if (res?.success) {
        setSignupCountdown(60);
        showToast.success("New PIN code sent to your email!");
      } else {
        showToast.error(res?.message || "Error resending code.");
      }
    } catch {
      showToast.error("Error resending code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check URL parameters for OAuth errors and listen for authentication completion from popup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "Configuration") {
          showToast.error(
            "Incomplete OAuth configuration: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing.",
          );
        } else if (err === "OAuthCallbackError" || err === "OAuthCallback") {
          showToast.error(
            "OAuth callback error: Please verify the redirect URI.",
          );
        } else if (err === "AccessDenied") {
          showToast.error("Access denied by authentication provider.");
        } else {
          showToast.error(`Authentication error: ${err}`);
        }
      }
    }

    let hasRedirected = false;

    const handleAuthSuccess = () => {
      if (hasRedirected) return;
      hasRedirected = true;
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      showToast.success("Login successful!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "LSHORTER_AUTH_SUCCESS") {
        handleAuthSuccess();
      }
    };
    window.addEventListener("message", onMessage);

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
    } catch {}

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
        `OAuth error with ${provider === "google" ? "Google" : "GitHub"}. Please check your configuration.`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#faf7f2] dark:bg-[#09090b] text-[#2b2520] dark:text-[#fafafa] transition-colors duration-200">
      {/* ── LEFT COLUMN: AUTHENTICATION FORM ── */}
      <div className="flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-8 sm:py-12 min-h-screen bg-[#faf7f2] dark:bg-[#09090b] z-10">
        {/* Brand Header & Theme Switcher */}
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2.5 group select-none cursor-pointer">
            <div className="w-8 h-8 rounded-[8px] bg-brand flex items-center justify-center shadow-md font-bebas text-lg text-white font-bold tracking-wider group-hover:scale-105 transition-transform shadow-[var(--brand-primary-glow)]">
              LS
            </div>
            <span className="font-bebas text-2xl text-neutral-900 dark:text-white tracking-wider flex items-center gap-0.5 leading-none">
              L<span className="text-brand">SHORTER</span>
            </span>
          </Link>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-300 dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-500 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-brand hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>

        {/* Center Content Form */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-8">
          {!showSignupPIN && !show2FAChallenge && (
            <>
              {/* Segmented Auth Mode Switcher (Log in / Sign up) */}
              <div className="flex p-1 mb-6 rounded-[12px] bg-neutral-200/80 dark:bg-[#141416] border border-neutral-300/80 dark:border-[#27272a]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setShowSignupPIN(false);
                    setShow2FAChallenge(false);
                  }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer select-none",
                    authMode === "login"
                      ? "bg-brand text-white shadow-sm shadow-[var(--brand-primary-glow)]"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  )}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setShowSignupPIN(false);
                    setShow2FAChallenge(false);
                  }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer select-none",
                    authMode === "register"
                      ? "bg-brand text-white shadow-sm shadow-[var(--brand-primary-glow)]"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  )}
                >
                  Sign up
                </button>
              </div>

              {/* Titles */}
              <div className="mb-6 text-left max-sm:text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  {authMode === "login" ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  {authMode === "login"
                    ? "Sign in to your account to continue"
                    : "Get started for free with 2,500 clicks/month included"}
                </p>
              </div>

              {/* Social OAuth Buttons (Google & GitHub) */}
              <div className="flex flex-col gap-2.5">
                {/* Google OAuth Button */}
                <button
                  onClick={() => handleOAuthLogin("google")}
                  type="button"
                  disabled={isLoading}
                  className="w-full h-11 rounded-[10px] bg-white hover:bg-neutral-50 dark:bg-[#141416] dark:hover:bg-[#1c1c20] border border-neutral-300 dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-600 flex items-center justify-center gap-3 text-xs font-semibold text-neutral-800 dark:text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
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
                  <span>Continue with Google</span>
                </button>

                {/* GitHub OAuth Button */}
                <button
                  onClick={() => handleOAuthLogin("github")}
                  type="button"
                  disabled={isLoading}
                  className="w-full h-11 rounded-[10px] bg-white hover:bg-neutral-50 dark:bg-[#141416] dark:hover:bg-[#1c1c20] border border-neutral-300 dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-600 flex items-center justify-center gap-3 text-xs font-semibold text-neutral-800 dark:text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-neutral-800 dark:fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-neutral-300 dark:bg-[#27272a]" />
                <span className="text-[10.5px] text-neutral-500 font-bold uppercase tracking-wider">
                  OR
                </span>
                <div className="flex-1 h-px bg-neutral-300 dark:bg-[#27272a]" />
              </div>
            </>
          )}

          {showSignupPIN ? (
            /* Signup PIN Validation Form - Style B (Pure Underline, No Card, Modern Typography) */
            <form
              onSubmit={handleVerifySignupPin}
              className="flex flex-col animate-in fade-in duration-300 w-full"
            >
              {/* Modern Typography Header */}
              <div className="mb-7 text-left max-sm:text-center">
                <div className="text-[11px] font-semibold text-brand uppercase tracking-widest mb-1.5">
                  Security
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                  Confirmation code
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                  A 6-digit verification code has been sent to{" "}
                  <span className="font-semibold text-neutral-900 dark:text-white break-all">
                    {email}
                  </span>.
                </p>
              </div>

              {/* 6 Underline OTP Input Slots */}
              <div className="mb-7">
                <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-sm mx-auto">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        pinInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoFocus={idx === 0}
                      value={pinDigits[idx]}
                      onChange={(e) => handlePinDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handlePinDigitKeyDown(idx, e)}
                      onPaste={handlePinPaste}
                      className={cn(
                        "w-10 sm:w-12 h-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold bg-transparent border-b-2 outline-none transition-all duration-150 select-none",
                        pinDigits[idx]
                          ? "border-brand text-neutral-900 dark:text-white"
                          : "border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:border-brand"
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-3.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Code valid for 15 minutes</span>
                </div>
              </div>

              {/* Action Button - Style B (High-contrast, sleek modern styling in light & dark) */}
              <button
                type="submit"
                disabled={isLoading || signupPin.trim().length !== 6}
                className="w-full h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] disabled:opacity-50 mb-5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating account...</span>
                  </>
                ) : (
                  <span>Validate and continue →</span>
                )}
              </button>

              {/* Clean Footer Links */}
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
                <button
                  type="button"
                  disabled={signupCountdown > 0 || isLoading}
                  onClick={handleResendSignupPin}
                  className={cn(
                    "transition-colors cursor-pointer",
                    signupCountdown > 0
                      ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                      : "hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  {signupCountdown > 0
                    ? `Resend code (${signupCountdown}s)`
                    : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignupPIN(false);
                    setSignupPin("");
                    setPinDigits(["", "", "", "", "", ""]);
                  }}
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change email</span>
                </button>
              </div>
            </form>
          ) : show2FAChallenge ? (
            /* 2FA Challenge Form */
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 animate-in fade-in"
            >
              <div className="flex flex-col items-center text-center gap-1.5 p-4 rounded-[12px] bg-white dark:bg-[#141418] border border-neutral-300 dark:border-[#27272a] shadow-xs">
                <div className="w-11 h-11 rounded-[10px] bg-brand-light border border-brand-subtle flex items-center justify-center text-brand mb-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Two-Factor Authentication (2FA)
                </h3>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 max-w-xs leading-relaxed">
                  {useBackupCode
                    ? "Enter one of your emergency backup codes."
                    : `Enter the 6-digit code for ${email}`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {useBackupCode
                    ? "Emergency Backup Code"
                    : "Authentication Code (TOTP)"}
                </label>
                <Input
                  required
                  autoFocus
                  maxLength={useBackupCode ? 12 : 6}
                  placeholder={useBackupCode ? "ABCD-EFGH" : "000 000"}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="h-12 text-center font-mono text-xl tracking-[0.25em] text-neutral-900 dark:text-white font-bold bg-white dark:bg-[#141416] border-neutral-300 dark:border-[#27272a] focus:border-brand rounded-[10px]"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !twoFactorCode.trim()}
                className="w-full h-11 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-[10px] shadow-md transition-all cursor-pointer"
              >
                {isLoading ? "Verifying..." : "Verify & Access Dashboard"}
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode("");
                  }}
                  className="text-brand hover:underline font-medium cursor-pointer"
                >
                  {useBackupCode
                    ? "Use authenticator app code"
                    : "Lost device? Use backup code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShow2FAChallenge(false);
                    setTwoFactorCode("");
                  }}
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                >
                  ← Back to login
                </button>
              </div>
            </form>
          ) : (
            /* Normal Credentials Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name (in Register mode) */}
              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <Input
                      required
                      placeholder="Alex Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 bg-white dark:bg-[#141416] border-neutral-300 dark:border-[#27272a] focus:border-brand text-xs h-11 rounded-[10px] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-white dark:bg-[#141416] border-neutral-300 dark:border-[#27272a] focus:border-brand text-xs h-11 rounded-[10px] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Password
                  </label>
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs text-brand hover:underline font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 bg-white dark:bg-[#141416] border-neutral-300 dark:border-[#27272a] focus:border-brand text-xs h-11 rounded-[10px] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password (in Register mode) */}
              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 pr-9 bg-white dark:bg-[#141416] border-neutral-300 dark:border-[#27272a] focus:border-brand text-xs h-11 rounded-[10px] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-[10px] bg-brand hover:bg-brand-hover text-white font-bold text-xs tracking-wide shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {authMode === "login"
                        ? "Signing in..."
                        : "Sending verification code..."}
                    </span>
                  </>
                ) : (
                  <span>
                    {authMode === "login" ? "Sign In" : "Create Account"}
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Switch Mode Link */}
          {!showSignupPIN && !show2FAChallenge && (
            <div className="mt-6 text-center text-xs text-neutral-600 dark:text-neutral-400">
              {authMode === "login" ? (
                <span>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setShowSignupPIN(false);
                      setShow2FAChallenge(false);
                    }}
                    className="text-brand font-semibold hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setShowSignupPIN(false);
                      setShow2FAChallenge(false);
                    }}
                    className="text-brand font-semibold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="text-center text-[11px] text-neutral-500">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-neutral-600 dark:text-neutral-400 hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-neutral-600 dark:text-neutral-400 hover:underline">
            Privacy Policy
          </a>
          .
        </div>
      </div>

      {/* ── RIGHT COLUMN: CLEAN MINIMALIST BRAND SHOWCASE WITH BOUNCING LS LOGO & ENGLISH MOTTO ── */}
      <div className="hidden lg:flex flex-col items-center justify-center relative bg-[#faf7f2] dark:bg-[#0d0d12] overflow-hidden border-l border-neutral-300/80 dark:border-[#222225] select-none p-12 transition-colors duration-200">
        {/* Subtle radial ambient glow behind the logo */}
        <div className="absolute w-[450px] h-[450px] bg-brand-light rounded-full blur-[140px] pointer-events-none opacity-60 dark:opacity-80" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
          {/* Animated Bouncing Official LS Logo Squircle */}
          <div className="w-28 h-28 rounded-3xl bg-brand flex items-center justify-center animate-icon-bounce shadow-2xl relative group cursor-default shadow-brand">
            {/* Inner gloss effect overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 via-transparent to-white/25 pointer-events-none" />
            <span className="font-bebas text-6xl font-black text-white tracking-widest drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              LS
            </span>
          </div>

          {/* Slogan / Devise in English */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mt-9 leading-tight">
            Every Click Matters. <br />
            <span className="text-brand">Every Millisecond Counts.</span>
          </h2>

          {/* Subtitle in English */}
          <p className="text-base text-neutral-600 dark:text-neutral-400 mt-3 max-w-xs leading-relaxed">
            Next-gen Anycast edge routing, smart geo-targeting, and real-time analytics.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}

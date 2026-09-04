"use client";

import React, { useState, useEffect } from "react";
import { X, HelpCircle, Bug, Lightbulb, MessageSquare, Paperclip, User, Send, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/toast-provider";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryType = "Question" | "Bug" | "Feature" | "Other";

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { data: session } = useSession();
  const [category, setCategory] = useState<CategoryType>("Question");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [currentPath, setCurrentPath] = useState("/dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname || "/dashboard");
    }
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [isOpen, session?.user?.email]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          email: email.trim() || session?.user?.email || "visiteur@lshorter.io",
          message: message.trim(),
          pageContext: currentPath,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSent(true);
        showToast.success("Merci ! Votre retour a bien été transmis.");
        setTimeout(() => {
          setIsSent(false);
          setMessage("");
          onClose();
        }, 1500);
      } else {
        showToast.error(data.message || "Erreur lors de l'envoi.");
      }
    } catch {
      showToast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Array<{ id: CategoryType; label: string; icon: React.ReactNode }> = [
    { id: "Question", label: "Question", icon: <HelpCircle className="w-4 h-4" /> },
    { id: "Bug", label: "Signaler un Bug", icon: <Bug className="w-4 h-4" /> },
    { id: "Feature", label: "Fonctionnalité", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "Other", label: "Autre", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[10px] bg-[#141416] border border-[#27272a] p-6 shadow-2xl text-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {isSent ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-xl font-bold">Message envoyé !</h3>
            <p className="text-sm text-neutral-400">
              Merci pour votre retour. Notre équipe vous répondra sous peu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-100">Aide & Retours</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Une question, un bug ou une suggestion ? Notre équipe technique vous répond rapidement.
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {categories.map((cat) => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] text-xs font-medium border transition-all cursor-pointer",
                      isActive
                        ? cat.id === "Bug"
                          ? "bg-rose-500/15 border-rose-500 text-rose-400 shadow-sm"
                          : cat.id === "Feature"
                            ? "bg-sky-500/15 border-sky-500 text-sky-400 shadow-sm"
                            : "bg-[#ff6600]/15 border-[#ff6600] text-[#ff6600] shadow-sm"
                        : "bg-[#1b1b1e] border-[#27272a] text-neutral-300 hover:bg-[#27272a]"
                    )}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Email Field */}
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@exemple.com"
                className="w-full rounded-[10px] bg-[#1a1a1e] border border-[#27272a] px-3.5 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600] transition-colors"
              />
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                required
                rows={4}
                maxLength={5000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  category === "Bug"
                    ? "Décrivez le problème rencontré, les étapes pour le reproduire ou le message d'erreur..."
                    : category === "Feature"
                      ? "Décrivez la fonctionnalité que vous aimeriez voir sur LShorter..."
                      : "Comment pouvons-nous vous aider ?"
                }
                className="w-full rounded-[10px] bg-[#1a1a1e] border border-[#27272a] p-3.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600] transition-colors resize-none"
              />
            </div>

            {/* Bottom context and actions */}
            <div className="flex items-center justify-between pt-1 text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Pièce jointe"
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Profil utilisateur"
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                >
                  <User className="w-4 h-4" />
                </button>
                <span className="text-neutral-500">sur {currentPath}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-neutral-500">{message.length}/5000</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] bg-[#ff6600] hover:bg-[#e65c00] text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Envoi..." : "Envoyer"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

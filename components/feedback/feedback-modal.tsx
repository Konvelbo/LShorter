"use client";

import React, { useState, useEffect } from "react";
import { X, HelpCircle, Bug, Lightbulb, MessageSquare, Paperclip, User, Send, CheckCircle2, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/components/providers/i18n-provider";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryType = "Question" | "Bug" | "Feature" | "Other";

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { tr } = useI18n();
  const { data: session } = useSession();
  const [category, setCategory] = useState<CategoryType>("Question");
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
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
          rating,
          email: email.trim() || session?.user?.email || "visiteur@lsho.cc",
          message: message.trim(),
          pageContext: currentPath,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSent(true);
        showToast.success(tr("Thank you! Your feedback has been submitted.", "Merci ! Votre retour a bien été envoyé."));
        setTimeout(() => {
          setIsSent(false);
          setMessage("");
          setRating(5);
          onClose();
        }, 1500);
      } else {
        showToast.error(data.message || tr("Error sending feedback.", "Erreur lors de l'envoi du retour."));
      }
    } catch {
      showToast.error(tr("Connection error. Please try again.", "Erreur de connexion. Veuillez réessayer."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Array<{ id: CategoryType; label: string; icon: React.ReactNode }> = [
    { id: "Question", label: tr("Question", "Question"), icon: <HelpCircle className="w-4 h-4" /> },
    { id: "Bug", label: tr("Report a Bug", "Signaler un bug"), icon: <Bug className="w-4 h-4" /> },
    { id: "Feature", label: tr("Feature Request", "Idée de fonctionnalité"), icon: <Lightbulb className="w-4 h-4" /> },
    { id: "Other", label: tr("Other", "Autre"), icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl ds-card p-6 shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer p-1.5"
        >
          <X className="w-5 h-5" />
        </button>

        {isSent ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {tr("Feedback Sent!", "Retour envoyé !")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tr(
                "Thank you for helping us improve. Our team will review your message shortly.",
                "Merci de nous aider à nous améliorer. Notre équipe examinera votre message très vite."
              )}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#465FFF]/10 border border-[#465FFF]/20 flex items-center justify-center text-[#465FFF] shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {tr("Feedback & Help Center", "Centre d'aide & Retours")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {tr(
                    "Have a question, found a bug, or have an idea? Our engineering team is here to help.",
                    "Une question, un bug ou une idée ? Notre équipe technique est là pour vous aider."
                  )}
                </p>
              </div>
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
                      "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                      isActive
                        ? cat.id === "Bug"
                          ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-2xs"
                          : cat.id === "Feature"
                            ? "bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 shadow-2xs"
                            : "bg-[#ECF3FF] dark:bg-[#465FFF]/15 border-[#465FFF] text-[#465FFF] dark:text-[#7592FF] shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Rating Section */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {tr("Overall Experience Rating:", "Note globale de l'expérience :")}
                </span>
                <span className="text-xs font-bold text-[#465FFF] dark:text-[#7592FF]">
                  {hoveredRating === 1 || (!hoveredRating && rating === 1)
                    ? tr("1/5 - Poor 😞", "1/5 - Médiocre 😞")
                    : hoveredRating === 2 || (!hoveredRating && rating === 2)
                    ? tr("2/5 - Fair 😐", "2/5 - Moyen 😐")
                    : hoveredRating === 3 || (!hoveredRating && rating === 3)
                    ? tr("3/5 - Good 🙂", "3/5 - Bien 🙂")
                    : hoveredRating === 4 || (!hoveredRating && rating === 4)
                    ? tr("4/5 - Very Good 😊", "4/5 - Très bien 😊")
                    : tr("5/5 - Excellent! 🤩", "5/5 - Excellent ! 🤩")}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const currentScore = hoveredRating !== null ? hoveredRating : rating;
                  const isFilled = starValue <= currentScore;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onMouseLeave={() => setHoveredRating(null)}
                      title={tr(`${starValue} out of 5`, `${starValue} sur 5`)}
                      className="p-1 -m-1 transition-transform active:scale-90 hover:scale-125 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "w-5 h-5 transition-all duration-150",
                          isFilled
                            ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                            : "text-slate-300 dark:text-slate-600 fill-transparent hover:text-amber-400"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tr("your-email@example.com", "votre-email@exemple.com")}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#465FFF] transition-colors"
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
                    ? tr(
                        "Describe the issue, steps to reproduce, or any error messages...",
                        "Décrivez le problème, les étapes pour le reproduire ou les messages d'erreur..."
                      )
                    : category === "Feature"
                      ? tr(
                          "Describe the feature or workflow you would like to see...",
                          "Décrivez la fonctionnalité ou le flux que vous aimeriez voir..."
                        )
                      : tr("How can we help you today?", "Comment pouvons-nous vous aider aujourd'hui ?")
                }
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#465FFF] transition-colors resize-none"
              />
            </div>

            {/* Bottom context and actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  title={tr("Attachment", "Pièce jointe")}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer p-1"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title={tr("User profile", "Profil utilisateur")}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer p-1"
                >
                  <User className="w-4 h-4" />
                </button>
                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                  {currentPath}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {message.length}/5000
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer font-semibold"
                >
                  {tr("Cancel", "Annuler")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? tr("Sending...", "Envoi...") : tr("Submit Feedback", "Envoyer")}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

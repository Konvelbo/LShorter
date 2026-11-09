"use client";

import React, { useState } from "react";
import {
  X,
  HeartHandshake,
  DollarSign,
  Layers,
  Clock,
  Bug,
  ArrowRightLeft,
  MessageSquare,
  Star,
  CheckCircle2,
  ShieldCheck,
  Info,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";

export interface CancellationFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: string;
  displayPeriodEnd: string;
  onSuccess?: () => void;
}

interface ReasonOption {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CANCELLATION_REASONS: ReasonOption[] = [
  {
    id: "price",
    label: "Tarif trop élevé",
    description: "Le coût ne correspond pas à mon budget ou à mon usage actuel",
    placeholder: "Quel tarif ou quelle formule aurait mieux correspondu à votre projet ?",
    icon: DollarSign,
  },
  {
    id: "missing_features",
    label: "Fonctionnalité manquante",
    description: "Il me manque une option ou un outil essentiel",
    placeholder: "Quelle fonctionnalité ou intégration spécifique vous a manqué ?",
    icon: Layers,
  },
  {
    id: "temporary_need",
    label: "Usage ponctuel / Projet terminé",
    description: "Ma campagne ou mon besoin temporaire est achevé",
    placeholder: "Parlez-nous de votre projet : qu'avez-vous particulièrement apprécié ?",
    icon: Clock,
  },
  {
    id: "complexity_bugs",
    label: "Difficulté d'utilisation ou bugs",
    description: "J'ai rencontré des lenteurs, bugs ou un manque de simplicité",
    placeholder: "Quels problèmes ou obstacles avez-vous rencontrés lors de l'utilisation ?",
    icon: Bug,
  },
  {
    id: "switched_alternative",
    label: "Autre outil choisi",
    description: "J'ai opté pour une autre solution concurrente",
    placeholder: "Quelle alternative avez-vous choisie et quelle différence a fait pencher la balance ?",
    icon: ArrowRightLeft,
  },
  {
    id: "other",
    label: "Autre motif",
    description: "Un motif différent ou personnel",
    placeholder: "Dites-nous ce que nous aurions pu faire de mieux pour vous convaincre de rester...",
    icon: MessageSquare,
  },
];

export function CancellationFeedbackModal({
  isOpen,
  onClose,
  plan,
  displayPeriodEnd,
  onSuccess,
}: CancellationFeedbackModalProps) {
  const { data: session } = useSession();
  const [selectedReasonId, setSelectedReasonId] = useState<string>("price");
  const [detailedFeedback, setDetailedFeedback] = useState<string>("");
  const [rating, setRating] = useState<number>(4);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentReason =
    CANCELLATION_REASONS.find((r) => r.id === selectedReasonId) ||
    CANCELLATION_REASONS[0];

  const handleConfirmCancelWithFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedReasonId) {
      showToast.error("Veuillez sélectionner un motif d'annulation pour nous aider à nous améliorer.");
      return;
    }

    setIsSubmitting(true);
    const userEmail = session?.user?.email || "visiteur@lsho.cc";
    const selectedReasonLabel = currentReason.label;

    try {
      // 1. Envoyer le feedback à la route dédiée (qui notifie l'équipe & sauvegarde dans Convex)
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "Cancellation",
            rating,
            email: userEmail,
            message: `[Annulation ${plan}] Motif : ${selectedReasonLabel}\n\nCommentaires de l'utilisateur :\n${
              detailedFeedback.trim() || "(Aucun commentaire détaillé supplémentaire fourni)"
            }\n\nNote globale : ${rating}/5`,
            pageContext: "/dashboard/settings?tab=billing",
          }),
        });
      } catch (fbErr) {
        console.warn("[Cancellation Feedback] Non-fatal error sending feedback:", fbErr);
      }

      // 2. Annuler le renouvellement automatique auprès du backend de facturation
      const cancelRes = await fetch("/api/billing/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: selectedReasonLabel,
          feedback: detailedFeedback.trim(),
          rating,
        }),
      });

      const cancelData = await cancelRes.json();

      if (cancelData.success) {
        showToast.success(
          `Votre retour a bien été transmis. Le renouvellement automatique est désactivé et vos services ${plan} restent actifs jusqu'au ${displayPeriodEnd}.`
        );
        onSuccess?.();
        onClose();
      } else {
        showToast.error(
          cancelData.error ||
            "Une erreur est survenue lors de l'annulation du renouvellement. Veuillez réessayer ou contacter le support."
        );
      }
    } catch (err) {
      console.error("[Cancellation Feedback Modal Error]:", err);
      showToast.error("Une erreur réseau est survenue. Veuillez vérifier votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl my-auto bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] rounded-[14px] shadow-2xl p-5 sm:p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={() => !isSubmitting && onClose()}
          disabled={isSubmitting}
          className="absolute right-4 top-4 p-1.5 rounded-[10px] text-zinc-400 hover:text-zinc-600 dark:text-neutral-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-[12px] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-md shadow-red-500/10">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-snug">
              Pourquoi souhaitez-vous annuler le renouvellement ?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 leading-relaxed">
              Votre avis est précieux : dites-nous ce qui vous a manqué sur <strong>LShorter {plan}</strong> afin que nous puissions améliorer la plateforme.
            </p>
          </div>
        </div>

        <form onSubmit={handleConfirmCancelWithFeedback} className="flex flex-col gap-4">
          {/* Reason Selection Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-neutral-300">
              1. Motif principal d&apos;annulation <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CANCELLATION_REASONS.map((r) => {
                const isSelected = selectedReasonId === r.id;
                const IconComponent = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReasonId(r.id)}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-[10px] border text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-red-50/80 dark:bg-red-950/20 border-red-500/70 text-zinc-900 dark:text-white shadow-xs ring-1 ring-red-500/30"
                        : "bg-zinc-50/70 dark:bg-[#1a1a1e] border-zinc-200 dark:border-[#27272a] text-zinc-600 dark:text-neutral-400 hover:bg-zinc-100 dark:hover:bg-[#202025] hover:text-zinc-900 dark:hover:text-neutral-200"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        isSelected
                          ? "bg-red-500 text-white shadow-xs"
                          : "bg-zinc-200/70 dark:bg-[#25252b] text-zinc-500 dark:text-neutral-400"
                      )}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate leading-tight">
                        {r.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-neutral-500 line-clamp-1 leading-snug mt-0.5">
                        {r.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Feedback Textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="detailedFeedback"
                className="text-xs font-semibold text-zinc-700 dark:text-neutral-300"
              >
                2. Dites-nous ce qui vous a manqué (ou vos suggestions) :
              </label>
              <span className="text-[11px] text-zinc-400 dark:text-neutral-500">
                {detailedFeedback.length}/2000
              </span>
            </div>
            <textarea
              id="detailedFeedback"
              rows={3}
              maxLength={2000}
              value={detailedFeedback}
              onChange={(e) => setDetailedFeedback(e.target.value)}
              placeholder={currentReason.placeholder}
              className="w-full rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] p-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0066FF] transition-all resize-none"
            />
          </div>

          {/* Experience Rating */}
          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-zinc-700 dark:text-neutral-300">
              Note globale de votre expérience :
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const currentScore = hoveredRating !== null ? hoveredRating : rating;
                const isFilled = star <= currentScore;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    title={`${star} sur 5`}
                    className="p-0.5 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isFilled
                          ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]"
                          : "text-zinc-300 dark:text-neutral-600 fill-transparent"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reassurance & Period Reminder Box */}
          <div className="p-3.5 rounded-[10px] bg-zinc-100/70 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#252528] flex flex-col gap-2 text-xs">
            <div className="flex items-start gap-2.5 text-zinc-700 dark:text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Accès garanti jusqu&apos;au {displayPeriodEnd}</strong> : Vos liens, statistiques et quotas restent 100% actifs jusqu&apos;à l&apos;échéance de la période payée.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-zinc-700 dark:text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Zéro prélèvement futur</strong> : Aucun débit bancaire automatique ultérieur ne sera effectué.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-[#222225]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-semibold rounded-[10px] border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#1a1a1e] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-300 cursor-pointer"
            >
              Conserver mon abonnement
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold rounded-[10px] bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 border border-red-500/30 gap-2 cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Envoi &amp; Annulation...</span>
                </>
              ) : (
                <span>Confirmer l&apos;annulation &amp; Envoyer mon avis</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

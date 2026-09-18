"use client";

import React, { useState, useEffect } from "react";
import { X, HelpCircle, Bug, Lightbulb, MessageSquare, Paperclip, User, Send, CheckCircle2, Star } from "lucide-react";
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
          email: email.trim() || session?.user?.email || "visiteur@lshorter.io",
          message: message.trim(),
          pageContext: currentPath,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSent(true);
        showToast.success("Thank you! Your feedback has been submitted.");
        setTimeout(() => {
          setIsSent(false);
          setMessage("");
          setRating(5);
          onClose();
        }, 1500);
      } else {
        showToast.error(data.message || "Error sending feedback.");
      }
    } catch {
      showToast.error("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Array<{ id: CategoryType; label: string; icon: React.ReactNode }> = [
    { id: "Question", label: "Question", icon: <HelpCircle className="w-4 h-4" /> },
    { id: "Bug", label: "Report a Bug", icon: <Bug className="w-4 h-4" /> },
    { id: "Feature", label: "Feature Request", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "Other", label: "Other", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-6 shadow-2xl text-zinc-900 dark:text-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-zinc-400 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {isSent ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h3 className="text-xl font-bold">Feedback Sent!</h3>
            <p className="text-sm text-zinc-500 dark:text-neutral-400">
              Thank you for helping us improve. Our team will review your message shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-neutral-100">Help &amp; Feedback</h2>
              <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                Have a question, found a bug, or have an idea? Our technical team is here to help.
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
                          ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm"
                          : cat.id === "Feature"
                            ? "bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm"
                            : "bg-brand-subtle border-brand text-brand shadow-sm"
                        : "bg-zinc-100 dark:bg-[#1b1b1e] border-zinc-200 dark:border-[#27272a] text-zinc-600 dark:text-neutral-300 hover:bg-zinc-200 dark:hover:bg-[#27272a]"
                    )}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Rating Section */}
            <div className="flex flex-col gap-1.5 p-3 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-neutral-300">Overall Rating:</span>
                <span className="text-xs font-bold text-brand">
                  {hoveredRating === 1 || (!hoveredRating && rating === 1)
                    ? "1/5 - Poor 😞"
                    : hoveredRating === 2 || (!hoveredRating && rating === 2)
                    ? "2/5 - Fair 😐"
                    : hoveredRating === 3 || (!hoveredRating && rating === 3)
                    ? "3/5 - Good 🙂"
                    : hoveredRating === 4 || (!hoveredRating && rating === 4)
                    ? "4/5 - Very Good 😊"
                    : "5/5 - Excellent! 🤩"}
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
                      title={`${starValue} out of 5`}
                      className="p-1 -m-1 transition-transform active:scale-90 hover:scale-125 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "w-5 h-5 transition-all duration-150",
                          isFilled
                            ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                            : "text-zinc-300 dark:text-neutral-500 fill-transparent hover:text-amber-400"
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
                placeholder="your-email@example.com"
                className="w-full rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] px-3.5 py-2.5 text-sm text-zinc-900 dark:text-neutral-200 placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-brand transition-colors"
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
                    ? "Describe the issue, steps to reproduce, or any error messages..."
                    : category === "Feature"
                      ? "Describe the feature or workflow you would like to see..."
                      : "How can we help you today?"
                }
                className="w-full rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] p-3.5 text-sm text-zinc-900 dark:text-neutral-200 placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-brand transition-colors resize-none"
              />
            </div>

            {/* Bottom context and actions */}
            <div className="flex items-center justify-between pt-1 text-xs text-zinc-500 dark:text-neutral-400">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Attachment"
                  className="text-zinc-400 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer p-1"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="User profile"
                  className="text-zinc-400 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer p-1"
                >
                  <User className="w-4 h-4" />
                </button>
                <span className="text-zinc-400 dark:text-neutral-500">on {currentPath}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-zinc-400 dark:text-neutral-500">{message.length}/5000</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-zinc-600 dark:text-neutral-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] bg-brand hover:bg-brand-hover text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Submit"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

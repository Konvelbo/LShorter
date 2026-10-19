"use client";

import React, { useState, useEffect } from "react";
import { X, Webhook, Check, Globe, Sliders, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

export interface WebhookModalData {
  id?: string;
  url: string;
  events: string[];
  isActive?: boolean;
  secretKey?: string;
}

export const ALL_WEBHOOK_EVENTS = [
  { id: "click.created", label: "click.created", desc: "Nouveau clic enregistré sur un lien court" },
  { id: "conversion.created", label: "conversion.created", desc: "Enregistrement d'une vente ou conversion" },
  { id: "link.created", label: "link.created", desc: "Création d'un nouveau lien court" },
  { id: "link.updated", label: "link.updated", desc: "Modification des paramètres d'un lien" },
  { id: "link.deleted", label: "link.deleted", desc: "Suppression définitive d'un lien" },
  { id: "qr.scanned", label: "qr.scanned", desc: "Scan d'un QR code généré" },
] as const;

export const ALL_EVENT_IDS = ALL_WEBHOOK_EVENTS.map((e) => e.id);

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookToEdit?: WebhookModalData | null;
  onSave: (data: WebhookModalData) => Promise<void>;
  isSaving: boolean;
}

export function WebhookModal({
  isOpen,
  onClose,
  webhookToEdit,
  onSave,
  isSaving,
}: WebhookModalProps) {
  const isEdit = Boolean(webhookToEdit?.id);

  const [url, setUrl] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([...ALL_EVENT_IDS]);
  const [secretKey, setSecretKey] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (webhookToEdit) {
        setUrl(webhookToEdit.url || "");
        setSecretKey(webhookToEdit.secretKey || "");
        const events =
          Array.isArray(webhookToEdit.events) && webhookToEdit.events.length > 0
            ? webhookToEdit.events
            : ["click.created", "conversion.created"];

        const isAll =
          events.length === ALL_EVENT_IDS.length &&
          ALL_EVENT_IDS.every((ev) => events.includes(ev));

        setIsGlobal(isAll);
        setSelectedEvents(events);
      } else {
        setUrl("");
        setSecretKey("");
        setIsGlobal(true);
        setSelectedEvents([...ALL_EVENT_IDS]);
      }
    }
  }, [isOpen, webhookToEdit]);

  const handleToggleGlobal = (checked: boolean) => {
    setIsGlobal(checked);
    if (checked) {
      setSelectedEvents([...ALL_EVENT_IDS]);
    }
  };

  const handleToggleEvent = (eventId: string) => {
    if (isGlobal) {
      setIsGlobal(false);
      setSelectedEvents([eventId]);
      return;
    }

    if (selectedEvents.includes(eventId)) {
      if (selectedEvents.length === 1) {
        setErrorMsg("Veuillez sélectionner au moins un événement.");
        return;
      }
      setErrorMsg(null);
      setSelectedEvents(selectedEvents.filter((e) => e !== eventId));
    } else {
      setErrorMsg(null);
      const next = [...selectedEvents, eventId];
      setSelectedEvents(next);
      if (next.length === ALL_EVENT_IDS.length && ALL_EVENT_IDS.every((ev) => next.includes(ev))) {
        setIsGlobal(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !url.trim()) {
      setErrorMsg("Veuillez renseigner l'URL du webhook.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setErrorMsg("L'URL saisie est invalide (doit commencer par https:// ou http://).");
      return;
    }

    const eventsToSubmit = isGlobal ? [...ALL_EVENT_IDS] : selectedEvents;
    if (eventsToSubmit.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins un événement à écouter.");
      return;
    }

    setErrorMsg(null);
    await onSave({
      id: webhookToEdit?.id,
      url: url.trim(),
      events: eventsToSubmit,
      isActive: webhookToEdit?.isActive ?? true,
      secretKey: secretKey.trim() || undefined,
    });
  };

  const drawerDirection = isMobile ? "bottom" : "right";

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction={drawerDirection}>
      <DrawerContent
        direction={drawerDirection}
        widthClass="w-full sm:max-w-[480px]"
        className="h-auto max-h-[88vh] md:h-full md:max-h-full flex flex-col bg-white dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] rounded-[10px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-[#202024] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {isEdit ? "Modifier le Webhook" : "Nouveau Webhook"}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isEdit
                  ? "Mettez à jour votre URL et les événements souscrits"
                  : "Recevez les événements en temps réel sur votre serveur"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-[8px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#1f1f23] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="px-3 py-2 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-medium">
              {errorMsg}
            </div>
          )}

          {/* URL Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              URL du Endpoint <span className="text-red-500">*</span>
            </label>
            <Input
              required
              type="url"
              placeholder="https://votre-serveur.com/api/webhooks/lshorter"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSaving}
              className="h-9 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-xs font-mono"
            />
            <span className="text-[10px] text-zinc-500">
              Compatible avec Make, Zapier, n8n, Supabase ou votre propre serveur backend.
            </span>
          </div>

          {/* Events Configuration */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-[#202024]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Événements à diffuser</span>
              </label>

              {/* Globalité Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggleGlobal(!isGlobal)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isGlobal
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    : "bg-zinc-100 dark:bg-[#1c1c20] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Globalité (Tous les événements)</span>
                {isGlobal && <Check className="w-3 h-3 ml-0.5 text-blue-500" />}
              </button>
            </div>

            {/* Event Checkboxes Grid */}
            <div className="grid grid-cols-1 gap-2 mt-1">
              {ALL_WEBHOOK_EVENTS.map((ev) => {
                const isChecked = isGlobal || selectedEvents.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => handleToggleEvent(ev.id)}
                    className={`p-2.5 rounded-[8px] border transition-all cursor-pointer flex items-start gap-2 select-none ${
                      isChecked
                        ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-300/70 dark:border-blue-900/60"
                        : "bg-zinc-50/60 dark:bg-[#18181b]/60 border-zinc-200 dark:border-[#27272a] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121215]"
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[11px] font-semibold text-zinc-900 dark:text-white truncate">
                        {ev.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        {ev.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secret Signature (Optional/Edit) */}
          {isEdit && (
            <div className="flex flex-col gap-1 pt-2 border-t border-zinc-100 dark:border-[#202024]">
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Clé Secrète HMAC (Signature de sécurité)</span>
              </label>
              <Input
                type="text"
                placeholder="whsec_live_..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={isSaving}
                className="h-8 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-[11px] font-mono text-zinc-600 dark:text-zinc-400"
              />
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 mt-auto border-t border-zinc-100 dark:border-[#202024] shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={onClose}
              className="h-8 px-3.5 rounded-[8px] text-xs cursor-pointer border-zinc-200 dark:border-[#27272a]"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="h-8 px-4 rounded-[8px] text-xs font-semibold bg-brand hover:bg-brand-hover text-white cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Enregistrement...</span>
                </>
              ) : isEdit ? (
                "Enregistrer les modifications"
              ) : (
                "Créer le Webhook"
              )}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

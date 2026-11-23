"use client";

import React, { useState, useEffect } from "react";
import { X, Webhook, Check, Globe, Sliders, Shield, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { showToast } from "@/components/ui/toast-provider";

export interface WebhookModalData {
  id?: string;
  name?: string;
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

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([...ALL_EVENT_IDS]);
  const [secretKey, setSecretKey] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
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
      setCopiedSecret(false);
      if (webhookToEdit) {
        setName(webhookToEdit.name || "");
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
        setName("");
        setUrl("");
        setSecretKey("");
        setIsGlobal(true);
        setSelectedEvents([...ALL_EVENT_IDS]);
      }
    }
  }, [isOpen, webhookToEdit]);

  const handleCopySecret = async () => {
    if (!secretKey) return;
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopiedSecret(true);
      showToast.success("Clé secrète HMAC copiée dans le presse-papiers.");
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      showToast.error("Impossible de copier la clé secrète.");
    }
  };

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
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Veuillez saisir un nom pour identifier ce webhook.");
      return;
    }
    if (trimmedName.length > 100) {
      setErrorMsg("Le nom du webhook ne doit pas dépasser 100 caractères.");
      return;
    }
    if (/[<>]/.test(trimmedName)) {
      setErrorMsg("Le nom du webhook ne peut pas contenir de caractères HTML (< ou >).");
      return;
    }

    if (!url || !url.trim()) {
      setErrorMsg("Veuillez renseigner l'URL du webhook.");
      return;
    }

    try {
      const parsedUrl = new URL(url.trim());
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        setErrorMsg("L'URL doit commencer par https:// ou http://.");
        return;
      }
      if (!parsedUrl.hostname.includes(".") || parsedUrl.hostname === "localhost") {
        setErrorMsg("Veuillez saisir un nom de domaine public complet (ex. https://mon-serveur.com/api/webhook).");
        return;
      }
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
      name: trimmedName,
      url: url.trim(),
      events: eventsToSubmit,
      isActive: webhookToEdit?.isActive ?? true,
      ...(isEdit ? {} : { secretKey: secretKey.trim() || undefined }),
    });
  };

  const drawerDirection = isMobile ? "bottom" : "right";

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction={drawerDirection}>
      <DrawerContent
        direction={drawerDirection}
        widthClass="w-full sm:max-w-[580px] md:max-w-[620px]"
        className="h-auto max-h-[90vh] md:h-full md:max-h-full flex flex-col bg-white dark:bg-[#111113] border-zinc-200 dark:border-zinc-800 rounded-[12px] shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0 bg-white dark:bg-[#111113]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/70 flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {isEdit ? "Modifier le webhook" : "Nouveau webhook"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isEdit
                  ? "Mettez à jour le nom, l'endpoint et les événements écoutés"
                  : "Recevez les événements en temps réel sur votre serveur"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isSaving}
            className="p-1.5 rounded-[8px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {errorMsg && (
            <div className="px-3.5 py-2.5 rounded-[8px] bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-[13px] font-medium">
              {errorMsg}
            </div>
          )}

          {/* Webhook Name Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="webhook-name-input" className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
              Nom du webhook <span className="text-red-500">*</span>
            </label>
            <Input
              id="webhook-name-input"
              required
              type="text"
              maxLength={100}
              placeholder="Ex. CRM Production, Alertes Slack, Synchronisation Zapier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              className="h-10 rounded-[8px] bg-white dark:bg-[#161619] border-zinc-200 dark:border-zinc-800 text-[13px] font-normal text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Un libellé clair pour identifier facilement ce point de terminaison dans votre liste.
            </span>
          </div>

          {/* URL Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="webhook-endpoint-url" className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
              URL du endpoint <span className="text-red-500">*</span>
            </label>
            <Input
              id="webhook-endpoint-url"
              required
              type="url"
              placeholder="https://votre-serveur.com/api/webhooks/lshorter"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSaving}
              className="h-10 rounded-[8px] bg-white dark:bg-[#161619] border-zinc-200 dark:border-zinc-800 text-[13px] font-mono font-normal text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Compatible avec Make, Zapier, n8n, Supabase ou votre propre serveur backend.
            </span>
          </div>

          {/* Events Configuration */}
          <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Événements à diffuser</span>
              </label>

              {/* Globalité Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggleGlobal(!isGlobal)}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isGlobal
                    ? "bg-blue-50/70 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Tous les événements</span>
                {isGlobal && <Check className="w-3 h-3" />}
              </button>
            </div>

            {/* Event Checkboxes Grid */}
            <div className="grid grid-cols-1 gap-2">
              {ALL_WEBHOOK_EVENTS.map((ev) => {
                const isChecked = isGlobal || selectedEvents.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => handleToggleEvent(ev.id)}
                    className={`px-3.5 py-2.5 rounded-[8px] border text-left transition-colors cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? "bg-blue-50/40 dark:bg-blue-500/[0.06] border-blue-200/90 dark:border-blue-500/30"
                        : "bg-white dark:bg-[#161619] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? "bg-brand border-brand text-white"
                          : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#111113]"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {ev.label}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                        {ev.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Read-Only Secret Signature (Edit Mode) */}
          {isEdit && (
            <div className="flex flex-col gap-1.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="webhook-secret-key-input"
                  className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Clé Secrète HMAC (Signature de sécurité)</span>
                </label>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Lecture seule
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  id="webhook-secret-key-input"
                  type="text"
                  readOnly
                  aria-readonly="true"
                  value={secretKey || "—"}
                  className="h-10 flex-1 rounded-[8px] bg-zinc-100/80 dark:bg-[#161619] border-zinc-200 dark:border-zinc-800 text-[12.5px] font-mono font-normal text-zinc-700 dark:text-zinc-300 select-all cursor-default focus:border-zinc-300 dark:focus:border-zinc-700 focus:ring-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                  disabled={!secretKey}
                  data-testid="copy-webhook-secret-btn"
                  className="h-10 px-3.5 rounded-[8px] text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161619] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 cursor-pointer shrink-0 gap-1.5"
                >
                  {copiedSecret ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </Button>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Utilisez cette clé pour vérifier l&apos;authenticité des requêtes via l&apos;en-tête{" "}
                <code className="font-mono text-[11.5px] text-zinc-700 dark:text-zinc-300">
                  X-LShorter-Signature
                </code>{" "}
                (HMAC-SHA256).
              </span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 mt-auto border-t border-zinc-100 dark:border-zinc-800/80 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={onClose}
              className="h-9 px-4 rounded-[8px] text-[13px] font-medium cursor-pointer border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/70"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="h-9 px-4 rounded-[8px] text-[13px] font-medium bg-brand hover:bg-brand-hover text-white cursor-pointer shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Enregistrement...</span>
                </>
              ) : isEdit ? (
                "Enregistrer les modifications"
              ) : (
                "Créer le webhook"
              )}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

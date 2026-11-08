"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { ShortLink } from "@/types";
import { LinkDrawer } from "./link-drawer";

export interface PageLinkDrawersHandle {
  openCreate: (initialUrl?: string) => void;
  openEdit: (link: ShortLink) => void;
  syncLinksList: (links: ShortLink[]) => void;
  syncLinkIfEditing: (link: ShortLink) => void;
  close: () => void;
}

interface PageLinkDrawersProps {
  linksCount?: number;
  onCreated?: (created: ShortLink) => void;
  onUpdated?: (updated: ShortLink) => void;
}

interface ActivePageContext {
  linksCount?: number;
  onCreated?: (created: ShortLink) => void;
  onUpdated?: (updated: ShortLink) => void;
}

type DrawerCommand =
  | { type: "open-create"; initialUrl?: string }
  | { type: "open-edit"; link: ShortLink }
  | { type: "sync-list"; links: ShortLink[] }
  | { type: "sync-editing"; link: ShortLink }
  | { type: "close" };

let activePageContext: ActivePageContext = {};
const contextListeners = new Set<() => void>();
const commandListeners = new Set<(cmd: DrawerCommand) => void>();

function dispatchDrawerCommand(cmd: DrawerCommand) {
  commandListeners.forEach((fn) => fn(cmd));
}

function updateActivePageContext(next: ActivePageContext) {
  activePageContext = next;
  contextListeners.forEach((fn) => fn());
}

/**
 * Single centralized LinkDrawer host mounted once in Topbar (DashboardLayout).
 * Eliminates duplicate pre-mounted drawer portals across dashboard pages and
 * prevents parent page re-renders when opening/closing create or edit drawers.
 */
export const GlobalLinkDrawerHost = React.memo(function GlobalLinkDrawerHost() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editLink, setEditLink] = useState<ShortLink | null>(null);
  const [initialUrl, setInitialUrl] = useState("");
  const [linksCount, setLinksCount] = useState<number | undefined>(
    activePageContext.linksCount,
  );

  useEffect(() => {
    const syncCtx = () => {
      setLinksCount(activePageContext.linksCount);
    };
    syncCtx();
    contextListeners.add(syncCtx);
    return () => {
      contextListeners.delete(syncCtx);
    };
  }, []);

  useEffect(() => {
    const handleCommand = (cmd: DrawerCommand) => {
      switch (cmd.type) {
        case "open-create":
          setMode("create");
          setEditLink(null);
          setInitialUrl(cmd.initialUrl || "");
          setIsOpen(true);
          break;
        case "open-edit":
          setMode("edit");
          setEditLink(cmd.link);
          setInitialUrl("");
          setIsOpen(true);
          break;
        case "sync-list":
          setEditLink((prev) => {
            if (!prev) return null;
            return (
              cmd.links.find(
                (item) => item.id === prev.id || item.slug === prev.slug,
              ) || prev
            );
          });
          break;
        case "sync-editing":
          setEditLink((prev) =>
            prev && (prev.id === cmd.link.id || prev.slug === cmd.link.slug)
              ? cmd.link
              : prev,
          );
          break;
        case "close":
          setIsOpen(false);
          break;
      }
    };

    commandListeners.add(handleCommand);

    const onOpenDrawer = (e: Event) => {
      const url = (e as CustomEvent)?.detail?.initialUrl || "";
      setMode("create");
      setEditLink(null);
      setInitialUrl(url);
      setIsOpen(true);
    };
    const onCloseDrawer = () => setIsOpen(false);
    const onToggleDrawer = () => {
      setIsOpen((prev) => {
        if (!prev) {
          setMode("create");
          setEditLink(null);
          setInitialUrl("");
        }
        return !prev;
      });
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const hasCtrl = e.ctrlKey || e.metaKey;
      if (!hasCtrl) return;

      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const isRightKey =
        e.key === "ArrowRight" ||
        e.code === "ArrowRight" ||
        e.key === "ContextMenu";

      if (isRightKey) {
        if (isTyping && e.key !== "ContextMenu") {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("lshorter:toggle-create-drawer"));
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("lshorter:toggle-create-drawer"));
      }
    };

    const handleAuxClick = (e: MouseEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("lshorter:toggle-create-drawer"));
      }
    };

    window.addEventListener("lshorter:open-create-drawer", onOpenDrawer);
    window.addEventListener("lshorter:close-create-drawer", onCloseDrawer);
    window.addEventListener("lshorter:toggle-create-drawer", onToggleDrawer);
    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("auxclick", handleAuxClick);

    return () => {
      commandListeners.delete(handleCommand);
      window.removeEventListener("lshorter:open-create-drawer", onOpenDrawer);
      window.removeEventListener("lshorter:close-create-drawer", onCloseDrawer);
      window.removeEventListener(
        "lshorter:toggle-create-drawer",
        onToggleDrawer,
      );
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("auxclick", handleAuxClick);
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback(
    (result: ShortLink) => {
      if (mode === "edit") {
        activePageContext.onUpdated?.(result);
      } else {
        activePageContext.onCreated?.(result);
      }
    },
    [mode],
  );

  return (
    <LinkDrawer
      isOpen={isOpen}
      onClose={handleClose}
      mode={mode}
      link={mode === "edit" ? editLink : null}
      initialUrl={initialUrl}
      linksCount={linksCount}
      onSuccess={handleSuccess}
    />
  );
});

/**
 * Zero-DOM controller bridge for dashboard pages (LinksPage, PopulatedState).
 * Registers page-specific quota counts and callbacks with GlobalLinkDrawerHost
 * without mounting a duplicate LinkDrawer or re-rendering parent pages on open/close.
 */
export const PageLinkDrawers = React.memo(
  forwardRef<PageLinkDrawersHandle, PageLinkDrawersProps>(
    function PageLinkDrawers({ linksCount, onCreated, onUpdated }, ref) {
      useEffect(() => {
        updateActivePageContext({ linksCount, onCreated, onUpdated });
        return () => {
          updateActivePageContext({});
        };
      }, [linksCount, onCreated, onUpdated]);

      useImperativeHandle(
        ref,
        () => ({
          openCreate: (url = "") => {
            dispatchDrawerCommand({ type: "open-create", initialUrl: url });
          },
          openEdit: (link: ShortLink) => {
            dispatchDrawerCommand({ type: "open-edit", link });
          },
          syncLinksList: (links: ShortLink[]) => {
            dispatchDrawerCommand({ type: "sync-list", links });
          },
          syncLinkIfEditing: (updated: ShortLink) => {
            dispatchDrawerCommand({ type: "sync-editing", link: updated });
          },
          close: () => {
            dispatchDrawerCommand({ type: "close" });
          },
        }),
        [],
      );

      return null;
    },
  ),
);

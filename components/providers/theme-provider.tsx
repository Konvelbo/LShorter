"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "lshorter_theme_v2";
const LEGACY_STORAGE_KEY = "lshorter_theme";

/**
 * Lit le thème actuellement sauvegardé dans le stockage local ou la préférence système.
 */
function readSavedTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const saved =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    // ignore storage access issues
  }

  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // ignore media query issues
  }

  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

/**
 * Applique immédiatement le thème sur le DOM sans latence ni à-coups visuels.
 * Désactive temporairement les transitions CSS sur tous les éléments afin d'éviter
 * le freeze ou le recalcul lourd de styles sur des centaines de nœuds DOM simultanément.
 */
function applyThemeToDom(targetTheme: Theme, disableTransitions = true) {
  if (typeof document === "undefined") return;

  let styleEl: HTMLStyleElement | null = null;

  if (disableTransitions) {
    styleEl = document.createElement("style");
    styleEl.appendChild(
      document.createTextNode(
        `*, *::before, *::after {
          -webkit-transition: none !important;
          -moz-transition: none !important;
          -o-transition: none !important;
          -ms-transition: none !important;
          transition: none !important;
        }`
      )
    );
    document.head.appendChild(styleEl);
  }

  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(targetTheme);
  root.style.colorScheme = targetTheme;

  if (disableTransitions) {
    // Force un reflow synchrone pour que le changement s'applique dans le frame courant
    (() => window.getComputedStyle(root).opacity)();

    // Rétablit les transitions CSS normales au frame suivant
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (styleEl && styleEl.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
        }
      });
    });
  }

  // Sauvegarde dans les deux clés pour synchronisation totale de l'app
  try {
    localStorage.setItem(STORAGE_KEY, targetTheme);
    localStorage.setItem(LEGACY_STORAGE_KEY, targetTheme);
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(
      new CustomEvent("lshorter_theme_changed", { detail: targetTheme })
    );
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Synchronisation initiale côté client
  useEffect(() => {
    try {
      if (typeof Node === "function" && Node.prototype) {
        const proto = Node.prototype as any;
        if (!proto.__lshorterPatched) {
          proto.__lshorterPatched = true;
          const origRemove = Node.prototype.removeChild;
          Node.prototype.removeChild = function <T extends Node>(child: T): T {
            if (child && child.parentNode !== this) {
              return child;
            }
            return origRemove.apply(this, [child]) as T;
          };
          const origInsert = Node.prototype.insertBefore;
          Node.prototype.insertBefore = function <T extends Node>(
            newNode: T,
            referenceNode: Node | null
          ): T {
            if (referenceNode && referenceNode.parentNode !== this) {
              return this.appendChild(newNode);
            }
            return origInsert.apply(this, [newNode, referenceNode]) as T;
          };
        }
      }
    } catch {
      // ignore patch error
    }

    const initial = readSavedTheme();
    applyThemeToDom(initial, false);
    setThemeState(initial);

    // Écoute les modifications externes de thème (ex: autre onglet ou composant)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
        const val = e.newValue;
        if (val === "dark" || val === "light") {
          applyThemeToDom(val, true);
          setThemeState(val);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    applyThemeToDom(newTheme, true);
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    // Détermine le thème actif directement depuis l'état réel du DOM
    // pour éviter tout décalage d'état React ou double-clic rapide
    const isCurrentlyDark =
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark")
        : theme === "dark";
    const nextTheme: Theme = isCurrentlyDark ? "light" : "dark";

    // Si le navigateur prend en charge l'API View Transitions, offre une transition fluide
    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      try {
        (document as any).startViewTransition(() => {
          applyThemeToDom(nextTheme, false);
          setThemeState(nextTheme);
        });
        return;
      } catch {
        // Fallback standard si l'API échoue
      }
    }

    // Bascule instantanée à zéro latence avec verrouillage des transitions de transition
    applyThemeToDom(nextTheme, true);
    setThemeState(nextTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }

  return context;
}

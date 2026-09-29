"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  startTransition,
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

function readSavedTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // ignore storage access issues
  }

  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

/** Applique immédiatement le thème sur le DOM et persiste en localStorage.
 *  Ne déclenche PAS de re-render React — cela reste à la charge de l'appelant. */
function applyThemeToDom(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage write issues
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with "light" on SSR & initial client hydration to avoid React hydration mismatches
  const [theme, setThemeState] = useState<Theme>("light");

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
    applyThemeToDom(initial);
    if (initial !== "light") {
      setThemeState(initial);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    // 1. DOM & localStorage immédiats → la couleur change dans le même frame
    applyThemeToDom(newTheme);
    // 2. État React différé → les re-renders ne bloquent pas le changement visuel
    startTransition(() => setThemeState(newTheme));
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyThemeToDom(next);
    startTransition(() => setThemeState(next));
  };

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

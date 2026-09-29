"use client";

import { useState, useEffect } from "react";

let state = false;
let listeners: Array<(isOpen: boolean) => void> = [];

export const mobileMenuState = {
  get: () => state,
  set: (val: boolean) => {
    state = val;
    listeners.forEach((l) => l(val));
  },
  subscribe: (l: (isOpen: boolean) => void) => {
    listeners.push(l);
    return () => {
      listeners = listeners.filter((item) => item !== l);
    };
  },
};

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(state);

  useEffect(() => {
    return mobileMenuState.subscribe(setIsOpen);
  }, []);

  return {
    isOpen,
    setIsOpen: mobileMenuState.set,
    toggle: () => mobileMenuState.set(!state),
  };
}

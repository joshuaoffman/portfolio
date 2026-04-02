"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

export type OSName = "windows95" | "windowsxp" | "windows10";

export type OSContextValue = {
  activeOS: OSName | null;
  setActiveOS: (os: OSName) => void;
  // Backward-compatible aliases for existing components.
  activeOs: OSName | null;
  setActiveOs: (os: OSName) => void;
};

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  /** Default Windows 95; sessionStorage can override after hydrate (e.g. last theme from Settings). */
  const [activeOS, setActiveOSState] = useState<OSName | null>("windows95");

  useLayoutEffect(() => {
    const stored = window.sessionStorage.getItem("activeOS");
    if (stored === "windows95" || stored === "windowsxp" || stored === "windows10") {
      setActiveOSState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeOS) {
      window.sessionStorage.removeItem("activeOS");
      return;
    }
    window.sessionStorage.setItem("activeOS", activeOS);
  }, [activeOS]);

  const value = useMemo<OSContextValue>(
    () => ({
      activeOS,
      setActiveOS: (os: OSName) => setActiveOSState(os),
      activeOs: activeOS,
      setActiveOs: (os: OSName) => setActiveOSState(os),
    }),
    [activeOS]
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) {
    throw new Error("useOS must be used within OSProvider");
  }
  return ctx;
}

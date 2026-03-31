"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type OSName = "windows95" | "windowsxp" | "windows10" | "macos";

export type OSContextValue = {
  activeOs: OSName | null;
  setActiveOs: (os: OSName) => void;
};

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const [activeOs, setActiveOsState] = useState<OSName | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.sessionStorage.getItem("activeOs");
    if (stored === "windows95" || stored === "windowsxp" || stored === "windows10" || stored === "macos") {
      return stored;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeOs) {
      window.sessionStorage.removeItem("activeOs");
      return;
    }
    window.sessionStorage.setItem("activeOs", activeOs);
  }, [activeOs]);

  const value = useMemo<OSContextValue>(
    () => ({
      activeOs,
      setActiveOs: (os: OSName) => setActiveOsState(os),
    }),
    [activeOs]
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

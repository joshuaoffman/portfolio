"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type OSName = "windows95" | "windowsxp" | "windows10" | "macos";

export type OSContextValue = {
  activeOs: OSName | null;
  setActiveOs: (os: OSName) => void;
};

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const [activeOs, setActiveOsState] = useState<OSName | null>(null);

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

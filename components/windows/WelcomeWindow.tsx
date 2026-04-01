"use client";

import type { CSSProperties } from "react";
import type { OSName } from "@/lib/osContext";

type WelcomeWindowProps = {
  theme: OSName;
  onClose: () => void;
  onOpenResume: () => void;
};

function buttonStyles(theme: OSName): CSSProperties {
  const base: CSSProperties = {
    flex: 1,
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 11,
    padding: "6px 10px",
    cursor: "default",
    color: "#000000",
    boxSizing: "border-box",
  };

  if (theme === "windows10") {
    return {
      ...base,
      background: "#E1E1E1",
      borderTop: "1px solid #FFFFFF",
      borderLeft: "1px solid #FFFFFF",
      borderBottom: "1px solid #6B6B6B",
      borderRight: "1px solid #6B6B6B",
    };
  }

  // Windows 95 & Windows XP bevel
  return {
    ...base,
    background: "#C0C0C0",
    borderTop: "1px solid #FFFFFF",
    borderLeft: "1px solid #FFFFFF",
    borderBottom: "1px solid #808080",
    borderRight: "1px solid #808080",
  };
}

export default function WelcomeWindow({ theme, onClose, onOpenResume }: WelcomeWindowProps) {
  const divider = (
    <div style={{ height: 1, background: "#E0E0E0", width: "100%", flexShrink: 0 }} />
  );

  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        background: "#FFFFFF",
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#000000", lineHeight: 1.2, textTransform: "lowercase" }}>
        welcome to joof.dev
      </div>
      <div style={{ marginTop: 10 }}>{divider}</div>
      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: "#333333",
          lineHeight: 1.45,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          textTransform: "lowercase",
          flex: 1,
          minHeight: 0,
        }}
      >
        <span>this site is my portfolio — built like an os.</span>
        <span>click any icon on the desktop to explore.</span>
        <span>resume is one click away — just open resume.pdf</span>
        <span>
          you can switch the os anytime — click start at the bottom-left of the screen; it works the same on
          every theme.
        </span>
      </div>
      <div style={{ marginTop: 12 }}>{divider}</div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "row", gap: 10 }}>
        <button type="button" onClick={onOpenResume} style={buttonStyles(theme)}>
          open resume
        </button>
        <button type="button" onClick={onClose} style={buttonStyles(theme)}>
          close
        </button>
      </div>
    </div>
  );
}

import { useRouter } from "next/navigation";
import type { OSName } from "@/lib/osContext";
import { useOS } from "@/lib/osContext";

type SettingsPanelProps = {
  onClose?: () => void;
};

const OS_CHOICES: Array<{ id: OSName; label: string; description: string }> = [
  { id: "windows95", label: "Windows 95", description: "1995 — classic" },
  { id: "windowsxp", label: "Windows XP", description: "2001 — luna" },
  { id: "windows10", label: "Windows 10", description: "2015 — flat" },
  { id: "macos", label: "macOS", description: "2001–present — minimal" },
];

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const router = useRouter();
  const { activeOS, setActiveOS } = useOS();

  const panelTheme =
    activeOS === "windowsxp"
      ? { bg: "#2B6DBF", header: "linear-gradient(to right, #1F5FB5, #3A8FE8)" }
      : activeOS === "windows10"
        ? { bg: "#2A2A2A", header: "#1A1A1A" }
        : activeOS === "macos"
          ? { bg: "#2A2A2A", header: "#1E1E1E" }
          : { bg: "#C0C0C0", header: "linear-gradient(to right, #000080, #1084d0)" };

  return (
    <div
      style={{
        width: 190,
        background: panelTheme.bg,
        borderTop: "2px solid #FFFFFF",
        borderLeft: "2px solid #FFFFFF",
        borderBottom: "2px solid #000000",
        borderRight: "2px solid #000000",
        boxSizing: "border-box",
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div
        style={{
          height: 18,
          display: "flex",
          alignItems: "center",
          padding: "0 6px",
          background: panelTheme.header,
          color: "#FFFFFF",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        settings
      </div>

      <div style={{ padding: 6 }}>
        {OS_CHOICES.map((opt) => {
          const isActive = activeOS === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setActiveOS(opt.id);
                router.push("/desktop");
                onClose?.();
              }}
              style={{
                width: "100%",
                height: 34,
                marginBottom: 4,
                background: isActive ? "#000080" : "#C0C0C0",
                color: isActive ? "#FFFFFF" : "#000000",
                borderTop: "1px solid #FFFFFF",
                borderLeft: "1px solid #FFFFFF",
                borderBottom: "1px solid #808080",
                borderRight: "1px solid #808080",
                boxSizing: "border-box",
                textAlign: "left",
                padding: "2px 6px",
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 11,
                cursor: "default",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12 }}>{opt.label}</span>
                <span>{isActive ? "✓" : ""}</span>
              </div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>{opt.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

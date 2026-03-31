import { useRouter } from "next/navigation";
import type { OSName } from "@/lib/osContext";
import { useOS } from "@/lib/osContext";

type SettingsPanelProps = {
  onClose?: () => void;
};

const OS_CHOICES: Array<{ id: OSName; label: string }> = [
  { id: "windows95", label: "windows 95" },
  { id: "windowsxp", label: "windows xp" },
  { id: "windows10", label: "windows 10" },
  { id: "macos", label: "macos" },
];

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const router = useRouter();
  const { activeOs, setActiveOs } = useOS();

  return (
    <div
      style={{
        width: 190,
        background: "#C0C0C0",
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
          background: "linear-gradient(to right, #000080, #1084d0)",
          color: "#FFFFFF",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        settings
      </div>

      <div style={{ padding: 6 }}>
        {OS_CHOICES.map((opt) => {
          const isActive = activeOs === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setActiveOs(opt.id);
                router.push("/desktop");
                onClose?.();
              }}
              style={{
                width: "100%",
                height: 22,
                marginBottom: 4,
                background: isActive ? "#000080" : "#C0C0C0",
                color: isActive ? "#FFFFFF" : "#000000",
                borderTop: "1px solid #FFFFFF",
                borderLeft: "1px solid #FFFFFF",
                borderBottom: "1px solid #808080",
                borderRight: "1px solid #808080",
                boxSizing: "border-box",
                textAlign: "left",
                paddingLeft: 6,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 11,
                cursor: "default",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

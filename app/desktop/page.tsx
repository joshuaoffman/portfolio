"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import BootSequence from "@/components/BootSequence";
import { useOS } from "@/lib/osContext";
import Window from "@/components/Window";
import { useWindowManager } from "@/lib/windowManager";

export default function DesktopPage() {
  const { activeOs } = useOS();
  const [overlayPhase, setOverlayPhase] = useState<
    "boot" | "fading" | "desktop"
  >(() => (activeOs === "windows95" ? "boot" : "desktop"));

  useEffect(() => {
    setOverlayPhase(activeOs === "windows95" ? "boot" : "desktop");
  }, [activeOs]);

  const showBoot = activeOs === "windows95" && overlayPhase !== "desktop";

  const TASKBAR_HEIGHT_PX = 28;
  const WINDOW_DEFAULT_SIZE = { width: 400, height: 300 };

  const desktopAreaRef = useRef<HTMLDivElement | null>(null);
  const [desktopArea, setDesktopArea] = useState(() => ({
    width: 1000,
    height: 700,
  }));

  useEffect(() => {
    if (!desktopAreaRef.current) return;
    const el = desktopAreaRef.current;

    const update = () => {
      setDesktopArea({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  const clockText = useClockText();

  const windowTitles = useMemo(
    () => ({
      about: "about.txt",
      projects: "projects",
      experience: "experience",
      education: "education",
      resume: "resume.pdf",
      contact: "contact",
      hobbies: "hobbies",
      settings: "settings",
    }),
    []
  );

  const {
    openWindows,
    focusedWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    moveWindow,
    clampAllWindowsToDesktop,
  } = useWindowManager({
    desktopArea,
    windowTitles,
    defaultWindowSize: WINDOW_DEFAULT_SIZE,
  });

  useEffect(() => {
    clampAllWindowsToDesktop();
  }, [desktopArea, clampAllWindowsToDesktop]);

  const ICONS = useMemo(
    () =>
      [
        { id: "about", label: "about.txt", iconKind: "folder" as const },
        { id: "projects", label: "projects", iconKind: "folder" as const },
        { id: "experience", label: "experience", iconKind: "folder" as const },
        { id: "education", label: "education", iconKind: "folder" as const },
        { id: "resume", label: "resume.pdf", iconKind: "file" as const },
        { id: "contact", label: "contact", iconKind: "envelope" as const },
        { id: "hobbies", label: "hobbies", iconKind: "folder" as const },
        { id: "settings", label: "settings", iconKind: "control" as const },
      ] as const,
    []
  );

  type IconKind = (typeof ICONS)[number]["iconKind"];

  const [iconPositions] = useState(() => {
    const PRNG_SEED = 1995;
    const cols = 4;
    const rows = 3;
    const safeLeftMinPct = 2;
    const safeLeftMaxPct = 88;
    const safeTopMinPct = 2;
    const safeTopMaxPct = 78;

    const iconBoxWpx = 96; // matches rendered icon container width
    const iconBoxHpx = 58; // icon (32) + label area (approx)
    const overlapMarginPx = 6;

    // Deterministic PRNG so first-load placement is seeded.
    function mulberry32(seed: number) {
      let t = seed >>> 0;
      return function rng() {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rng = mulberry32(PRNG_SEED);

    function shuffleInPlace<T>(arr: T[]) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    const safeLeftSpanPct = safeLeftMaxPct - safeLeftMinPct;
    const safeTopSpanPct = safeTopMaxPct - safeTopMinPct;
    const cellW = safeLeftSpanPct / cols;
    const cellH = safeTopSpanPct / rows;

    type Cell = { c: number; r: number };
    const availableCells: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip bottom-right cell.
        if (r === rows - 1 && c === cols - 1) continue;
        availableCells.push({ r, c });
      }
    }

    shuffleInPlace(availableCells);
    const chosenCells = availableCells.slice(0, ICONS.length);

    const rects: Array<{ id: string; leftPx: number; topPx: number; rightPx: number; bottomPx: number }> = [];
    const placements: Record<string, { leftPct: number; topPct: number }> = {};

    function overlaps(a: { leftPx: number; topPx: number; rightPx: number; bottomPx: number }, b: typeof a) {
      return (
        a.leftPx < b.rightPx &&
        a.rightPx > b.leftPx &&
        a.topPx < b.bottomPx &&
        a.bottomPx > b.topPx
      );
    }

    for (let i = 0; i < ICONS.length; i++) {
      const icon = ICONS[i];
      const cell = chosenCells[i];

      const centerLeftPct = safeLeftMinPct + cellW * (cell.c + 0.5);
      const centerTopPct = safeTopMinPct + cellH * (cell.r + 0.5);

      let placed = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        // Offset within cell by up to 40% (center +/- 20% cell width).
        const cellOffsetX = (rng() - 0.5) * 0.4 * cellW;
        const cellOffsetY = (rng() - 0.5) * 0.4 * cellH;
        let leftPct = centerLeftPct + cellOffsetX;
        let topPct = centerTopPct + cellOffsetY;

        // Extra jitter in px, converted to pct to stay in bound space.
        const jitterXPx = rng() * 60 - 30;
        const jitterYPx = rng() * 60 - 30;
        leftPct += (jitterXPx / desktopArea.width) * 100;
        topPct += (jitterYPx / desktopArea.height) * 100;

        leftPct = clamp(leftPct, safeLeftMinPct, safeLeftMaxPct);
        topPct = clamp(topPct, safeTopMinPct, safeTopMaxPct);

        const leftPx = (leftPct / 100) * desktopArea.width;
        const topPx = (topPct / 100) * desktopArea.height;

        const candidate = {
          id: icon.id,
          leftPx: leftPx - overlapMarginPx,
          topPx: topPx - overlapMarginPx,
          rightPx: leftPx + iconBoxWpx + overlapMarginPx,
          bottomPx: topPx + iconBoxHpx + overlapMarginPx,
        };

        const anyOverlap = rects.some((r) => overlaps(candidate, r));
        if (anyOverlap) continue;

        placements[icon.id] = { leftPct, topPct };
        rects.push(candidate);
        placed = true;
        break;
      }

      // Fallback: if we failed to find a non-overlapping placement, still place something.
      if (!placed) {
        const leftPct = clamp(centerLeftPct, safeLeftMinPct, safeLeftMaxPct);
        const topPct = clamp(centerTopPct, safeTopMinPct, safeTopMaxPct);
        placements[icon.id] = { leftPct, topPct };
      }
    }

    return placements;
  });

  const [openingRect, setOpeningRect] = useState<null | {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  }>(null);
  const openAnimTokenRef = useRef(0);

  const startOpenAnimationAndOpen = (iconId: string) => {
    if (activeOs !== "windows95") return;

    const token = ++openAnimTokenRef.current;

    const ICON_SIZE = 32;
    const pos = iconPositions[iconId];
    if (!pos) return;
    const iconX = Math.round((desktopArea.width * pos.leftPct) / 100);
    const iconY = Math.round((desktopArea.height * pos.topPct) / 100);

    const existing = openWindows.find((w) => w.id === iconId) ?? null;

    // If the window is already on-screen, just focus it.
    if (existing && !existing.minimized) {
      setSelectedIconId(iconId);
      focusWindow(iconId);
      return;
    }

    const defaultCentered = (() => {
      const x = Math.round((desktopArea.width - WINDOW_DEFAULT_SIZE.width) / 2);
      const y = Math.round((desktopArea.height - WINDOW_DEFAULT_SIZE.height) / 2);

      return {
        x: clamp(x, 0, Math.max(0, desktopArea.width - WINDOW_DEFAULT_SIZE.width)),
        y: clamp(y, 0, Math.max(0, desktopArea.height - WINDOW_DEFAULT_SIZE.height)),
        width: WINDOW_DEFAULT_SIZE.width,
        height: WINDOW_DEFAULT_SIZE.height,
      };
    })();

    const finalRect = existing
      ? { x: existing.position.x, y: existing.position.y, width: existing.size.width, height: existing.size.height }
      : defaultCentered;

    setSelectedIconId(iconId);
    setOpeningRect({ x: iconX, y: iconY, width: ICON_SIZE, height: ICON_SIZE, visible: true });

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const stepAt = (ms: number, step: 2 | 3 | 4) => {
      window.setTimeout(() => {
        if (openAnimTokenRef.current !== token) return;

        const t = step === 2 ? 1 / 3 : step === 3 ? 2 / 3 : 1;
        if (step < 4) {
          setOpeningRect({
            x: Math.round(lerp(iconX, finalRect.x, t)),
            y: Math.round(lerp(iconY, finalRect.y, t)),
            width: Math.round(lerp(ICON_SIZE, finalRect.width, t)),
            height: Math.round(lerp(ICON_SIZE, finalRect.height, t)),
            visible: true,
          });
          return;
        }

        // Step 4: instantly remove rectangle and render the window.
        setOpeningRect(null);
        openWindow(iconId);
      }, ms);
    };

    stepAt(30, 2);
    stepAt(60, 3);
    stepAt(90, 4);
  };

  // Prevent TS complaining about the helper; this file needs its own clamp.
  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        backgroundColor: "#008080",
        color: "#FFFFFF",
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      {/* Desktop area (excludes taskbar) */}
      <div
        ref={desktopAreaRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: TASKBAR_HEIGHT_PX,
          overflow: "hidden",
        }}
        onPointerDown={() => {
          setSelectedIconId(null);
        }}
      >
        {/* Windows layer */}
        <div style={{ position: "absolute", inset: 0 }}>
          {openWindows
            .filter((w) => !w.minimized)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((win) => (
              <Window
                key={win.id}
                win={win}
                desktopConstraintsRef={desktopAreaRef}
                titleIcon={<DesktopIconSvg kind={iconKindFromId(win.id)} selected={false} scale={16} />}
                onFocus={() => focusWindow(win.id)}
                onClose={() => {
                  closeWindow(win.id);
                }}
                onMinimize={() => minimizeWindow(win.id)}
                onMaximize={() => maximizeWindow(win.id)}
                onMove={(x, y) => moveWindow(win.id, x, y)}
              />
            ))}
        </div>

        {/* Opening dashed rectangle (4-step animation) */}
        {openingRect?.visible ? (
          <div
            style={{
              position: "absolute",
              left: openingRect.x,
              top: openingRect.y,
              width: openingRect.width,
              height: openingRect.height,
              border: "1px dashed #000000",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        ) : null}

        {/* Desktop icons */}
        {ICONS.map((icon) => {
          const pos = iconPositions[icon.id];
          const iconX = Math.round((desktopArea.width * pos.leftPct) / 100);
          const iconY = Math.round((desktopArea.height * pos.topPct) / 100);
          const isSelected = selectedIconId === icon.id;

          // Label is centered below the icon.
          const labelWidth = 96;

          return (
            <div
              key={icon.id}
              style={{
                position: "absolute",
                left: iconX,
                top: iconY,
                width: 96,
                userSelect: "none",
                textAlign: "center",
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedIconId(icon.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startOpenAnimationAndOpen(icon.id);
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "default",
                }}
              >
                <DesktopIconSvg kind={icon.iconKind} selected={isSelected} scale={32} />
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 32 + 2,
                  width: labelWidth,
                  paddingLeft: 0,
                  paddingRight: 0,
                  fontSize: 11,
                  lineHeight: "12px",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    backgroundColor: isSelected ? "#000080" : "transparent",
                    color: "#FFFFFF",
                    padding: "0 2px",
                    maxWidth: labelWidth,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    textOverflow: "ellipsis",
                  }}
                >
                  {icon.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Taskbar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: TASKBAR_HEIGHT_PX,
          backgroundColor: "#C0C0C0",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
          borderTop: "2px solid #FFFFFF",
          paddingLeft: 0,
          paddingRight: 0,
          fontFamily: '"IBM Plex Mono", monospace',
        }}
      >
        <DesktopTaskbar
          TASKBAR_HEIGHT_PX={TASKBAR_HEIGHT_PX}
          openWindows={openWindows}
          focusedWindowId={focusedWindowId}
          windowTitles={windowTitles}
          onStart={() => {}}
          onTaskbarButton={(id) => {
            const w = openWindows.find((x) => x.id === id);
            if (!w) return;
            if (w.minimized) openWindow(id);
            else focusWindow(id);
          }}
          clockText={clockText}
        />
      </div>

      {/* Boot overlay */}
      {showBoot ? (
        <motion.div
          style={{ position: "absolute", inset: 0 }}
          initial={false}
          animate={{ opacity: overlayPhase === "fading" ? 0 : 1 }}
          transition={{ duration: 0.3, ease: "linear" }}
        >
          <BootSequence
            os={activeOs}
            onComplete={() => {
              setOverlayPhase("fading");
              window.setTimeout(() => setOverlayPhase("desktop"), 300);
            }}
          />
        </motion.div>
      ) : null}
    </div>
  );
}

function useClockText() {
  const [text, setText] = useState(() => formatWin95Time(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setText(formatWin95Time(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  return text;
}

function formatWin95Time(d: Date) {
  const hours24 = d.getHours();
  const hour12 = hours24 % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours24 < 12 ? "AM" : "PM";
  return `${hour12}:${minutes} ${ampm}`;
}

function DesktopTaskbar({
  TASKBAR_HEIGHT_PX,
  openWindows,
  focusedWindowId,
  windowTitles,
  onStart,
  onTaskbarButton,
  clockText,
}: {
  TASKBAR_HEIGHT_PX: number;
  openWindows: Array<{
    id: string;
    minimized: boolean;
    zIndex: number;
    maximized: boolean;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
  focusedWindowId: string | null;
  windowTitles: Record<string, string>;
  onStart: () => void;
  onTaskbarButton: (id: string) => void;
  clockText: string;
}) {
  const [startPressed, setStartPressed] = useState(false);

  return (
    <>
      {/* Start button (far left) */}
      <div style={{ position: "relative", width: 54, height: TASKBAR_HEIGHT_PX, flex: "0 0 auto" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 3,
            width: 54,
            height: 22,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderBottom: `1px solid ${startPressed ? "#808080" : "#000000"}`,
              borderRight: `1px solid ${startPressed ? "#808080" : "#000000"}`,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 1,
                bottom: 1,
                backgroundColor: "#C0C0C0",
                borderTop: `1px solid ${startPressed ? "#808080" : "#FFFFFF"}`,
                borderLeft: `1px solid ${startPressed ? "#808080" : "#FFFFFF"}`,
                borderBottom: `1px solid ${startPressed ? "#FFFFFF" : "#808080"}`,
                borderRight: `1px solid ${startPressed ? "#FFFFFF" : "#808080"}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 700,
                fontSize: 11,
                color: "#000000",
                transform: `translate(${startPressed ? 1 : 0}px, ${startPressed ? 1 : 0}px)`,
              }}
            >
              <span aria-hidden>⊞ Start</span>
              <span style={{ marginLeft: 2 }} aria-hidden>
                {/* keep placeholder spacing */}
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Start"
            onPointerDown={() => {
              setStartPressed(true);
              onStart();
            }}
            onPointerUp={() => setStartPressed(false)}
            onPointerCancel={() => setStartPressed(false)}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "default",
            }}
          />
        </div>
      </div>

      {/* Middle window buttons */}
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          gap: 0,
        }}
      >
        {openWindows
          .slice()
          .sort((a, b) => b.zIndex - a.zIndex)
          .map((w) => {
            const isFocused = w.id === focusedWindowId;
            const title = windowTitles[w.id] ?? w.title ?? w.id;
            return (
              <div
                key={w.id}
                role="button"
                aria-label={`Taskbar ${title}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTaskbarButton(w.id);
                }}
                style={{
                  height: 22,
                  maxWidth: 160,
                  flex: "0 0 auto",
                  marginLeft: 2,
                  marginRight: 2,
                  backgroundColor: "#C0C0C0",
                  boxSizing: "border-box",
                  borderTop: `1px solid ${isFocused ? "#808080" : "#FFFFFF"}`,
                  borderLeft: `1px solid ${isFocused ? "#808080" : "#FFFFFF"}`,
                  borderBottom: `1px solid ${isFocused ? "#FFFFFF" : "#808080"}`,
                  borderRight: `1px solid ${isFocused ? "#FFFFFF" : "#808080"}`,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 4,
                  paddingRight: 4,
                  cursor: "default",
                }}
              >
                <div style={{ width: 16, height: 16, flex: "0 0 auto" }}>
                  <DesktopIconSvg kind={iconKindFromId(w.id)} selected={false} scale={16} />
                </div>
                <div
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#000000",
                    marginLeft: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 120,
                    lineHeight: "12px",
                  }}
                >
                  {title}
                </div>
              </div>
            );
          })}
      </div>

      {/* System tray (far right) */}
      <div style={{ width: 160, flex: "0 0 auto", display: "flex", justifyContent: "flex-end", paddingRight: 6 }}>
        <div
          style={{
            height: TASKBAR_HEIGHT_PX,
            display: "flex",
            alignItems: "center",
            padding: "0 6px",
            boxSizing: "border-box",
            borderTop: "1px solid #808080",
            borderLeft: "1px solid #808080",
            borderBottom: "1px solid #FFFFFF",
            borderRight: "1px solid #FFFFFF",
          }}
        >
          <div style={{ width: 8, height: 8, marginRight: 6 }}>
            <SpeakerIcon />
          </div>
          <div
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              color: "#000000",
              whiteSpace: "nowrap",
            }}
          >
            {clockText}
          </div>
        </div>
      </div>
    </>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 8 8" width="8" height="8" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <polygon points="1,3 4.5,3 6.5,1.5 6.5,6.5 4.5,5 1,5" fill="#000000" />
    </svg>
  );
}

function iconKindFromId(id: string): "folder" | "file" | "envelope" | "control" {
  if (id === "about" || id === "projects" || id === "experience" || id === "education" || id === "hobbies") return "folder";
  if (id === "resume") return "file";
  if (id === "contact") return "envelope";
  return "control";
}

function DesktopIconSvg({
  kind,
  selected,
  scale,
}: {
  kind: "folder" | "file" | "envelope" | "control";
  selected: boolean;
  scale: 32 | 16;
}) {
  const common = {
    viewBox: "0 0 32 32",
    width: scale,
    height: scale,
    shapeRendering: "crispEdges" as const,
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (kind === "folder") {
    return (
      <svg {...common}>
        {/* body */}
        <rect x="1" y="7" width="28" height="24" fill="#FFCC00" stroke="#000000" strokeWidth="1" />
        {/* tab (top-left) */}
        <rect x="4" y="4" width="14" height="5" fill="#FFCC00" stroke="#000000" strokeWidth="1" />
        {/* inner shadow line */}
        <rect x="2" y="8" width="26" height="1" fill="#E6A800" />
        {/* highlight */}
        <rect x="3" y="9" width="11" height="6" fill="#FFE566" />
      </svg>
    );
  }

  if (kind === "file") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="26" height="24" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
        {/* fold */}
        <polygon points="20,4 29,4 29,13" fill="#C0C0C0" stroke="#000000" strokeWidth="1" />
        <polygon points="20,4 20,13 29,13" fill="#FFFFFF" stroke="none" />
        {/* folded corner detail */}
        <polygon points="20,4 29,4 29,13" fill="#808080" opacity="0.5" />
        {/* text lines */}
        <rect x="6" y="12" width="14" height="1" fill="#C0C0C0" />
        <rect x="6" y="16" width="18" height="1" fill="#C0C0C0" />
        <rect x="6" y="20" width="12" height="1" fill="#C0C0C0" />
      </svg>
    );
  }

  if (kind === "envelope") {
    return (
      <svg {...common}>
        <rect x="3" y="9" width="26" height="18" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
        {/* V flap */}
        <polyline points="5,11 16,20 27,11" fill="none" stroke="#000000" strokeWidth="1" />
        <polyline points="5,11 16,18 27,11" fill="none" stroke="#C0C0C0" strokeWidth="1" />
        {/* shadow */}
        <rect x="3" y="25" width="26" height="1" fill="#808080" opacity="0.6" />
      </svg>
    );
  }

  // control panel
  return (
    <svg {...common}>
      <rect x="4" y="4" width="24" height="24" fill="#C0C0C0" stroke="#000000" strokeWidth="1" />
      <rect x="10" y="10" width="8" height="8" fill="#FF0000" />
      <rect x="20" y="10" width="8" height="8" fill="#FFFF00" />
      <rect x="10" y="20" width="8" height="8" fill="#00FF00" />
      <rect x="20" y="20" width="8" height="8" fill="#0000FF" />
    </svg>
  );
}

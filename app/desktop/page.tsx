"use client";

import { motion } from "framer-motion";
import type { ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import BootSequence from "@/components/BootSequence";
import { useOS, type OSName } from "@/lib/osContext";
import { useWindowManager, type Win95Window } from "@/lib/windowManager";
import Window from "@/components/Window";
import ResumeWindow from "@/components/windows/ResumeWindow";
import HobbiesWindow from "@/components/windows/HobbiesWindow";
import SettingsPanel from "@/components/SettingsPanel";

export default function DesktopPage() {
  const { activeOs } = useOS();
  const [bootComplete, setBootComplete] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setBootComplete(false);
    setSettingsOpen(false);
  }, [activeOs]);

  const showBoot = activeOs !== null && !bootComplete;

  const TASKBAR_HEIGHT_PX = 28;
  const WINDOW_DEFAULT_SIZE = { width: 480, height: 320 };
  const RESUME_WINDOW_SIZE = { width: 680, height: 520 };

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
  const [selectedIconIdNon95, setSelectedIconIdNon95] = useState<string | null>(null);

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

  type LocalWin = {
    id: string;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
    minimized: boolean;
    maximized: boolean;
    restore?: { position: { x: number; y: number }; size: { width: number; height: number } };
  };

  const [openWindows, setOpenWindows] = useState<LocalWin[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const nextZRef = useRef(10);
  const cascadeCountRef = useRef(0);

  const centerRect = () => {
    const x = Math.round((desktopArea.width - WINDOW_DEFAULT_SIZE.width) / 2);
    const y = Math.round((desktopArea.height - WINDOW_DEFAULT_SIZE.height) / 2);
    return {
      x: clamp(x, 0, Math.max(0, desktopArea.width - WINDOW_DEFAULT_SIZE.width)),
      y: clamp(y, 0, Math.max(0, desktopArea.height - WINDOW_DEFAULT_SIZE.height)),
      width: WINDOW_DEFAULT_SIZE.width,
      height: WINDOW_DEFAULT_SIZE.height,
    };
  };

  const focusWindow = (id: string) => {
    const nextZ = nextZRef.current + 1;
    nextZRef.current = nextZ;
    setOpenWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ } : w)));
    setFocusedWindowId(id);
  };

  const closeWindow = (id: string) => {
    setOpenWindows((prev) => prev.filter((w) => w.id !== id));
    setFocusedWindowId((prev) => (prev === id ? null : prev));
  };

  const minimizeWindow = (id: string) => {
    setOpenWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
    setFocusedWindowId((prev) => (prev === id ? null : prev));
  };

  const maximizeWindow = (id: string) => {
    setOpenWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const nextZ = nextZRef.current + 1;
        nextZRef.current = nextZ;

        if (!w.maximized) {
          return {
            ...w,
            zIndex: nextZ,
            minimized: false,
            maximized: true,
            restore: { position: w.position, size: w.size },
            position: { x: 0, y: 0 },
            size: { width: desktopArea.width, height: desktopArea.height },
          };
        }

        const restoredPos = w.restore?.position ?? centerRect();
        const restoredSize = w.restore?.size ?? WINDOW_DEFAULT_SIZE;
        return {
          ...w,
          zIndex: nextZ,
          minimized: false,
          maximized: false,
          restore: undefined,
          position: {
            x: clamp(restoredPos.x, 0, Math.max(0, desktopArea.width - restoredSize.width)),
            y: clamp(restoredPos.y, 0, Math.max(0, desktopArea.height - restoredSize.height)),
          },
          size: restoredSize,
        };
      })
    );
    focusWindow(id);
  };

  const moveWindow = (id: string, x: number, y: number) => {
    setOpenWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.minimized) return w;
        if (w.maximized) return w;
        return {
          ...w,
          position: {
            x: clamp(x, 0, Math.max(0, desktopArea.width - w.size.width)),
            y: clamp(y, 0, Math.max(0, desktopArea.height - w.size.height)),
          },
        };
      })
    );
  };

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

  const {
    openWindows: themedOpenWindows,
    focusedWindowId: themedFocusedWindowId,
    openWindow: themedOpenWindow,
    closeWindow: themedCloseWindow,
    focusWindow: themedFocusWindow,
    minimizeWindow: themedMinimizeWindow,
    maximizeWindow: themedMaximizeWindow,
    moveWindow: themedMoveWindow,
    clampAllWindowsToDesktop: themedClampAllWindowsToDesktop,
  } = useWindowManager({
    desktopArea,
    windowTitles,
    defaultWindowSize: { width: 480, height: 320 },
  });

  useEffect(() => {
    if (activeOs === "windows95") return;
    themedClampAllWindowsToDesktop();
  }, [activeOs, desktopArea, themedClampAllWindowsToDesktop]);

  const startOpenAnimationAndOpen = (iconId: string) => {
    if (activeOs !== "windows95") return;

    const token = ++openAnimTokenRef.current;

    const ICON_SIZE = 32;
    const pos = iconPositions[iconId];
    if (!pos) return;
    const iconX = Math.round((desktopArea.width * pos.leftPct) / 100);
    const iconY = Math.round((desktopArea.height * pos.topPct) / 100);

    const existing = openWindows.find((w) => w.id === iconId) ?? null;

    // If already open: unminimize + focus (no duplicate).
    if (existing) {
      setSelectedIconId(iconId);
      if (existing.minimized) {
        setOpenWindows((prev) =>
          prev.map((w) => (w.id === iconId ? { ...w, minimized: false } : w))
        );
      }
      focusWindow(iconId);
      return;
    }

    const isResume = iconId === "resume";
    const base = isResume
      ? {
          x: clamp(
            Math.round((desktopArea.width - RESUME_WINDOW_SIZE.width) / 2),
            0,
            Math.max(0, desktopArea.width - RESUME_WINDOW_SIZE.width)
          ),
          y: clamp(
            Math.round((desktopArea.height - RESUME_WINDOW_SIZE.height) / 2),
            0,
            Math.max(0, desktopArea.height - RESUME_WINDOW_SIZE.height)
          ),
          width: RESUME_WINDOW_SIZE.width,
          height: RESUME_WINDOW_SIZE.height,
        }
      : centerRect();
    const cascadeN = cascadeCountRef.current;
    cascadeCountRef.current = cascadeN + 1;
    const finalRect = {
      x: clamp(base.x + cascadeN * 24, 0, Math.max(0, desktopArea.width - base.width)),
      y: clamp(base.y + cascadeN * 24, 0, Math.max(0, desktopArea.height - base.height)),
      width: base.width,
      height: base.height,
    };

    setSelectedIconId(iconId);
    setOpeningRect({ x: iconX, y: iconY, width: ICON_SIZE, height: ICON_SIZE, visible: true });

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const stepAt = (ms: number, t: number, isFinal: boolean) => {
      window.setTimeout(() => {
        if (openAnimTokenRef.current !== token) return;
        if (!isFinal) {
          setOpeningRect({
            x: Math.round(lerp(iconX, finalRect.x, t)),
            y: Math.round(lerp(iconY, finalRect.y, t)),
            width: Math.round(lerp(ICON_SIZE, finalRect.width, t)),
            height: Math.round(lerp(ICON_SIZE, finalRect.height, t)),
            visible: true,
          });
          return;
        }

        // Step 4: instantly remove rectangle and snap window into existence.
        setOpeningRect(null);
        const nextZ = nextZRef.current + 1;
        nextZRef.current = nextZ;
        setOpenWindows((prev) => [
          ...prev,
          {
            id: iconId,
            title: windowTitles[iconId] ?? iconId,
            position: { x: finalRect.x, y: finalRect.y },
            size: { width: finalRect.width, height: finalRect.height },
            zIndex: nextZ,
            minimized: false,
            maximized: false,
          },
        ]);
        setFocusedWindowId(iconId);
      }, ms);
    };

    // 4 steps, 30ms apart, pure linear interpolation.
    stepAt(30, 0.25, false);
    stepAt(60, 0.5, false);
    stepAt(90, 0.75, false);
    stepAt(120, 1, true);
  };

  // Prevent TS complaining about the helper; this file needs its own clamp.
  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  if (activeOs && activeOs !== "windows95") {
    const isXP = activeOs === "windowsxp";
    const isW10 = activeOs === "windows10";
    const isMac = activeOs === "macos";
    const taskbarOrDockHeight = isMac ? 64 : isW10 ? 40 : 30;
    const topInset = isMac ? 24 : 0;
    const desktopBg = isXP ? "#2B5797" : isW10 ? "#1A1A1A" : "#1E1E1E";

    const iconSize = isMac ? 48 : 32;
    const iconLabelSelectedBg = isXP
      ? "rgba(0,0,128,0.65)"
      : isW10
        ? "rgba(0,120,215,0.65)"
        : "rgba(10,132,255,0.6)";

    const openFromIcon = (iconId: string) => {
      if (iconId === "settings") {
        setSettingsOpen(true);
        return;
      }
      setSelectedIconIdNon95(iconId);
      themedOpenWindow(iconId);
    };

    const renderContent = (id: string) => {
      if (id === "resume") {
        return (
          <iframe
            src="/Offman_Joshua_Resume.pdf"
            title="resume pdf"
            style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          />
        );
      }
      if (id === "hobbies") {
        return (
          <div style={{ width: "100%", height: "100%", overflowY: "auto", background: "#fff", padding: 8, boxSizing: "border-box" }}>
            {[
              ["photography", "street, nature, anything that looks interesting. (@joofpics on instagram)"],
              ["the gym", "not a science based lifter (sorry not sorry)"],
              ["piano", "self taught, not very good but i try to have fun"],
              ["sports", "avid toronto raptors jamal shead fan"],
              ["building things", "a lot of unfinished projects haha"],
            ].map(([name, detail]) => (
              <div key={name} style={{ marginBottom: 8, fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#333" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#000" }}>{name}</div>
                <div>{detail}</div>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: "#000000", padding: 8 }}>
          [content coming soon]
        </div>
      );
    };

    return (
      <div
        className="h-screen w-screen overflow-hidden relative"
        style={{
          backgroundColor: desktopBg,
          color: "#fff",
          fontFamily: '"IBM Plex Mono", monospace',
        }}
      >
        {isMac ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 24,
              background: "rgba(30,30,30,0.85)",
              borderBottom: "1px solid #3A3A3A",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              boxSizing: "border-box",
              zIndex: 30,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                <path
                  d="M9 2c1-2 1-2 1-2-2 0-3 1-4 2-1 1-1 2-1 2 2 0 3-1 4-2ZM7 4C4 4 2 6 2 9c0 2 1 4 2 6 1 1 2 1 3 1s1-1 2-1 1 1 2 1c1 0 2-1 3-3-2-1-2-5 1-6-1-2-2-3-4-3-1 0-2 1-3 1s-1-1-2-1Z"
                  fill="#FFFFFF"
                />
              </svg>
              <span>Finder</span>
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
              <span>Go</span>
              <span>Window</span>
              <span>Help</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 6a6 6 0 0 1 12 0" stroke="#fff"/><path d="M4 8a4 4 0 0 1 8 0" stroke="#fff"/></svg>
              <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="5" width="10" height="6" stroke="#fff"/><rect x="12" y="7" width="2" height="2" fill="#fff"/></svg>
              <span>{clockText}</span>
            </div>
          </div>
        ) : null}

        <div
          ref={desktopAreaRef}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: topInset,
            bottom: taskbarOrDockHeight,
            display: "flex",
            overflow: "hidden",
          }}
          onPointerDown={() => setSelectedIconIdNon95(null)}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            {themedOpenWindows
              .filter((w) => !w.minimized)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((win) => (
                <ThemedWindow
                  key={win.id}
                  win={win}
                  theme={activeOs}
                  focused={themedFocusedWindowId === win.id}
                  desktopConstraintsRef={desktopAreaRef}
                  onFocus={() => themedFocusWindow(win.id)}
                  onClose={() => themedCloseWindow(win.id)}
                  onMinimize={() => themedMinimizeWindow(win.id)}
                  onMaximize={() => themedMaximizeWindow(win.id)}
                  onMove={(x, y) => themedMoveWindow(win.id, x, y)}
                >
                  {renderContent(win.id)}
                </ThemedWindow>
              ))}
          </div>

          {ICONS.map((icon) => {
            const pos = iconPositions[icon.id];
            const x = Math.round((desktopArea.width * pos.leftPct) / 100);
            const y = Math.round((desktopArea.height * pos.topPct) / 100);
            const selected = selectedIconIdNon95 === icon.id;

            return (
              <div
                key={icon.id}
                style={{ position: "absolute", left: x, top: y, width: isMac ? 72 : 96, userSelect: "none" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  openFromIcon(icon.id);
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: iconSize,
                      height: iconSize,
                      background: isMac ? "#2A2A2A" : "transparent",
                      borderRadius: isMac ? 8 : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DesktopIconSvg kind={icon.iconKind} selected={false} scale={isMac ? 16 : 32} />
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#fff",
                      textAlign: "center",
                      background: selected ? iconLabelSelectedBg : "transparent",
                      padding: "0 2px",
                      maxWidth: 90,
                    }}
                  >
                    {icon.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isXP ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 30, display: "flex", alignItems: "center", background: "linear-gradient(to right, #1F5FB5, #3A8FE8)", borderTop: "1px solid #0A3D82" }}>
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              style={{
                width: 54,
                height: 26,
                marginLeft: 2,
                borderTop: "1px solid #6FD45A",
                borderLeft: "1px solid #6FD45A",
                borderBottom: "1px solid #236A13",
                borderRight: "1px solid #236A13",
                background: "linear-gradient(to right, #4AAF3C, #39881C)",
                borderRadius: "0 12px 12px 0",
                color: "#fff",
                textShadow: "1px 1px #000",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <StartFlagIcon />
              start
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, paddingLeft: 6, overflow: "hidden" }}>
              {themedOpenWindows.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    if (w.minimized) themedOpenWindow(w.id);
                    themedFocusWindow(w.id);
                  }}
                  style={{
                    height: 22,
                    minWidth: 120,
                    maxWidth: 180,
                    background: themedFocusedWindowId === w.id ? "#1A4E9A" : "#2B6DBF",
                    border: `1px solid ${themedFocusedWindowId === w.id ? "#0A3070" : "#1A4E9A"}`,
                    color: "#fff",
                    fontSize: 10,
                    padding: "0 6px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {w.title}
                </button>
              ))}
            </div>
            <div style={{ height: "100%", padding: "0 8px", display: "flex", alignItems: "center", background: "#1A5DAA", borderLeft: "1px solid #0A3D82", color: "#fff", fontSize: 10, gap: 6 }}>
              <SpeakerIcon />
              <span>{clockText}</span>
            </div>
          </div>
        ) : null}

        {isW10 ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, display: "flex", alignItems: "center", background: "#1A1A1A" }}>
            <button type="button" onClick={() => setSettingsOpen((v) => !v)} style={{ width: 48, height: 40, background: "transparent", border: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" shapeRendering="crispEdges"><path d="M0 0H8L9 8H0Z" fill="#F25022"/><path d="M10 0H18V8H11Z" fill="#7FBA00"/><path d="M0 10H8L9 18H0Z" fill="#00A4EF"/><path d="M10 10H18V18H11Z" fill="#FFB900"/></svg>
            </button>
            <div style={{ width: 200, height: 28, background: "#2A2A2A", border: "1px solid #3A3A3A", display: "flex", alignItems: "center", padding: "0 8px", color: "#888", fontSize: 10 }}>
              <span style={{ marginRight: 6 }}>⌕</span>Search
            </div>
            <button type="button" style={{ width: 40, height: 40, background: "transparent", border: 0, color: "#fff" }}>▭▭</button>
            <div style={{ flex: 1, display: "flex", alignItems: "stretch", justifyContent: "center" }}>
              {themedOpenWindows.map((w) => (
                <button key={w.id} type="button" onClick={() => { if (w.minimized) themedOpenWindow(w.id); themedFocusWindow(w.id); }} style={{ width: 44, height: 40, border: 0, background: "transparent", position: "relative", color: "#fff" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="4" width="14" height="12" stroke="#fff" fill="none"/></svg>
                  {themedFocusedWindowId === w.id ? <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "#0078D7" }} /> : null}
                </button>
              ))}
            </div>
            <div style={{ height: "100%", borderLeft: "1px solid #3A3A3A", padding: "0 8px", display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 10 }}>
              <span>🔊</span><span>📶</span><span>🔋</span>
              <div style={{ lineHeight: 1.1, textAlign: "right" }}>
                <div>{clockText.split(" ")[0]}</div>
                <div>{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        ) : null}

        {isMac ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64, background: "rgba(40,40,40,0.7)", borderTop: "1px solid #3A3A3A", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, zIndex: 20 }}>
            {ICONS.map((icon) => {
              const open = themedOpenWindows.some((w) => w.id === icon.id && !w.minimized);
              return (
                <div key={icon.id} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.4 }}
                    onClick={() => {
                      if (icon.id === "settings") setSettingsOpen((v) => !v);
                      else openFromIcon(icon.id);
                    }}
                    style={{ width: 48, height: 48, borderRadius: 8, background: "#3A3A3A", border: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <DesktopIconSvg kind={icon.iconKind} selected={false} scale={16} />
                  </motion.button>
                  {open ? <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff", marginTop: 3 }} /> : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {settingsOpen ? (
          <div style={{ position: "absolute", right: 12, bottom: (isMac ? 70 : taskbarOrDockHeight + 8), zIndex: 40 }}>
            <SettingsPanel onClose={() => setSettingsOpen(false)} />
          </div>
        ) : null}

        {showBoot ? (
          <motion.div
            style={{ position: "absolute", inset: 0 }}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "linear" }}
          >
            <BootSequence
              key={activeOs}
              os={activeOs}
              onComplete={() => setBootComplete(true)}
            />
          </motion.div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        backgroundColor: "#008080",
        color: "#FFFFFF",
        fontFamily: '"IBM Plex Mono", monospace',
      }}
      data-win95-cursor-scope={activeOs === "windows95" ? "true" : "false"}
    >
      {activeOs === "windows95" ? (
        <style>{`
          [data-win95-cursor-scope="true"],
          [data-win95-cursor-scope="true"] * {
            cursor: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBzaGFwZS1yZW5kZXJpbmc9ImNyaXNwRWRnZXMiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTEgMXYyMGw1LTUgNCA4IDMtMS00LTggNyAxeiIvPjwvc3ZnPg==") 0 0, auto !important;
          }

          [data-win95-cursor-scope="true"] button,
          [data-win95-cursor-scope="true"] a,
          [data-win95-cursor-scope="true"] [role="button"],
          [data-win95-cursor-scope="true"] input[type="button"],
          [data-win95-cursor-scope="true"] input[type="submit"],
          [data-win95-cursor-scope="true"] input[type="reset"],
          [data-win95-cursor-scope="true"] summary {
            cursor: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBzaGFwZS1yZW5kZXJpbmc9ImNyaXNwRWRnZXMiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTkgMzBWMTRoMnY4aDFWMTFoMnYxMWgxVjEwaDJ2MTJoMVYxM2gydjloMWwyLTMgMiAxLTMgNnY0eiIvPjwvc3ZnPg==") 0 0, pointer !important;
          }

          [data-win95-cursor-scope="true"] [style*="cursor: move"] {
            cursor: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBzaGFwZS1yZW5kZXJpbmc9ImNyaXNwRWRnZXMiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTE2IDJsMyAzaC0ydjloOVYxMmwzIDMtMyAzdi0yaC05djloMmwtMyAzLTMtM2gydi05SDV2MmwtMy0zIDMtM3YyaDlWNWgtMnoiLz48L3N2Zz4=") 16 16, move !important;
          }
        `}</style>
      ) : null}
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
              win.id === "resume" ? (
                <ResumeWindow
                  key={win.id}
                  win={win}
                  desktopConstraintsRef={desktopAreaRef}
                  onFocus={() => focusWindow(win.id)}
                  onClose={() => {
                    closeWindow(win.id);
                  }}
                  onMinimize={() => minimizeWindow(win.id)}
                  onMaximize={() => maximizeWindow(win.id)}
                  onMove={(x, y) => moveWindow(win.id, x, y)}
                />
              ) : win.id === "hobbies" ? (
                <HobbiesWindow
                  key={win.id}
                  win={win}
                  desktopConstraintsRef={desktopAreaRef}
                  onFocus={() => focusWindow(win.id)}
                  onClose={() => {
                    closeWindow(win.id);
                  }}
                  onMinimize={() => minimizeWindow(win.id)}
                  onMaximize={() => maximizeWindow(win.id)}
                  onMove={(x, y) => moveWindow(win.id, x, y)}
                />
              ) : (
                <Window
                  key={win.id}
                  win={win}
                  desktopConstraintsRef={desktopAreaRef}
                  onFocus={() => focusWindow(win.id)}
                  onClose={() => {
                    closeWindow(win.id);
                  }}
                  onMinimize={() => minimizeWindow(win.id)}
                  onMaximize={() => maximizeWindow(win.id)}
                  onMove={(x, y) => moveWindow(win.id, x, y)}
                />
              )
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

          return (
            <div
              key={icon.id}
              style={{
                position: "absolute",
                left: iconX,
                top: iconY,
                width: 96,
                userSelect: "none",
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedIconId(icon.id);
                startOpenAnimationAndOpen(icon.id);
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
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
                    marginTop: 4,
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 11,
                    lineHeight: "12px",
                    color: "#FFFFFF",
                    textAlign: "center",
                    maxWidth: 80,
                    wordBreak: "break-word",
                    padding: "0 2px",
                    boxSizing: "border-box",
                    backgroundColor: isSelected ? "#000080" : "transparent",
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
          onStart={() => setSettingsOpen((v) => !v)}
          onTaskbarButton={(id) => {
            const w = openWindows.find((x) => x.id === id);
            if (!w) return;
            if (w.minimized) {
              setOpenWindows((prev) =>
                prev.map((win) => (win.id === id ? { ...win, minimized: false } : win))
              );
            }
            focusWindow(id);
          }}
          clockText={clockText}
        />
      </div>

      {settingsOpen ? (
        <div
          style={{
            position: "absolute",
            left: 2,
            bottom: TASKBAR_HEIGHT_PX + 2,
            zIndex: 99999,
          }}
        >
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </div>
      ) : null}

      {/* Boot overlay */}
      {showBoot ? (
        <motion.div
          style={{ position: "absolute", inset: 0 }}
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "linear" }}
        >
          <BootSequence
            key={activeOs}
            os={activeOs}
            onComplete={() => setBootComplete(true)}
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

function ThemedWindow({
  win,
  theme,
  focused,
  desktopConstraintsRef,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  children,
}: {
  win: Win95Window;
  theme: OSName;
  focused: boolean;
  desktopConstraintsRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
  children: ReactNode;
}) {
  const isXP = theme === "windowsxp";
  const isW10 = theme === "windows10";
  const isMac = theme === "macos";

  const baseBorder = isXP
    ? {
        borderTop: "3px solid #0055E5",
        borderLeft: "2px solid #0055E5",
        borderRight: "2px solid #0055E5",
        borderBottom: "2px solid #0055E5",
      }
    : isW10
      ? {
          border: focused ? "1px solid #0078D7" : "1px solid #3A3A3A",
        }
      : {
          borderRadius: 10,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          border: "1px solid #3A3A3A",
        };

  return (
    <motion.div
      style={{
        position: "absolute",
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
        background: isW10 ? "#FFFFFF" : "#ECE9D8",
        overflow: "hidden",
        ...baseBorder,
      }}
      drag
      dragConstraints={desktopConstraintsRef}
      dragElastic={0}
      onPointerDown={onFocus}
      onDragEnd={(e, info) => onMove(win.position.x + info.delta.x, win.position.y + info.delta.y)}
    >
      <div
        style={{
          height: isXP ? 28 : isW10 ? 30 : 28,
          background: isXP
            ? "linear-gradient(to right, #0078D7, #2B88D8)"
            : isW10
              ? focused
                ? "#1A1A1A"
                : "#2A2A2A"
              : "#2A2A2A",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: isMac ? "space-between" : "flex-start",
          borderRadius: isMac ? "10px 10px 0 0" : isXP ? "6px 6px 0 0" : 0,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 11,
        }}
      >
        {isMac ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8 }}>
            <button type="button" onClick={onClose} style={{ width: 12, height: 12, borderRadius: "50%", border: "1px solid #E0443E", background: "#FF5F57" }} />
            <button type="button" onClick={onMinimize} style={{ width: 12, height: 12, borderRadius: "50%", border: "1px solid #D4A017", background: "#FEBC2E" }} />
            <button type="button" onClick={onMaximize} style={{ width: 12, height: 12, borderRadius: "50%", border: "1px solid #1DAD2B", background: "#28C840" }} />
          </div>
        ) : (
          <>
            <div style={{ width: 16, height: 16, marginLeft: isW10 ? 8 : 4, background: "#888" }} />
            <div style={{ marginLeft: 8, fontWeight: isXP ? 700 : 500, color: isW10 && !focused ? "#888888" : "#FFFFFF" }}>
              {win.title}
            </div>
            <div style={{ marginLeft: "auto", display: "flex" }}>
              <button type="button" onClick={onMinimize} style={{ width: isXP ? 21 : 46, height: isXP ? 21 : 30, background: isXP ? "linear-gradient(to bottom, #4A9FE8, #2B6DBF)" : "transparent", border: isXP ? "1px solid #1A4E9A" : 0, color: "#fff" }}>_</button>
              <button type="button" onClick={onMaximize} style={{ width: isXP ? 21 : 46, height: isXP ? 21 : 30, background: isXP ? "linear-gradient(to bottom, #4A9FE8, #2B6DBF)" : "transparent", border: isXP ? "1px solid #1A4E9A" : 0, color: "#fff" }}>□</button>
              <button type="button" onClick={onClose} style={{ width: isXP ? 21 : 46, height: isXP ? 21 : 30, background: isXP ? "linear-gradient(to bottom, #E84A4A, #BF2B2B)" : "#E81123", border: isXP ? "1px solid #9A1A1A" : 0, color: "#fff" }}>✕</button>
            </div>
          </>
        )}
        {isMac ? (
          <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", color: "#CCCCCC", pointerEvents: "none" }}>{win.title}</div>
        ) : null}
      </div>
      {isXP ? (
        <div style={{ height: 20, background: "#ECE9D8", borderBottom: "1px solid #ACA899", display: "flex", alignItems: "center", gap: 12, paddingLeft: 6, fontFamily: '"IBM Plex Mono", monospace', fontSize: 10 }}>
          <span>File</span><span>Edit</span><span>View</span><span>Help</span>
        </div>
      ) : null}
      <div style={{ height: `calc(100% - ${isXP ? 48 : isW10 ? 30 : 28}px)`, background: "#FFFFFF" }}>{children}</div>
    </motion.div>
  );
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
      <div style={{ position: "relative", width: 80, height: TASKBAR_HEIGHT_PX, flex: "0 0 auto" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 3,
            width: 80,
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
                justifyContent: "flex-start",
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 700,
                fontSize: 11,
                color: "#000000",
                transform: `translate(${startPressed ? 1 : 0}px, ${startPressed ? 1 : 0}px)`,
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 13,
                  height: 13,
                  marginLeft: 4,
                  marginRight: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StartFlagIcon />
              </div>
              <span aria-hidden>Start</span>
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
                  width: 160,
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
    <svg viewBox="0 0 10 8" width="10" height="8" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <polygon points="1,3 4,3 6,1.5 6,6.5 4,5 1,5" fill="#000000" />
      <path d="M7 2.5 Q8 4 7 5.5" fill="none" stroke="#000000" strokeWidth="1" />
      <path d="M8 2 Q9.5 4 8 6" fill="none" stroke="#000000" strokeWidth="1" />
    </svg>
  );
}

function StartFlagIcon() {
  return (
    <svg
      viewBox="0 0 13 13"
      width="13"
      height="13"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="13" height="13" fill="none" />
      {/* four 6x6 squares with 1px gaps */}
      <rect x="0" y="0" width="6" height="6" fill="#FF0000" />
      <rect x="7" y="0" width="6" height="6" fill="#00FF00" />
      <rect x="0" y="7" width="6" height="6" fill="#0000FF" />
      <rect x="7" y="7" width="6" height="6" fill="#FFFF00" />
      {/* simple black outline grid */}
      <rect x="0" y="0" width="13" height="13" fill="none" stroke="#000000" strokeWidth="1" />
      <line x1="6.5" y1="0" x2="6.5" y2="13" stroke="#000000" strokeWidth="1" />
      <line x1="0" y1="6.5" x2="13" y2="6.5" stroke="#000000" strokeWidth="1" />
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
      <rect x="0" y="0" width="32" height="32" fill="none" />
      <rect x="2" y="2" width="28" height="28" fill="#C0C0C0" stroke="#000000" strokeWidth="1" />

      {/* 2x2 inner icon grid (12x12 each, 1px gaps) */}
      {/* top-left monitor */}
      <rect x="4" y="4" width="12" height="12" fill="#C0C0C0" stroke="#000000" strokeWidth="1" />
      <rect x="6" y="6" width="8" height="5" fill="#0000AA" />
      <rect x="8" y="12" width="4" height="2" fill="#808080" />

      {/* top-right keyboard */}
      <rect x="17" y="4" width="12" height="12" fill="#C0C0C0" stroke="#000000" strokeWidth="1" />
      <rect x="19" y="8" width="8" height="1" fill="#808080" />
      <rect x="19" y="10" width="8" height="1" fill="#808080" />
      <rect x="19" y="12" width="8" height="1" fill="#808080" />

      {/* bottom-left printer */}
      <rect x="4" y="17" width="12" height="12" fill="#C0C0C0" stroke="#000000" strokeWidth="1" />
      <rect x="6" y="18" width="8" height="3" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
      <rect x="6" y="22" width="8" height="5" fill="#A0A0A0" />

      {/* bottom-right mouse (pixel oval) */}
      <rect x="17" y="17" width="12" height="12" fill="#C0C0C0" stroke="#000000" strokeWidth="1" />
      <rect x="20" y="20" width="6" height="5" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
      <rect x="23" y="20" width="1" height="5" fill="#000000" />
    </svg>
  );
}

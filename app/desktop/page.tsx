"use client";

import { motion, useDragControls } from "framer-motion";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BootSequence from "@/components/BootSequence";
import { useOS, type OSName } from "@/lib/osContext";
import { useWindowManager, type Win95Window } from "@/lib/windowManager";
import Window from "@/components/Window";
import ResumeWindow from "@/components/windows/ResumeWindow";
import HobbiesWindow from "@/components/windows/HobbiesWindow";
import SettingsPanel from "@/components/SettingsPanel";

export default function DesktopPage() {
  const router = useRouter();
  const { activeOS, activeOs } = useOS();
  const currentOS = activeOS ?? activeOs;
  const [bootComplete, setBootComplete] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [xpStartHover, setXpStartHover] = useState(false);
  const [xpStartPressed, setXpStartPressed] = useState(false);
  const [hoveredIconIdNon95, setHoveredIconIdNon95] = useState<string | null>(null);

  useEffect(() => {
    setBootComplete(false);
    setSettingsOpen(false);
  }, [currentOS]);

  useEffect(() => {
    if (currentOS === null) {
      router.push("/");
    }
  }, [currentOS, router]);

  const showBoot = currentOS !== null && !bootComplete;

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
  const dateText = useDateText();

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
  type WindowTitleKey = keyof typeof windowTitles;

  const titleForWindowId = (id: string) =>
    windowTitles[id as WindowTitleKey] ?? id;

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
    if (currentOS === "windows95") return;
    themedClampAllWindowsToDesktop();
  }, [currentOS, desktopArea, themedClampAllWindowsToDesktop]);

  const startOpenAnimationAndOpen = (iconId: string) => {
    if (currentOS !== "windows95") return;

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
            title: titleForWindowId(iconId),
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

  if (!currentOS) {
    return null;
  }

  if (showBoot) {
    return (
      <div className="h-screen w-screen overflow-hidden relative bg-black">
        <BootSequence key={currentOS} os={currentOS} onComplete={() => setBootComplete(true)} />
      </div>
    );
  }

  if (currentOS !== "windows95") {
    const isXP = currentOS === "windowsxp";
    const isW10 = currentOS === "windows10";
    const isMac = currentOS === "macos";
    const taskbarOrDockHeight = isMac ? 64 : isW10 ? 40 : 30;
    const topInset = isMac ? 24 : 0;
    const desktopBg = isXP
      ? "radial-gradient(120% 80% at 50% -10%, #a7dcff 0%, #87CEEB 42%, #5B9BD5 100%)"
      : isW10
        ? "radial-gradient(circle at 70% 50%, #1a3a6b 0%, #10284a 35%, #0a1628 75%)"
        : "#1E1E1E";

    const iconSize = isW10 ? 48 : isMac ? 52 : 32;
    const iconLabelSelectedBg = isXP
      ? "rgba(10,36,106,0.7)"
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
          background: desktopBg,
          backgroundColor: isXP ? "#5B9BD5" : desktopBg,
          color: "#fff",
          fontFamily: '"IBM Plex Mono", monospace',
        }}
        data-theme-cursor={currentOS}
      >
        <style>{`
          [data-theme-cursor="windowsxp"], [data-theme-cursor="windowsxp"] * { cursor: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBzaGFwZS1yZW5kZXJpbmc9ImNyaXNwRWRnZXMiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgZD0iTTEgMXYyMGw1LTUgNCA4IDMtMS00LTggNyAxeiIvPjwvc3ZnPg==") 0 0, auto; }
          [data-theme-cursor="windowsxp"] button, [data-theme-cursor="windowsxp"] [role="button"] { cursor: pointer; }
          [data-theme-cursor="windows10"], [data-theme-cursor="windows10"] * { cursor: default; }
          [data-theme-cursor="windows10"] button, [data-theme-cursor="windows10"] [role="button"] { cursor: pointer; }
          [data-theme-cursor="macos"], [data-theme-cursor="macos"] * { cursor: default; }
          [data-theme-cursor="macos"] button, [data-theme-cursor="macos"] [role="button"] { cursor: pointer; }
        `}</style>
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
              <svg
                width={(14 * 814) / 1000}
                height={14}
                viewBox="0 0 814 1000"
                fill="none"
                aria-hidden
              >
                <path
                  fill="#FFFFFF"
                  d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.2 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.2 172.5 46.2 42.8 0 109.6-49 191.4-49 30.9 0 108.2 2.6 168.1 75.4zm-216.6-25.7c-6.5-34.5-18.2-78.1-45.6-113.6-22.4-29.2-58.5-52.7-96.9-52.7-2.6 0-5.2.3-7.8.6 2.6 36.1 18.2 79.7 46.2 115.9 25 32.6 63.8 58.5 104.1 49.8z"
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
          {isXP ? (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              <div
                style={{
                  position: "absolute",
                  top: "8%",
                  left: "12%",
                  width: "18%",
                  height: "8%",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.35)",
                  filter: "blur(8px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "18%",
                  right: "18%",
                  width: "14%",
                  height: "6%",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.28)",
                  filter: "blur(7px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "-10%",
                  right: "-10%",
                  bottom: "-16%",
                  height: "56%",
                  background: "#4A7C2F",
                  clipPath: "ellipse(68% 60% at 44% 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "-8%",
                  right: "-8%",
                  bottom: "-14%",
                  height: "50%",
                  background: "#5A9E3A",
                  clipPath: "ellipse(62% 54% at 42% 100%)",
                  opacity: 0.9,
                }}
              />
            </div>
          ) : null}
          {isW10 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 70% 50%, rgba(0,120,215,0.15) 0%, rgba(0,120,215,0.06) 28%, rgba(0,0,0,0) 65%)",
              }}
            />
          ) : null}
          <div style={{ position: "absolute", inset: 0 }}>
            {themedOpenWindows
              .filter((w) => !w.minimized)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((win) => (
                <ThemedWindow
                  key={win.id}
                  win={win}
                  theme={currentOS}
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
                style={{ position: "absolute", left: x, top: y, width: isMac ? 80 : 96, userSelect: "none" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  openFromIcon(icon.id);
                }}
                onPointerEnter={() => {
                  if (isW10) setHoveredIconIdNon95(icon.id);
                }}
                onPointerLeave={() => {
                  if (isW10) setHoveredIconIdNon95(null);
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background:
                      isW10 && (selected || hoveredIconIdNon95 === icon.id)
                        ? "rgba(0,120,215,0.35)"
                        : "transparent",
                    padding: isW10 ? "4px 6px" : 0,
                  }}
                >
                  <div
                    style={{
                      width: isMac ? 52 : iconSize,
                      height: isMac ? 52 : iconSize,
                      background: "transparent",
                      borderRadius: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isMac ? (
                      <MacDesktopAppIcon id={icon.id} />
                    ) : (
                      <DesktopIconSvg kind={icon.iconKind} selected={false} scale={32} theme={currentOS} />
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      fontFamily: isMac ? '"IBM Plex Mono", monospace' : undefined,
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
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 30, display: "flex", alignItems: "center", background: "linear-gradient(to right, #245EDC, #3B8FE8)", borderTop: "2px solid #1A4BAF" }}>
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              onPointerEnter={() => setXpStartHover(true)}
              onPointerLeave={() => {
                setXpStartHover(false);
                setXpStartPressed(false);
              }}
              onPointerDown={() => setXpStartPressed(true)}
              onPointerUp={() => setXpStartPressed(false)}
              style={{
                width: 54,
                height: 26,
                marginLeft: 2,
                borderTop: "1px solid #6FD45A",
                borderLeft: "1px solid #6FD45A",
                borderBottom: "1px solid #1E6B12",
                borderRight: "1px solid #1E6B12",
                background: xpStartPressed
                  ? "linear-gradient(to bottom, #3BA829, #5ED64A)"
                  : xpStartHover
                    ? "linear-gradient(to bottom, #5ED64A, #3BA829)"
                    : "linear-gradient(to bottom, #4DBB3A, #2E8B1F)",
                borderRadius: "0 12px 12px 0",
                color: "#fff",
                textShadow: "1px 1px 1px #000000",
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
                    maxWidth: 160,
                    background: themedFocusedWindowId === w.id ? "#1A4E9A" : "#2B6DBF",
                    border: `1px solid ${themedFocusedWindowId === w.id ? "#0A3070" : "#1A4E9A"}`,
                    color: "#fff",
                    fontSize: 10,
                    padding: "0 6px 0 4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    borderRadius: "0 3px 3px 0",
                    textAlign: "left",
                    textShadow: themedFocusedWindowId === w.id ? "1px 1px #0A3070" : "none",
                  }}
                >
                  {w.title}
                </button>
              ))}
            </div>
            <div style={{ height: "100%", padding: "0 8px", display: "flex", alignItems: "center", background: "#1A4BAF", borderLeft: "1px solid #1238A0", color: "#fff", fontSize: 10, gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" shapeRendering="crispEdges">
                <polygon points="2,6 5,6 8,4 8,10 5,8 2,8" fill="#FFFFFF" />
                <path d="M9 5 Q10.5 7 9 9" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                <path d="M10.5 4 Q12.5 7 10.5 10" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              </svg>
              <span>{clockText}</span>
            </div>
          </div>
        ) : null}

        {isW10 ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, display: "flex", alignItems: "center", background: "#1A1A1A" }}>
            <button type="button" onClick={() => setSettingsOpen((v) => !v)} style={{ width: 48, height: 40, background: "transparent", border: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" shapeRendering="crispEdges">
                <path d="M0 0H8L9 8H0Z" fill="#F25022" />
                <path d="M10 0H18V8H11Z" fill="#7FBA00" />
                <path d="M0 10H8L9 18H0Z" fill="#00A4EF" />
                <path d="M10 10H18V18H11Z" fill="#FFB900" />
              </svg>
            </button>
            <div style={{ width: 260, height: 32, background: "#2B2B2B", border: "1px solid #3A3A3A", display: "flex", alignItems: "center", padding: "0 8px", color: "#888", fontSize: 10 }}>
              <span style={{ marginRight: 6, color: "#888888" }}>⌕</span>Search the web and Windows
            </div>
            <button type="button" style={{ width: 44, height: 40, background: "transparent", border: 0, color: "#fff" }}>
              <svg width="18" height="14" viewBox="0 0 18 14">
                <rect x="1" y="3" width="7" height="7" fill="none" stroke="#FFFFFF" />
                <rect x="9" y="1" width="8" height="9" fill="none" stroke="#FFFFFF" />
              </svg>
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "stretch", justifyContent: "center" }}>
              {ICONS.map((icon) => {
                const open = themedOpenWindows.some((w) => w.id === icon.id && !w.minimized);
                return (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => {
                      if (icon.id === "settings") setSettingsOpen((v) => !v);
                      else openFromIcon(icon.id);
                    }}
                    style={{ width: 44, height: 40, border: 0, background: "transparent", position: "relative", color: "#fff" }}
                  >
                    <DesktopIconSvg kind={icon.iconKind} selected={false} scale={24} theme={currentOS} />
                    {open ? <span style={{ position: "absolute", left: 8, right: 8, bottom: 0, height: 2, background: "#0078D7" }} /> : null}
                  </button>
                );
              })}
            </div>
            <div style={{ height: "100%", padding: "0 8px", display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 10 }}>
              <span style={{ width: 16, height: 16 }}>📶</span>
              <span style={{ width: 16, height: 16 }}>🔊</span>
              <span style={{ width: 16, height: 16 }}>🔋</span>
              <div style={{ width: 1, height: 22, background: "#3A3A3A", margin: "0 2px" }} />
              <div style={{ lineHeight: 1.1, textAlign: "right", fontFamily: '"IBM Plex Mono", monospace', fontSize: 10 }}>
                <div>{clockText.split(" ")[0]}</div>
                <div>{dateText}</div>
              </div>
              <span style={{ width: 16, height: 16 }}>🔔</span>
              <div style={{ width: 2, height: "100%", background: "#3A3A3A", marginLeft: 4 }} />
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
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MacDesktopAppIcon id={icon.id} />
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
              key={currentOS}
              os={currentOS}
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
      data-win95-cursor-scope={currentOS === "windows95" ? "true" : "false"}
    >
      {currentOS === "windows95" ? (
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
            key={currentOS}
            os={currentOS}
            onComplete={() => setBootComplete(true)}
          />
        </motion.div>
      ) : null}
    </div>
  );
}

function useClockText() {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(formatWin95Time(new Date()));
    const id = window.setInterval(() => setText(formatWin95Time(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  return text;
}

function useDateText() {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(formatDate(new Date()));
    const id = window.setInterval(() => setText(formatDate(new Date())), 60000);
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

function formatDate(d: Date) {
  return d.toLocaleDateString();
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
  const dragControls = useDragControls();
  const [xpHoverBtn, setXpHoverBtn] = useState<"min" | "max" | "close" | null>(null);
  const [xpPressedBtn, setXpPressedBtn] = useState<"min" | "max" | "close" | null>(null);
  const [w10HoverBtn, setW10HoverBtn] = useState<"min" | "max" | "close" | null>(null);

  const baseBorder = isXP
    ? {
        border: "3px solid #0A246A",
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
      dragControls={dragControls}
      dragListener={!isXP && !isW10}
      dragConstraints={desktopConstraintsRef}
      dragElastic={0}
      onPointerDown={() => {
        if (!isXP) onFocus();
      }}
      onDragEnd={(e, info) => onMove(win.position.x + info.delta.x, win.position.y + info.delta.y)}
    >
      <div
        onPointerDown={(e) => {
          onFocus();
          if (isXP || isW10) {
            dragControls.start(e);
          }
        }}
        style={{
          height: isXP ? 30 : isW10 ? 32 : 28,
          background: isXP
            ? "linear-gradient(to right, #0A246A, #3A88C8)"
            : isW10
              ? focused
                ? "#FFFFFF"
                : "#F0F0F0"
              : "#2A2A2A",
          color: isW10 ? "#000000" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: isMac ? "space-between" : "flex-start",
          borderRadius: isMac ? "10px 10px 0 0" : isXP ? "6px 6px 0 0" : 0,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 11,
          boxSizing: "border-box",
          borderTop: isXP ? "1px solid #5BAEE8" : "none",
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
            <div style={{ width: 16, height: 16, marginLeft: isXP ? 6 : isW10 ? 8 : 4, background: "#888" }} />
            <div style={{ marginLeft: isW10 ? 12 : 8, fontWeight: isXP ? 700 : 500, color: isW10 ? "#000000" : isW10 && !focused ? "#888888" : "#FFFFFF" }}>
              {win.title}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: isXP ? 3 : 0, paddingRight: isXP ? 5 : 0 }}>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (isXP) setXpPressedBtn("min");
                }}
                onPointerUp={() => isXP && setXpPressedBtn(null)}
                onPointerLeave={() => isXP && setXpPressedBtn(null)}
                onPointerEnter={() => isXP && setXpHoverBtn("min")}
                onPointerOut={() => isXP && setXpHoverBtn(null)}
                onMouseEnter={() => isW10 && setW10HoverBtn("min")}
                onMouseLeave={() => isW10 && setW10HoverBtn(null)}
                onClick={onMinimize}
                style={{
                  width: isXP ? 21 : 46,
                  height: isXP ? 21 : 32,
                  background: isXP
                    ? xpPressedBtn === "min"
                      ? "linear-gradient(to bottom, #2B6DBF, #3F85D0)"
                      : xpHoverBtn === "min"
                        ? "linear-gradient(to bottom, #62B3F2, #4A86D3)"
                        : "linear-gradient(to bottom, #4A9FE8, #2B6DBF)"
                    : w10HoverBtn === "min"
                      ? "#E0E0E0"
                      : "transparent",
                  border: isXP ? "1px solid #1A4E9A" : "none",
                  borderRadius: isXP ? 3 : 0,
                  color: isW10 ? "#000000" : "#fff",
                }}
              >
                {isW10 ? "—" : "_"}
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (isXP) setXpPressedBtn("max");
                }}
                onPointerUp={() => isXP && setXpPressedBtn(null)}
                onPointerLeave={() => isXP && setXpPressedBtn(null)}
                onPointerEnter={() => isXP && setXpHoverBtn("max")}
                onPointerOut={() => isXP && setXpHoverBtn(null)}
                onMouseEnter={() => isW10 && setW10HoverBtn("max")}
                onMouseLeave={() => isW10 && setW10HoverBtn(null)}
                onClick={onMaximize}
                style={{
                  width: isXP ? 21 : 46,
                  height: isXP ? 21 : 32,
                  background: isXP
                    ? xpPressedBtn === "max"
                      ? "linear-gradient(to bottom, #2B6DBF, #3F85D0)"
                      : xpHoverBtn === "max"
                        ? "linear-gradient(to bottom, #62B3F2, #4A86D3)"
                        : "linear-gradient(to bottom, #4A9FE8, #2B6DBF)"
                    : w10HoverBtn === "max"
                      ? "#E0E0E0"
                      : "transparent",
                  border: isXP ? "1px solid #1A4E9A" : "none",
                  borderRadius: isXP ? 3 : 0,
                  color: isW10 ? "#000000" : "#fff",
                }}
              >
                □
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (isXP) setXpPressedBtn("close");
                }}
                onPointerUp={() => isXP && setXpPressedBtn(null)}
                onPointerLeave={() => isXP && setXpPressedBtn(null)}
                onPointerEnter={() => isXP && setXpHoverBtn("close")}
                onPointerOut={() => isXP && setXpHoverBtn(null)}
                onMouseEnter={() => isW10 && setW10HoverBtn("close")}
                onMouseLeave={() => isW10 && setW10HoverBtn(null)}
                onClick={onClose}
                style={{
                  width: isXP ? 21 : 46,
                  height: isXP ? 21 : 32,
                  background: isXP
                    ? xpPressedBtn === "close"
                      ? "linear-gradient(to bottom, #BF2020, #931616)"
                      : xpHoverBtn === "close"
                        ? "linear-gradient(to bottom, #EE6457, #D2352D)"
                        : "linear-gradient(to bottom, #E84A3A, #BF2020)"
                    : w10HoverBtn === "close"
                      ? "#E81123"
                      : "transparent",
                  border: isXP ? "1px solid #9A1010" : "none",
                  borderRadius: isXP ? 3 : 0,
                  color: isW10 ? (w10HoverBtn === "close" ? "#FFFFFF" : "#000000") : "#fff",
                }}
              >
                ✕
              </button>
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
      <div
        style={{
          height: `calc(100% - ${isXP ? 50 : isW10 ? 32 : 28}px)`,
          background: "#FFFFFF",
          border: isXP ? "1px solid #ACA899" : "none",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
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

const MAC_DESKTOP_ICON_BOX: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  overflow: "hidden",
  flexShrink: 0,
};

function MacDesktopAppIcon({ id }: { id: string }) {
  switch (id) {
    case "about":
      return (
        <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#0A84FF" }}>
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              fontSize: 28,
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            i
          </span>
        </div>
      );
    case "projects":
      return (
        <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#5E5CE6" }}>
          <svg width={30} height={26} viewBox="0 0 30 26" fill="none" aria-hidden>
            <path
              d="M3 10 L3 23 L27 23 L27 11 L13 11 L11 9 L3 9 Z"
              stroke="#FFFFFF"
              strokeWidth={1.6}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M3 9 V7 h7 l2 2"
              stroke="#FFFFFF"
              strokeWidth={1.6}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case "experience":
      return (
        <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#FF9F0A" }}>
          <svg width={30} height={28} viewBox="0 0 30 28" fill="none" aria-hidden>
            <path
              d="M9 11 V9 C9 7.2 10.3 6 12 6 h6 C19.7 6 21 7.2 21 9 v2"
              stroke="#FFFFFF"
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
            />
            <rect x={5} y={11} width={20} height={14} rx={1.5} stroke="#FFFFFF" strokeWidth={1.6} fill="none" />
            <path d="M5 14 h20" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" />
          </svg>
        </div>
      );
    case "education":
      return (
        <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#30D158" }}>
          <svg width={34} height={28} viewBox="0 0 34 28" aria-hidden>
            <polygon points="17,6 4,12 30,12" fill="#FFFFFF" />
            <rect x="4" y="12" width="26" height="4" fill="#FFFFFF" />
            <line x1="17" y1="16" x2="17" y2="22" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="17" cy="23" r="2" fill="#FFFFFF" />
          </svg>
        </div>
      );
    case "resume":
      return (
        <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#FF3B30" }}>
          <svg width={28} height={32} viewBox="0 0 28 32" fill="none" aria-hidden>
            <rect x="5" y="4" width="18" height="24" rx={1} stroke="#FFFFFF" strokeWidth={1.5} fill="none" />
            <path d="M17 4 L23 4 L23 10 L17 10 Z" fill="#FFFFFF" />
            <line x1="8" y1="15" x2="20" y2="15" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
            <line x1="8" y1="19" x2="20" y2="19" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
            <line x1="8" y1="23" x2="17" y2="23" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
          </svg>
        </div>
      );
    case "contact":
      return (
        <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#32ADE6" }}>
          <svg width={32} height={24} viewBox="0 0 32 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="26" height="16" rx={1} stroke="#FFFFFF" strokeWidth={1.5} fill="none" />
            <path
              d="M3 5 L16 14 L29 5"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              strokeLinejoin="round"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case "hobbies":
      return (
        <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#FF2D55" }}>
          <svg width={28} height={26} viewBox="0 0 28 26" aria-hidden>
            <path
              fill="#FFFFFF"
              d="M14 23 C6 17 2 13 2 8 C2 5 4 3 7 3 C9.5 3 11.5 4.5 13 6.5 C14.5 4.5 16.5 3 19 3 C22 3 24 5 24 8 C24 13 20 17 12 23 Z"
            />
          </svg>
        </div>
      );
    case "settings":
      return (
        <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#3A3A3C" }}>
          <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#FFFFFF"
              d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.495.495 0 0 0-.59.22l-1.92 3.32c-.12.21-.07.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-1.97-1.58zm-7.14 2.66a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"
            />
            <circle cx="12" cy="12" r="3.5" fill="#3A3A3C" />
          </svg>
        </div>
      );
    default:
      return <div style={{ ...MAC_DESKTOP_ICON_BOX, background: "#3A3A3C" }} />;
  }
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
  theme,
}: {
  kind: "folder" | "file" | "envelope" | "control";
  selected: boolean;
  scale: 16 | 24 | 32 | 48;
  theme?: OSName;
}) {
  const common = {
    viewBox: "0 0 32 32",
    width: scale,
    height: scale,
    shapeRendering: "crispEdges" as const,
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (theme === "windows10") {
    if (kind === "folder") {
      return (
        <svg {...common}>
          <path d="M4 10h10l2 3h12v11H4z" fill="#FFB900" />
          <rect x="4" y="13" width="24" height="11" fill="#FFB900" />
        </svg>
      );
    }

    if (kind === "file") {
      return (
        <svg {...common}>
          <rect x="6" y="5" width="18" height="22" fill="#FFFFFF" />
          <polygon points="18,5 24,5 24,11" fill="#DCE8F8" />
          <rect x="6" y="5" width="2" height="22" fill="#0078D7" />
        </svg>
      );
    }

    if (kind === "envelope") {
      return (
        <svg {...common}>
          <rect x="4" y="10" width="24" height="14" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <polygon points="6,12 16,19 26,12 16,15" fill="#0078D7" />
        </svg>
      );
    }

    return (
      <svg {...common}>
        <path
          d="M16 6l2 0.8 1.8-1.1 2.4 2.4-1.1 1.8L22 12l2 0.5v3l-2 0.5-0.9 2.1 1.1 1.8-2.4 2.4-1.8-1.1L16 22l-0.5 2h-3l-0.5-2-2.1-0.9-1.8 1.1-2.4-2.4 1.1-1.8L6 16l-2-0.5v-3L6 12l0.9-2.1-1.1-1.8 2.4-2.4 1.8 1.1L12 6.8l0.5-2h3z"
          fill="#808080"
        />
        <circle cx="16" cy="14" r="4" fill="#000000" />
      </svg>
    );
  }

  if (theme === "windowsxp") {
    if (kind === "folder") {
      return (
        <svg {...common}>
          <rect x="2" y="6" width="28" height="22" rx="3" ry="3" fill="#FFCC00" />
          <rect x="5" y="3" width="13" height="6" rx="3" ry="3" fill="#FFCC00" />
          <rect x="3" y="18" width="26" height="8" fill="#E6A800" opacity="0.45" />
          <rect x="4" y="8" width="22" height="6" fill="#FFE566" opacity="0.9" />
          <rect x="2" y="6" width="28" height="22" rx="3" ry="3" fill="none" stroke="#B47A00" strokeWidth="1" />
        </svg>
      );
    }

    if (kind === "file") {
      return (
        <svg {...common}>
          <rect x="5" y="4" width="22" height="24" rx="3" ry="3" fill="#EEF4FF" stroke="#A6B8D8" strokeWidth="1" />
          <polygon points="19,4 27,4 27,12" fill="#C8D8F0" />
          <rect x="8" y="12" width="14" height="2" fill="#3A88C8" />
          <rect x="8" y="16" width="12" height="2" fill="#7AA9DE" />
          <rect x="8" y="20" width="10" height="2" fill="#9FC3EA" />
        </svg>
      );
    }

    if (kind === "envelope") {
      return (
        <svg {...common}>
          <rect x="4" y="9" width="24" height="16" rx="3" ry="3" fill="#FFFFFF" stroke="#7BA2CC" strokeWidth="1" />
          <polygon points="5,11 16,19 27,11 16,14" fill="#3A88C8" />
        </svg>
      );
    }

    return (
      <svg {...common}>
        <rect x="3" y="3" width="26" height="26" rx="4" ry="4" fill="#DCE7F9" stroke="#8CA8CF" strokeWidth="1" />
        <rect x="6" y="6" width="10" height="10" rx="2" ry="2" fill="#2B88D8" />
        <rect x="18" y="6" width="8" height="8" rx="2" ry="2" fill="#E84A3A" />
        <rect x="6" y="18" width="8" height="8" rx="2" ry="2" fill="#4DBB3A" />
        <rect x="16" y="16" width="10" height="10" rx="2" ry="2" fill="#FFB900" />
      </svg>
    );
  }

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

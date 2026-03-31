"use client";

import { motion } from "framer-motion";
import type { OSName } from "@/lib/osContext";
import { useEffect, useMemo, useRef, useState } from "react";

type BootSequenceProps = {
  os: OSName | null;
  onComplete: () => void;
};

const XP_LINES = [
  "NTLDR v5.1.2600",
  "",
  "Initializing processor...",
  "Switching to protected mode...",
  "Loading BOOT.INI...",
  "",
  "Microsoft Windows XP Professional",
  "",
  "NTDETECT V5.1 Checking Hardware...",
  "Loading kernel: NTOSKRNL.EXE",
  "Loading HAL: HAL.DLL",
  "Loading boot device drivers...",
  "",
  "Starting Windows...",
];

const Win10Boot = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);
  const called = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (phase !== 0) return;
    const t = window.setTimeout(() => setPhase(1), 800);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 1) return;
    const t = window.setTimeout(() => setPhase(2), 700);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 2) return;
    const t = window.setTimeout(() => setPhase(3), 2400);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 3 || called.current) return;
    called.current = true;
    onCompleteRef.current();
  }, [phase]);

  // Phase 0 - pure black
  if (phase === 0) {
    return <div style={{ position: "fixed", inset: 0, background: "#000000" }} />;
  }

  // Phase 1 - logo fade in
  if (phase === 1) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: "linear" }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" shapeRendering="crispEdges">
            <rect x="0" y="0" width="30" height="30" fill="#F25022" />
            <rect x="34" y="0" width="30" height="30" fill="#7FBA00" />
            <rect x="0" y="34" width="30" height="30" fill="#00A4EF" />
            <rect x="34" y="34" width="30" height="30" fill="#FFB900" />
          </svg>
        </motion.div>
      </div>
    );
  }

  // Phase 2 - logo with spinner dots
  if (phase === 2) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`
          @keyframes win10pulse {
            0%, 100% { opacity: 0.15; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1); }
          }
          .win10-dot { width: 10px; height: 10px; background: #FFFFFF; border-radius: 50%; }
          .win10-dot:nth-child(1) { animation: win10pulse 1200ms linear infinite; animation-delay: 0ms; }
          .win10-dot:nth-child(2) { animation: win10pulse 1200ms linear infinite; animation-delay: 160ms; }
          .win10-dot:nth-child(3) { animation: win10pulse 1200ms linear infinite; animation-delay: 320ms; }
          .win10-dot:nth-child(4) { animation: win10pulse 1200ms linear infinite; animation-delay: 480ms; }
          .win10-dot:nth-child(5) { animation: win10pulse 1200ms linear infinite; animation-delay: 640ms; }
        `}</style>

        <svg width="64" height="64" viewBox="0 0 64 64" shapeRendering="crispEdges">
          <rect x="0" y="0" width="30" height="30" fill="#F25022" />
          <rect x="34" y="0" width="30" height="30" fill="#7FBA00" />
          <rect x="0" y="34" width="30" height="30" fill="#00A4EF" />
          <rect x="34" y="34" width="30" height="30" fill="#FFB900" />
        </svg>

        <div style={{ marginTop: 40, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
          <div className="win10-dot" />
          <div className="win10-dot" />
          <div className="win10-dot" />
          <div className="win10-dot" />
          <div className="win10-dot" />
        </div>
      </div>
    );
  }

  // Phase 3 - black and complete
  return <div style={{ position: "fixed", inset: 0, background: "#000000" }} />;
};

const XPBoot = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const called = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (phase !== 0) return;
    let i = 0;
    let advanceTimeout: number | null = null;
    setLines([]);
    const interval = window.setInterval(() => {
      setLines((prev) => [...prev, XP_LINES[i]]);
      i += 1;
      if (i >= XP_LINES.length) {
        window.clearInterval(interval);
        advanceTimeout = window.setTimeout(() => {
          setPhase(1);
        }, 500);
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
      if (advanceTimeout !== null) {
        window.clearTimeout(advanceTimeout);
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 1) return;
    const t = window.setTimeout(() => setPhase(2), 3000);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 3) return;
    const t = window.setTimeout(() => setPhase(4), 300);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Phase 0 - NTLDR text screen
  if (phase === 0) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000000",
          padding: "24px",
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "11px",
          color: "#FFFFFF",
          lineHeight: "1.6",
        }}
      >
        {lines.map((line, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i}>{line || "\u00A0"}</div>
        ))}
      </div>
    );
  }

  // Phase 1 - XP splash screen
  if (phase === 1) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`
          @keyframes xproll {
            from { transform: translateX(-220px); }
            to { transform: translateX(220px); }
          }
          .xp-marquee { position: absolute; left: 0; top: 1px; display: flex; gap: 8px; animation: xproll 1800ms linear infinite; }
          .xp-dot { width: 28px; height: 6px; background: #3A88C8; flex-shrink: 0; }
        `}</style>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3px",
              width: "56px",
              height: "56px",
            }}
          >
            <div style={{ background: "#CE0000" }} />
            <div style={{ background: "#00B050" }} />
            <div style={{ background: "#0050CE" }} />
            <div style={{ background: "#FFD700" }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "28px",
                color: "#FFFFFF",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              Windows
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "14px",
                color: "#FFFFFF",
                marginTop: "4px",
              }}
            >
              XP Professional
            </div>
          </div>
        </div>

        <div
          style={{
            width: "200px",
            height: "8px",
            background: "#3A3A3A",
            border: "1px solid #666666",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="xp-marquee">
            <div className="xp-dot" />
            <div className="xp-dot" />
            <div className="xp-dot" />
            <div className="xp-dot" />
            <div className="xp-dot" />
          </div>
        </div>

        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: "10px",
            color: "#888888",
            marginTop: "10px",
          }}
        >
          Microsoft Corporation
        </div>
      </div>
    );
  }

  // Phase 2 - fade splash to black
  if (phase === 2) {
    return (
      <motion.div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "linear" }}
        onAnimationComplete={() => setPhase(3)}
      >
        <style>{`
          .xp-dot-static { width: 28px; height: 6px; background: #3A88C8; flex-shrink: 0; }
        `}</style>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3px",
              width: "56px",
              height: "56px",
            }}
          >
            <div style={{ background: "#CE0000" }} />
            <div style={{ background: "#00B050" }} />
            <div style={{ background: "#0050CE" }} />
            <div style={{ background: "#FFD700" }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "28px",
                color: "#FFFFFF",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              Windows
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "14px",
                color: "#FFFFFF",
                marginTop: "4px",
              }}
            >
              XP Professional
            </div>
          </div>
        </div>
        <div
          style={{
            width: "200px",
            height: "8px",
            background: "#3A3A3A",
            border: "1px solid #666666",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 1,
              display: "flex",
              gap: 8,
            }}
          >
            <div className="xp-dot-static" />
            <div className="xp-dot-static" />
            <div className="xp-dot-static" />
            <div className="xp-dot-static" />
            <div className="xp-dot-static" />
          </div>
        </div>
        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: "10px",
            color: "#888888",
            marginTop: "10px",
          }}
        >
          Microsoft Corporation
        </div>
      </motion.div>
    );
  }

  // Phase 3 - hold black
  if (phase === 3) {
    return <div style={{ position: "fixed", inset: 0, background: "#000000" }} />;
  }

  // Phase 4 - top-down framebuffer sweep then complete
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000" }}>
      <motion.div
        style={{ position: "absolute", left: 0, top: 0, width: "100%", background: "#2B5797" }}
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 0.6, ease: "linear" }}
        onAnimationComplete={() => {
          if (called.current) return;
          called.current = true;
          onCompleteRef.current();
        }}
      />
    </div>
  );
};

const BIOS_LINES = [
  "AMIBIOS (C)2007 American Megatrends Inc.",
  "BIOS Version 2.00.07.J00F",
  "",
  "CPU: Intel Joof Core @ 100MHz",
  "Memory Test: 2007K OK",
  "",
  "Detecting IDE drives...",
  "Primary Master: UOTTAWA-ENG 130MB",
  "Primary Slave: None",
  "Secondary Master: ATAPI CD-ROM",
  "Secondary Slave: None",
  "",
  "Initializing Plug and Play cards...",
  "PnP BIOS detected",
  "",
  "Press DEL to continue...",
];

const DOS_LINES = [
  "C:\\> HIMEM.SYS loaded",
  "C:\\> EMM386.EXE loaded",
  "C:\\> SMARTDRV.EXE loaded",
  "C:\\> Loading COMMAND.COM...",
  "C:\\> Initializing device drivers...",
  "C:\\> MOUSE.COM loaded successfully",
  "C:\\> SOUND.DRV loaded successfully",
  "C:\\> Starting Windows 95...",
];

const LOGO_TEXT = "Windows 95";
const LOGO_SUBTITLE = "Microsoft Corporation";

const PROGRESS_SEGMENTS = 16;
export default function BootSequence({ os, onComplete }: BootSequenceProps) {
  const hasCompletedRef = useRef(false);

  const osIsWindows95 = os === "windows95";
  const osIsWindowsXP = os === "windowsxp";
  const osIsWindows10 = os === "windows10";
  const osIsMacOS = os === "macos";

  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);

  // Phase 1
  const [biosLineCount, setBiosLineCount] = useState(() =>
    osIsWindows95 ? 1 : 0
  );
  const [biosCursorOn, setBiosCursorOn] = useState(false);

  // Phase 2
  const [dosLineCount, setDosLineCount] = useState(0);

  // Phase 3
  const [logoVisible, setLogoVisible] = useState(false);
  const [progressFilled, setProgressFilled] = useState(0);

  const biosLines = useMemo(() => BIOS_LINES, []);
  const dosLines = useMemo(() => DOS_LINES, []);

  const [macPhase, setMacPhase] = useState(0);

  useEffect(() => {
    if (!os) return;
    hasCompletedRef.current = false;
    const safetyTimeout = window.setTimeout(() => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      onComplete();
    }, 12000);
    return () => window.clearTimeout(safetyTimeout);
  }, [onComplete, os]);

  useEffect(() => {
    if (!osIsMacOS) return;
    setMacPhase(0);
  }, [osIsMacOS]);

  useEffect(() => {
    if (!osIsMacOS) return;
    if (macPhase === 0) {
      const t = window.setTimeout(() => setMacPhase(1), 600);
      return () => window.clearTimeout(t);
    }
    if (macPhase === 1) {
      const t = window.setTimeout(() => setMacPhase(2), 800);
      return () => window.clearTimeout(t);
    }
    if (macPhase === 2) {
      const t = window.setTimeout(() => setMacPhase(3), 3200);
      return () => window.clearTimeout(t);
    }
    if (macPhase === 3) {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      onComplete();
    }
  }, [macPhase, onComplete, osIsMacOS]);

  useEffect(() => {
    if (!osIsWindows95) {
      return;
    }

    hasCompletedRef.current = false;
    setPhase(1);

    // ---- Phase 1: BIOS ----
    setBiosCursorOn(false);
    setBiosLineCount(1);

    let cancelled = false;
    let cursorInterval: number | null = null;
    let onKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;
    const timeouts: number[] = [];

    const startCursorAndWaitForDel = () => {
      if (cancelled) return;

      setBiosCursorOn(true);

      if (cursorInterval !== null) {
        window.clearInterval(cursorInterval);
      }
      cursorInterval = window.setInterval(() => {
        setBiosCursorOn((v) => !v);
      }, 500);

      onKeyDownHandler = (e: KeyboardEvent) => {
        if (cancelled) return;
        if (e.key !== "Delete" && e.key !== "Del") return;

        if (onKeyDownHandler) {
          window.removeEventListener("keydown", onKeyDownHandler);
        }

        if (cursorInterval !== null) {
          window.clearInterval(cursorInterval);
          cursorInterval = null;
        }
        setBiosCursorOn(false);

        // ---- Phase 2: DOS ----
        setPhase(2);

        setDosLineCount(1);

        // Reveal DOS lines one-by-one with 60ms between each.
        for (let i = 1; i < dosLines.length; i++) {
          timeouts.push(
            window.setTimeout(() => {
              if (cancelled) return;
              setDosLineCount(i + 1);

              // After last line appears, wait 400ms then Phase 3.
              if (i === dosLines.length - 1) {
                timeouts.push(
                  window.setTimeout(() => {
                    if (cancelled) return;

                    // ---- Phase 3: Windows 95 logo ----
                    setPhase(3);
                    setLogoVisible(false);
                    setProgressFilled(0);

                    // Trigger fade-in (300ms). Delay ensures opacity starts at 0.
                    window.setTimeout(() => {
                      if (cancelled) return;
                      setLogoVisible(true);

                      // Progress bar starts 400ms after the logo appears.
                      timeouts.push(
                        window.setTimeout(() => {
                          if (cancelled) return;

                          // Snap-on segments with 100ms delay between each.
                          setProgressFilled(1);
                          for (let seg = 1; seg < PROGRESS_SEGMENTS; seg++) {
                            timeouts.push(
                              window.setTimeout(() => {
                                if (cancelled) return;
                                setProgressFilled(seg + 1);
                              }, seg * 100)
                            );
                          }

                          // After all segments fill, wait 500ms then Phase 4.
                          timeouts.push(
                            window.setTimeout(() => {
                              if (cancelled) return;
                              setPhase(4);
                            }, (PROGRESS_SEGMENTS - 1) * 100 + 500)
                          );
                        }, 400)
                      );
                    }, 0);
                  }, 400)
                );
              }
            }, i * 60)
          );
        }

        // If there is only one DOS line (not expected), still go forward.
        if (dosLines.length === 1) {
          timeouts.push(
            window.setTimeout(() => {
              if (cancelled) return;
              setPhase(3);
            }, 400)
          );
        }
      };

      window.addEventListener("keydown", onKeyDownHandler);
    };

    // Reveal BIOS lines. First line is visible immediately.
    for (let i = 1; i < biosLines.length; i++) {
      timeouts.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setBiosLineCount(i + 1);

          if (i === biosLines.length - 1) {
            startCursorAndWaitForDel();
          }
        }, i * 80)
      );
    }

    return () => {
      cancelled = true;
      if (cursorInterval !== null) {
        window.clearInterval(cursorInterval);
      }
      if (onKeyDownHandler) {
        window.removeEventListener("keydown", onKeyDownHandler);
      }
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [dosLines, biosLines, osIsWindows95]);

  if (osIsWindowsXP) {
    return (
      <XPBoot
        onComplete={() => {
          if (hasCompletedRef.current) return;
          hasCompletedRef.current = true;
          onComplete();
        }}
      />
    );
  }

  if (osIsWindows10) {
    return (
      <Win10Boot
        onComplete={() => {
          if (hasCompletedRef.current) return;
          hasCompletedRef.current = true;
          onComplete();
        }}
      />
    );
  }

  if (osIsMacOS) {
    return (
      <div className="h-full w-full relative overflow-hidden bg-black">
        {macPhase >= 1 ? (
          <div className="h-full w-full flex flex-col items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, ease: "linear" }}>
              <div style={{ position: "relative", width: 80, height: 96 }}>
                <div style={{ position: "absolute", left: 5, top: 14, width: 70, height: 80, background: "#FFFFFF", borderRadius: "35px 35px 38px 38px" }} />
                <div style={{ position: "absolute", left: 56, top: 0, width: 12, height: 18, background: "#FFFFFF", borderRadius: 3, transform: "rotate(30deg)" }} />
              </div>
            </motion.div>

            {macPhase === 2 ? (
              <div
                style={{
                  marginTop: 40,
                  width: 200,
                  height: 4,
                  background: "#3A3A3A",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 200 }}
                  transition={{ duration: 2.6, ease: "easeInOut" }}
                  style={{
                    height: 4,
                    background: "#FFFFFF",
                    borderRadius: 2,
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  // Guard: this component is only meant for Windows 95.
  if (!osIsWindows95) {
    return null;
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
      {phase < 4 ? (
        <div
          className="absolute inset-0 bg-black text-white"
          style={{ borderRadius: 0 }}
        >
          {phase === 1 ? (
            <div className="absolute left-6 top-4 text-white text-xs whitespace-pre">
              {biosLines.map((line, idx) => {
                const visible = idx < biosLineCount;
                if (!visible) return null;

                const isFinal = idx === biosLines.length - 1;
                const showCursor = isFinal && biosCursorOn;

                return (
                  <span key={idx}>
                    {line}
                    {showCursor ? "█" : null}
                    {"\n"}
                  </span>
                );
              })}
            </div>
          ) : null}

          {phase === 2 ? (
            <div className="absolute left-6 top-4 text-[#00ff00] text-xs whitespace-pre">
              {dosLines.slice(0, dosLineCount).join("\n")}
            </div>
          ) : null}

          {phase === 3 ? (
            <div className="h-full w-full flex flex-col items-center justify-center">
              <div
                className="flex flex-col items-center"
                style={{
                  opacity: logoVisible ? 1 : 0,
                  transition: "opacity 300ms linear",
                }}
              >
                <div
                  style={{
                    fontFamily:
                      '"Georgia", "Times New Roman", Times, serif',
                    fontWeight: 700,
                    color: "#ffffff",
                    lineHeight: 0.95,
                    fontSize: 64,
                  }}
                >
                  {LOGO_TEXT}
                </div>
                <div
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    marginTop: 6,
                    color: "#888888",
                    fontSize: 12,
                  }}
                >
                  {LOGO_SUBTITLE}
                </div>
              </div>

              {progressFilled > 0 ? (
                <div
                  className="mt-8"
                  aria-label="Windows 95 boot progress"
                  style={{ display: "flex", gap: 3 }}
                >
                  {Array.from({ length: PROGRESS_SEGMENTS }).map((_, idx) => {
                    const filled = idx < progressFilled;
                    return (
                      <span
                        // eslint-disable-next-line react/no-array-index-key
                        key={idx}
                        style={{
                          width: 24,
                          height: 14,
                          backgroundColor: filled ? "#ffffff" : "transparent",
                          borderRadius: 0,
                          display: "inline-block",
                        }}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === 4 ? (
        (() => {
          const SCANLINE_SPACING_PX = 3; // 1px line + 2px gap
          const lineCount = Math.ceil(
            ((typeof window !== "undefined" ? window.innerHeight : 900) +
              0) /
              SCANLINE_SPACING_PX
          );
          const scanlines: Array<HTMLDivElement | null> = [];
          let scanlinesContainer: HTMLDivElement | null = null;
          let intervalId: number | null = null;

          const randomizeScanlines = () => {
            for (let i = 0; i < scanlines.length; i++) {
              const el = scanlines[i];
              if (!el) continue;
              el.style.opacity = String(0.3 + Math.random() * 0.7);
            }
          };

          return (
            <div className="absolute inset-0 overflow-hidden">
              {/* Step 1: CRT power-on flash */}
              <motion.div
                className="absolute inset-0 bg-[#ffffff]"
                style={{ borderRadius: 0 }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{
                  duration: 0.2,
                  ease: "steps(1, end)",
                }}
              />

              {/* Step 2 + 3: scanlines opacity fade in/out */}
              <motion.div
                className="absolute inset-0"
                style={{ borderRadius: 0, pointerEvents: "none" }}
                ref={(el) => {
                  scanlinesContainer = el;
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 0] }}
                transition={{
                  duration: 1.575,
                  ease: "linear",
                  times: [0, 0.1269841269, 0.3650793651, 1],
                }}
              >
                {Array.from({ length: lineCount }).map((_, idx) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    ref={(el) => {
                      scanlines[idx] = el;
                    }}
                    style={{
                      position: "absolute",
                      top: idx * SCANLINE_SPACING_PX,
                      left: 0,
                      width: "100%",
                      height: 1,
                      backgroundColor: "#ffffff",
                      opacity: 0.0,
                    }}
                  />
                ))}
              </motion.div>

              {/* Black overlay dissolves + drives flicker timing */}
              <motion.div
                className="absolute inset-0 bg-black"
                style={{ borderRadius: 0 }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{
                  delay: 0.575,
                  duration: 1,
                  ease: "linear",
                }}
                onAnimationStart={() => {
                  // Step 3: flicker during the dissolve
                  randomizeScanlines();
                  intervalId = window.setInterval(() => {
                    randomizeScanlines();
                  }, 125);
                }}
                onAnimationComplete={() => {
                  // Step 4: snap scanlines off, then Step 5
                  if (intervalId !== null) {
                    window.clearInterval(intervalId);
                    intervalId = null;
                  }
                  if (scanlinesContainer) {
                    scanlinesContainer.style.display = "none";
                  }
                  if (hasCompletedRef.current) return;
                  hasCompletedRef.current = true;
                  onComplete();
                }}
              />
            </div>
          );
        })()
      ) : null}
    </div>
  );
}


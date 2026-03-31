"use client";

import { motion } from "framer-motion";
import type { OSName } from "@/lib/osContext";
import { useEffect, useMemo, useRef, useState } from "react";

type BootSequenceProps = {
  os: OSName | null;
  onComplete: () => void;
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
const XP_DETECT_DOTS = 29;
const XP_BOOT_DRIVER_DOTS = 11;

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

  const [xpPhase, setXpPhase] = useState<1 | 2 | 3 | 4>(1);
  const [xpLineCount, setXpLineCount] = useState(0);
  const [xpDetectDotCount, setXpDetectDotCount] = useState(0);
  const [xpBootDriverDotCount, setXpBootDriverDotCount] = useState(0);
  const [xpSplashVisible, setXpSplashVisible] = useState(false);

  const [win10Phase, setWin10Phase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [win10LogoVisible, setWin10LogoVisible] = useState(false);
  const [win10ShowDots, setWin10ShowDots] = useState(false);

  const [macPhase, setMacPhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [macLogoVisible, setMacLogoVisible] = useState(false);
  const [macShowProgress, setMacShowProgress] = useState(false);
  const [macProgressFill, setMacProgressFill] = useState(false);

  const xpTextLines = useMemo(
    () => [
      "NTLDR v5.1.2600",
      "",
      "Initializing processor...",
      "Switching to protected mode...",
      "Loading BOOT.INI...",
      "",
      "Microsoft Windows XP Professional",
      "",
      `NTDETECT V5.1 Checking Hardware${".".repeat(xpDetectDotCount)}`,
      "Loading kernel: NTOSKRNL.EXE",
      "Loading HAL: HAL.DLL",
      `Loading boot drivers${".".repeat(xpBootDriverDotCount)}`,
      "",
      "Starting Windows...",
    ],
    [xpBootDriverDotCount, xpDetectDotCount]
  );

  useEffect(() => {
    if (!os) return;
    hasCompletedRef.current = false;
    const safetyTimeout = window.setTimeout(() => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      onComplete();
    }, 10000);
    return () => window.clearTimeout(safetyTimeout);
  }, [onComplete, os]);

  useEffect(() => {
    if (!osIsWindowsXP) return;

    hasCompletedRef.current = false;
    setXpPhase(1);
    setXpLineCount(0);
    setXpDetectDotCount(0);
    setXpBootDriverDotCount(0);
    setXpSplashVisible(false);

    let cancelled = false;
    const timeouts: number[] = [];

    const revealLineAt = (idx: number, atMs: number) => {
      timeouts.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setXpLineCount(idx + 1);
        }, atMs)
      );
    };

    // Phase 1 static lines to hardware detect
    const phase1IntroOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    let cursorMs = 0;
    phase1IntroOrder.forEach((idx) => {
      revealLineAt(idx, cursorMs);
      cursorMs += 70;
    });

    // NTDETECT dots
    for (let i = 1; i <= XP_DETECT_DOTS; i++) {
      timeouts.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setXpDetectDotCount(i);
        }, cursorMs + i * 40)
      );
    }
    cursorMs += XP_DETECT_DOTS * 40 + 70;

    // Kernel/HAL/loading boot drivers line
    revealLineAt(9, cursorMs);
    cursorMs += 70;
    revealLineAt(10, cursorMs);
    cursorMs += 70;
    revealLineAt(11, cursorMs);

    // Boot driver dots
    for (let i = 1; i <= XP_BOOT_DRIVER_DOTS; i++) {
      timeouts.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setXpBootDriverDotCount(i);
        }, cursorMs + i * 40)
      );
    }
    cursorMs += XP_BOOT_DRIVER_DOTS * 40 + 70;

    // Blank + starting windows
    revealLineAt(12, cursorMs);
    cursorMs += 70;
    revealLineAt(13, cursorMs);
    cursorMs += 300;

    // Phase 2 splash
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setXpPhase(2);
        setXpSplashVisible(false);
        window.setTimeout(() => {
          if (cancelled) return;
          setXpSplashVisible(true);
        }, 0);
      }, cursorMs)
    );

    // Hold splash for 2800ms total
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setXpPhase(3);
      }, cursorMs + 2800)
    );

    // Phase 3 fade to black 250ms
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setXpPhase(4);
      }, cursorMs + 2800 + 250)
    );
    // Then snap blue and complete
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        onComplete();
      }, cursorMs + 2800 + 260)
    );

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [onComplete, osIsWindowsXP]);

  useEffect(() => {
    if (!osIsWindows10) return;

    hasCompletedRef.current = false;
    setWin10Phase(1);
    setWin10LogoVisible(false);
    setWin10ShowDots(false);

    let cancelled = false;
    const timeouts: number[] = [];

    // Phase 1: pure black 700ms
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setWin10Phase(2);
        setWin10LogoVisible(true);
      }, 700)
    );

    // Dots appear 500ms after logo
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setWin10Phase(3);
        setWin10ShowDots(true);
      }, 1200)
    );

    // Hold for 2200ms then transition
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setWin10Phase(4);
      }, 3400)
    );

    // Fade to black 350ms
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setWin10Phase(5);
      }, 3750)
    );
    // Snap dark desktop color and complete
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        onComplete();
      }, 3760)
    );

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [onComplete, osIsWindows10]);

  useEffect(() => {
    if (!osIsMacOS) return;

    hasCompletedRef.current = false;
    setMacPhase(1);
    setMacLogoVisible(false);
    setMacShowProgress(false);
    setMacProgressFill(false);

    let cancelled = false;
    const timeouts: number[] = [];

    // Phase 1: black 500ms
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setMacPhase(2);
        setMacLogoVisible(true);
      }, 500)
    );

    // Progress bar appears 700ms after logo starts
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setMacPhase(3);
        setMacShowProgress(true);
        window.setTimeout(() => {
          if (cancelled) return;
          setMacProgressFill(true);
        }, 0);
      }, 1200)
    );

    // Fill 2400ms + hold 500ms, then transition
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setMacPhase(4);
      }, 4100)
    );

    // White fade 500ms then dark snap + complete
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setMacPhase(5);
      }, 4600)
    );
    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return;
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        onComplete();
      }, 4610)
    );

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [onComplete, osIsMacOS]);

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
      <div className="h-full w-full relative overflow-hidden bg-black text-white">
        <style>{`
          @keyframes xpMarqueeMove {
            0% { transform: translateX(-180px); }
            100% { transform: translateX(200px); }
          }
          @keyframes win10DotWave {
            0%, 100% { opacity: 0.2; transform: scale(0.6); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {xpPhase === 1 ? (
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 18,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 11,
              color: "#ffffff",
              whiteSpace: "pre",
              lineHeight: "14px",
            }}
          >
            {xpTextLines.slice(0, xpLineCount).join("\n")}
          </div>
        ) : null}

        {xpPhase === 2 ? (
          <div className="h-full w-full flex items-center justify-center">
            <div
              style={{
                opacity: xpSplashVisible ? 1 : 0,
                transition: "opacity 350ms linear",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <svg width="56" height="56" viewBox="0 0 56 56" shapeRendering="crispEdges">
                  <path d="M0 0H24L27 24H0Z" fill="#CE0000" />
                  <path d="M32 0H56L56 24H35Z" fill="#00B050" />
                  <path d="M0 32H24L27 56H0Z" fill="#0050CE" />
                  <path d="M32 32H56L56 56H35Z" fill="#FFD700" />
                </svg>
                <div style={{ marginLeft: 12 }}>
                  <div
                    style={{
                      fontFamily: '"Georgia", "Times New Roman", Times, serif',
                      fontSize: 28,
                      color: "#ffffff",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    Windows
                  </div>
                  <div
                    style={{
                      fontFamily: '"Georgia", "Times New Roman", Times, serif',
                      fontSize: 14,
                      color: "#ffffff",
                      lineHeight: "16px",
                    }}
                  >
                    XP Professional
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      width: 150,
                      height: 1,
                      background:
                        "linear-gradient(to right, #CE0000 0%, #00B050 33%, #0050CE 66%, #FFD700 100%)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  width: 200,
                  height: 8,
                  background: "#3A3A3A",
                  border: "1px solid #666666",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 1,
                    display: "flex",
                    gap: 8,
                    animation: "xpMarqueeMove 1800ms linear infinite",
                  }}
                >
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span
                      // eslint-disable-next-line react/no-array-index-key
                      key={idx}
                      style={{
                        width: 28,
                        height: 6,
                        background: "#3A88C8",
                        display: "inline-block",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 10,
                  color: "#888888",
                }}
              >
                Microsoft Corporation
              </div>
            </div>
          </div>
        ) : null}

        {xpPhase === 3 ? (
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: "linear" }}
          />
        ) : null}
        {xpPhase === 4 ? (
          <div className="absolute inset-0" style={{ background: "#2B5797" }} />
        ) : null}
      </div>
    );
  }

  if (osIsWindows10) {
    return (
      <div className="h-full w-full relative overflow-hidden bg-black">
        <style>{`
          @keyframes win10DotWave {
            0%, 100% { opacity: 0.2; transform: scale(0.6); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {(win10Phase === 2 || win10Phase === 3 || win10Phase === 4) ? (
          <div className="h-full w-full flex flex-col items-center justify-center">
            <div
              style={{
                opacity: win10LogoVisible ? 1 : 0,
                transition: "opacity 400ms linear",
              }}
            >
              <svg width="72" height="72" viewBox="0 0 72 72" shapeRendering="crispEdges">
                <path d="M0 0H32L36 32H0Z" fill="#F25022" />
                <path d="M40 0H72L72 32H44Z" fill="#7FBA00" />
                <path d="M0 40H32L36 72H0Z" fill="#00A4EF" />
                <path d="M40 40H72L72 72H44Z" fill="#FFB900" />
              </svg>
            </div>

            {win10ShowDots ? (
              <div
                style={{
                  marginTop: 32,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#ffffff",
                      animation: "win10DotWave 600ms ease-in-out infinite",
                      animationDelay: `${idx * 160}ms`,
                      display: "inline-block",
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {win10Phase === 4 ? (
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "linear" }}
          />
        ) : null}
        {win10Phase === 5 ? (
          <div className="absolute inset-0" style={{ background: "#1A1A1A" }} />
        ) : null}
      </div>
    );
  }

  if (osIsMacOS) {
    return (
      <div className="h-full w-full relative overflow-hidden bg-black">
        {(macPhase === 2 || macPhase === 3 || macPhase === 4 || macPhase === 5) ? (
          <div className="h-full w-full flex flex-col items-center justify-center">
            <div
              style={{
                opacity: macLogoVisible ? 1 : 0,
                transition: "opacity 600ms linear",
              }}
            >
              <svg width="80" height="96" viewBox="0 0 80 96" fill="none">
                <path
                  d="M52 10c4-5 4-10 3-10-5 0-10 3-13 8-2 4-3 9-2 10 5 1 9-2 12-8ZM40 24c-9 0-16 8-16 20 0 8 3 17 8 24 4 6 8 10 13 10 4 0 6-2 10-2 3 0 5 2 9 2 6 0 10-5 14-12-10-4-12-23-2-29-3-6-8-10-15-10-5 0-8 3-12 3-3 0-5-6-9-6Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>

            {macShowProgress ? (
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
                  animate={{ width: macProgressFill ? 200 : 0 }}
                  transition={{ duration: 2.4, ease: "easeInOut" }}
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

        {macPhase === 4 ? (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeIn" }}
          />
        ) : null}
        {macPhase === 5 ? (
          <div className="absolute inset-0" style={{ background: "#1E1E1E" }} />
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


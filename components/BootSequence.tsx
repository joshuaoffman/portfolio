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

export default function BootSequence({ os, onComplete }: BootSequenceProps) {
  const hasCompletedRef = useRef(false);

  const osIsWindows95 = os === "windows95";

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


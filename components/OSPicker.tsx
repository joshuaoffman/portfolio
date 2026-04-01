"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { OSName, useOS } from "@/lib/osContext";

type OsOption = {
  value: OSName;
  label: string;
  yearLabel: string;
};

const OS_OPTIONS: OsOption[] = [
  { value: "windows95", label: "Windows 95", yearLabel: "1995" },
  { value: "windowsxp", label: "Windows XP", yearLabel: "2001" },
  { value: "windows10", label: "Windows 10", yearLabel: "2015" },
];

export default function OSPicker() {
  const router = useRouter();
  const { setActiveOS } = useOS();
  const [hovered, setHovered] = useState<OSName | null>(null);

  return (
    <motion.div
      className="h-screen w-screen overflow-hidden relative bg-[#0a0a0a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      <div className="absolute left-6 top-4 select-none">
        <div
          className="text-[#e8e8e8] text-sm font-bold tracking-[0.12em]"
          style={{ fontFamily: '"IBM Plex Mono", monospace' }}
          aria-hidden
        >
          J.O
        </div>
        <div className="mt-1 text-[#444444] text-xs">joshua offman</div>
      </div>

      <div className="h-full flex flex-col items-center justify-center">
        <div className="mb-6 text-center text-[#444444] text-xs leading-tight">
          choose an operating system
        </div>

        <div className="flex flex-row items-center justify-center gap-14">
          {OS_OPTIONS.map((opt) => {
            const isHovered = hovered === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                className="bg-transparent p-0 m-0 text-white text-sm leading-none cursor-pointer"
                style={{ border: "none", padding: "6px 10px 8px" }}
                onMouseEnter={() => setHovered(opt.value)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(opt.value)}
                onBlur={() => setHovered(null)}
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log("selected os:", opt.value);
                  setActiveOS(opt.value);
                  router.push("/desktop");
                }}
                aria-label={`Select ${opt.label}`}
              >
                <span
                  className={[
                    "inline-block",
                    isHovered
                      ? "border-b border-white"
                      : "border-b border-transparent",
                    "pb-1",
                  ].join(" ")}
                >
                  {opt.label}
                </span>

                {isHovered ? (
                  <div className="mt-2 text-[#555555] text-[12px] leading-none">
                    {opt.label} → {opt.yearLabel}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center text-[#444444] text-xs leading-tight">
          you can change this anytime in settings
        </div>
      </div>
    </motion.div>
  );
}

import type { RefObject } from "react";
import { useMemo, useState } from "react";
import { motion, useDragControls } from "framer-motion";

type WinModel = {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
};

type ExperienceWindowProps = {
  win: WinModel;
  desktopConstraintsRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
};

const fontFamily = '"IBM Plex Mono", monospace';

function ButtonBevel({
  pressed,
  children,
}: {
  pressed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 16,
        height: 14,
        backgroundColor: "#C0C0C0",
        boxSizing: "border-box",
        borderTop: `1px solid ${pressed ? "#808080" : "#FFFFFF"}`,
        borderLeft: `1px solid ${pressed ? "#808080" : "#FFFFFF"}`,
        borderBottom: `1px solid ${pressed ? "#FFFFFF" : "#808080"}`,
        borderRight: `1px solid ${pressed ? "#FFFFFF" : "#808080"}`,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 1,
          height: 1,
          backgroundColor: "#000000",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(${pressed ? 1 : 0}px, ${pressed ? 1 : 0}px)`,
          fontFamily,
          fontSize: 11,
          fontWeight: 700,
          color: "#000000",
          lineHeight: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FolderIcon24() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" shapeRendering="crispEdges">
      <rect x="1" y="7" width="28" height="24" fill="#FFCC00" stroke="#000000" strokeWidth="1" />
      <rect x="4" y="4" width="14" height="5" fill="#FFCC00" stroke="#000000" strokeWidth="1" />
      <rect x="2" y="8" width="26" height="1" fill="#E6A800" />
      <rect x="3" y="9" width="11" height="6" fill="#FFE566" />
    </svg>
  );
}

function LandscapePlaceholderIcon() {
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" shapeRendering="crispEdges">
      <rect x="1" y="1" width="32" height="24" fill="none" stroke="#A0A0A0" strokeWidth="1" />
      <polygon points="25,6 29,6 29,10" fill="#A0A0A0" />
      <polygon points="4,21 12,13 17,18 21,14 30,21" fill="#A0A0A0" />
    </svg>
  );
}

type ExperienceEntry = {
  company: string;
  role: string;
  summary: string;
  bullets: string[];
};

const EXPERIENCES: ExperienceEntry[] = [
  {
    company: "greater purpose",
    role: "operations & outreach",
    summary:
      "outreach and operations work supporting large-scale events — logistics, systems, and keeping things running when they inevitably don't.",
    bullets: [
      "— built excel systems to manage 200+ attendees and 50+ volunteers",
      "— wrote python scheduling logic to assign shifts and flag conflicts",
      "— applied constraint-based planning for staffing and inventory",
      "— managed live event operations, reallocating resources in real time",
    ],
  },
  {
    company: "spire philanthropy",
    role: "data & operations",
    summary:
      "supported project operations through data management and process optimization across multiple active projects.",
    bullets: [
      "— cleaned and maintained datasets of 500–2,000 rows for tracking and outreach",
      "— built dashboards in excel and google sheets for multi-project monitoring",
      "— automated reporting workflows, cutting prep time by 30–40%",
      "— created structured summaries for internal project tracking",
    ],
  },
  {
    company: "chuck e. cheese",
    role: "performer & pizza specialist",
    summary: "made pizzas. dressed up as a mouse. ate pizza.",
    bullets: [],
  },
];

function PhotoColumn() {
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 160,
          height: 120,
          background: "#D8D8D8",
          border: "1px solid #A0A0A0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <LandscapePlaceholderIcon />
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily,
          fontSize: 9,
          color: "#888888",
          lineHeight: "11px",
          textAlign: "center",
          textTransform: "lowercase",
        }}
      >
        fig 1: [ add caption ]
      </div>
    </div>
  );
}

function ExperienceRow({ entry }: { entry: ExperienceEntry }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "14px 8px",
        borderBottom: "1px solid #E0E0E0",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 180,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <FolderIcon24 />
        <div
          style={{
            marginTop: 4,
            fontFamily,
            fontSize: 11,
            fontWeight: 700,
            color: "#000000",
            lineHeight: "13px",
            textTransform: "lowercase",
          }}
        >
          {entry.company}
        </div>
        <div
          style={{
            marginTop: 2,
            fontFamily,
            fontSize: 9,
            color: "#888888",
            lineHeight: "12px",
            textTransform: "lowercase",
          }}
        >
          {entry.role}
        </div>
      </div>

      <div
        style={{
          flex: "1 1 auto",
          padding: "0 16px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 10,
            color: "#333333",
            lineHeight: "14px",
            textTransform: "lowercase",
          }}
        >
          {entry.summary}
        </div>
        {entry.bullets.length > 0 ? (
          <ul
            style={{
              margin: "8px 0 0",
              padding: 0,
              listStyle: "none",
            }}
          >
            {entry.bullets.map((b) => (
              <li
                key={b}
                style={{
                  fontFamily,
                  fontSize: 10,
                  color: "#555555",
                  lineHeight: "14px",
                  marginTop: 4,
                  textTransform: "lowercase",
                }}
              >
                {b}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <PhotoColumn />
    </div>
  );
}

export function ExperienceExplorerContent() {
  return (
    <>
      <div
        style={{
          background: "#C0C0C0",
          borderBottom: "1px solid #808080",
          padding: "4px 8px",
          fontFamily,
          fontSize: 10,
          color: "#555555",
          lineHeight: "12px",
          textTransform: "lowercase",
          boxSizing: "border-box",
        }}
      >
        c:\experience\index — 3 items found
      </div>
      {EXPERIENCES.map((e) => (
        <ExperienceRow key={e.company} entry={e} />
      ))}
    </>
  );
}

export default function ExperienceWindow({
  win,
  desktopConstraintsRef,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
}: ExperienceWindowProps) {
  const dragControls = useDragControls();
  const [pressed, setPressed] = useState<null | "min" | "max" | "close">(null);

  const frameStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: win.position.x,
      top: win.position.y,
      width: win.size.width,
      height: win.size.height,
      zIndex: win.zIndex,
      userSelect: "none" as const,
      boxSizing: "border-box" as const,
      borderTop: "2px solid #FFFFFF",
      borderLeft: "2px solid #FFFFFF",
      borderBottom: "2px solid #000000",
      borderRight: "2px solid #000000",
      backgroundColor: "#C0C0C0",
    }),
    [win.position.x, win.position.y, win.size.width, win.size.height, win.zIndex]
  );

  return (
    <motion.div
      style={frameStyle}
      drag={!win.maximized}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={desktopConstraintsRef}
      dragElastic={0}
      onPointerDown={onFocus}
      onDragEnd={(event, info) => {
        onMove(win.position.x + info.delta.x, win.position.y + info.delta.y);
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 2,
          boxSizing: "border-box",
          borderTop: "1px solid #C0C0C0",
          borderLeft: "1px solid #C0C0C0",
          borderBottom: "1px solid #808080",
          borderRight: "1px solid #808080",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "#C0C0C0",
        }}
      >
        <div
          style={{
            height: 18,
            backgroundColor: "#000080",
            display: "flex",
            alignItems: "center",
            paddingLeft: 2,
            paddingRight: 0,
            boxSizing: "border-box",
            cursor: win.maximized ? "default" : "move",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onFocus();
            if (!win.maximized) dragControls.start(e);
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              paddingLeft: 2,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 auto",
            }}
          >
            <div style={{ width: 12, height: 12, backgroundColor: "#808080" }} />
          </div>
          <div
            style={{
              flex: "1 1 auto",
              fontFamily,
              fontSize: 11,
              fontWeight: 700,
              color: "#FFFFFF",
              paddingLeft: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1,
              paddingTop: 1,
              textTransform: "lowercase",
            }}
          >
            experience
          </div>
          <div style={{ display: "flex", flex: "0 0 auto" }}>
            <div
              role="button"
              aria-label="Minimize"
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressed("min");
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressed(null);
                onMinimize();
              }}
              onPointerCancel={() => setPressed(null)}
              style={{ cursor: "default" }}
            >
              <ButtonBevel pressed={pressed === "min"}>_</ButtonBevel>
            </div>
            <div
              role="button"
              aria-label="Maximize"
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressed("max");
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressed(null);
                onMaximize();
              }}
              onPointerCancel={() => setPressed(null)}
              style={{ cursor: "default" }}
            >
              <ButtonBevel pressed={pressed === "max"}>{win.maximized ? "❐" : "□"}</ButtonBevel>
            </div>
            <div
              role="button"
              aria-label="Close"
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressed("close");
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressed(null);
                onClose();
              }}
              onPointerCancel={() => setPressed(null)}
              style={{ cursor: "default" }}
            >
              <ButtonBevel pressed={pressed === "close"}>✕</ButtonBevel>
            </div>
          </div>
        </div>

        <div
          style={{
            height: 18,
            backgroundColor: "#C0C0C0",
            display: "flex",
            alignItems: "center",
            boxSizing: "border-box",
            paddingLeft: 6,
            fontFamily,
            fontSize: 11,
            color: "#000000",
            borderBottom: "1px solid #808080",
            textTransform: "lowercase",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onFocus();
          }}
        >
          <div style={{ paddingRight: 12 }}>file</div>
          <div style={{ paddingRight: 12 }}>edit</div>
          <div style={{ paddingRight: 12 }}>view</div>
          <div style={{ paddingRight: 12 }}>help</div>
        </div>

        <div
          style={{
            flex: "1 1 auto",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #808080",
            borderLeft: "1px solid #808080",
            borderBottom: "1px solid #FFFFFF",
            borderRight: "1px solid #FFFFFF",
            boxSizing: "border-box",
            overflow: "hidden",
            minHeight: 0,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onFocus();
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#FFFFFF",
              padding: 12,
              boxSizing: "border-box",
              overflowY: "auto",
              overflowX: "hidden",
              fontFamily,
            }}
          >
            <ExperienceExplorerContent />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

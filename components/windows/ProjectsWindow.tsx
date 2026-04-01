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

type ProjectsWindowProps = {
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

function PlayTriangleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" shapeRendering="crispEdges">
      <polygon points="4,2 4,20 19,11" fill="#808080" stroke="#000000" strokeWidth="1" />
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

type ProjectVisual = { kind: "video" | "photo" };

type ProjectEntry = {
  name: string;
  typeLabel: string;
  description: string;
  bullets: string[];
  visuals?: ProjectVisual[];
};

const PROJECTS: ProjectEntry[] = [
  {
    name: "pilot plant vr simulator",
    typeLabel: "engineering project",
    description:
      "a virtual training environment modeling industrial processes with strict operational constraints and failure conditions.",
    bullets: [
      "— modeled system behavior and failure states in unity",
      "— built state machines to enforce safe operation sequences",
      "— designed repeatable simulation logic for operator training",
    ],
    visuals: [{ kind: "video" }, { kind: "photo" }],
  },
  {
    name: "supply chain intelligence",
    typeLabel: "contract work",
    description:
      "combined two engagements into one system — built an ai-driven traceability concept for a lobster supply chain and a global trade data platform to surface buyers, suppliers, and market trends.",
    bullets: [
      "— mapped harvest-to-distribution flow and identified visibility gaps",
      "— structured fragmented import/export data into actionable lead generation",
      "— proposed predictive tools to reduce waste and optimize logistics",
    ],
  },
  {
    name: "visualyze",
    typeLabel: "personal project",
    description:
      "a sports analytics web app for analyzing and comparing player and team performance using real statistical data.",
    bullets: [
      "— built react app that ingests csv data and maps it into structured json",
      "— designed scenario-based comparison system without shared state",
      "— implemented real-time statistical validation and performance calculations",
    ],
  },
  {
    name: "a-10 thunderbolt ii",
    typeLabel: "cad model — solidworks",
    description:
      "a 1:72 scale cad model of the a-10 thunderbolt ii built entirely from scratch in solidworks, using only personal measurements and reference photos. no blueprints, no downloaded geometry.",
    bullets: [
      "— took own measurements and references to reconstruct airframe geometry",
      "— modeled full exterior including fuselage, wings, engines, and landing gear",
      "— built entirely from scratch as a personal challenge in precision modeling",
    ],
    visuals: [{ kind: "photo" }],
  },
  {
    name: "bottle cap launcher",
    typeLabel: "mechanical build",
    description:
      "a spring-powered mechanical system built to launch bottle caps with controlled force and consistency.",
    bullets: [
      "— designed spring and solenoid release mechanism from scratch",
      "— optimized geometry for energy transfer efficiency",
      "— implemented arduino control logic and tested performance",
    ],
    visuals: [{ kind: "photo" }],
  },
];

function VisualPlaceholder({ visual, figureIndex }: { visual: ProjectVisual; figureIndex: number }) {
  const caption = `fig ${figureIndex}: [ add caption ]`;
  return (
    <>
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
        {visual.kind === "video" ? <PlayTriangleIcon /> : <LandscapePlaceholderIcon />}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily,
          fontSize: 9,
          color: "#555555",
          lineHeight: "11px",
          textAlign: "center",
          textTransform: "lowercase",
        }}
      >
        {caption}
      </div>
    </>
  );
}

function ProjectRow({ project }: { project: ProjectEntry }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        columnGap: 0,
        rowGap: 12,
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
          {project.name}
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
          {project.typeLabel}
        </div>
      </div>

      <div
        style={{
          flex: "1 1 220px",
          padding: "0 16px",
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 10,
            color: "#333333",
            lineHeight: "14px",
            textTransform: "lowercase",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical" as const,
            WebkitLineClamp: 4,
            overflow: "hidden",
          }}
        >
          {project.description}
        </div>
        <ul
          style={{
            margin: "8px 0 0",
            padding: 0,
            listStyle: "none",
          }}
        >
          {project.bullets.map((b) => (
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
      </div>

      {project.visuals && project.visuals.length > 0 ? (
        <div
          style={{
            flexShrink: 0,
            flexBasis: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          {project.visuals.map((v, i) => (
            <div key={`${v.kind}-${i}`} style={{ marginTop: i > 0 ? 8 : 0 }}>
              <VisualPlaceholder visual={v} figureIndex={i + 1} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Explorer body (toolbar + rows) — use inside Win95 chrome or themed window client. */
export function ProjectsExplorerContent() {
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
        c:\projects\index — 5 items found
      </div>
      {PROJECTS.map((p) => (
        <ProjectRow key={p.name} project={p} />
      ))}
    </>
  );
}

export default function ProjectsWindow({
  win,
  desktopConstraintsRef,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
}: ProjectsWindowProps) {
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
            projects
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
              minHeight: 0,
              background: "#FFFFFF",
              padding: 12,
              boxSizing: "border-box",
              overflow: "auto",
              fontFamily,
            }}
          >
            <ProjectsExplorerContent />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

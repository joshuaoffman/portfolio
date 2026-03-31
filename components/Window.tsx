import type { ReactNode, RefObject } from "react";
import { useCallback, useMemo, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import type { Win95Window } from "@/lib/windowManager";

type WindowProps = {
  win: Win95Window;
  titleIcon: ReactNode;
  desktopConstraintsRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
};

const fontFamily = '"IBM Plex Mono", monospace';

function RaisedBevel({ sunken }: { sunken: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#C0C0C0",
        boxSizing: "border-box",
        borderTop: `1px solid ${sunken ? "#808080" : "#FFFFFF"}`,
        borderLeft: `1px solid ${sunken ? "#808080" : "#FFFFFF"}`,
        borderBottom: `1px solid ${sunken ? "#FFFFFF" : "#808080"}`,
        borderRight: `1px solid ${sunken ? "#FFFFFF" : "#808080"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}

export default function Window({
  win,
  titleIcon,
  desktopConstraintsRef,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
}: WindowProps) {
  const dragControls = useDragControls();
  const [pressed, setPressed] = useState<null | "min" | "max" | "close">(null);

  const isDraggable = !win.minimized && !win.maximized;

  const left = win.position.x;
  const top = win.position.y;
  const width = win.size.width;
  const height = win.size.height;

  const titleBarText = win.title;

  const startDrag = useCallback(
    (e: any) => {
      if (!isDraggable) return;
      dragControls.start(e);
    },
    [dragControls, isDraggable]
  );

  const frameBorderStyle = useMemo(
    () => ({
      borderTop: "2px solid #FFFFFF",
      borderLeft: "2px solid #FFFFFF",
      borderBottom: "2px solid #000000",
      borderRight: "2px solid #000000",
      boxSizing: "border-box" as const,
      position: "absolute" as const,
      left,
      top,
      width,
      height,
      zIndex: win.zIndex,
      userSelect: "none" as const,
    }),
    [height, left, top, width, win.zIndex]
  );

  return (
    <motion.div
      style={frameBorderStyle}
      drag={isDraggable ? true : false}
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
          width: "calc(100% - 0px)",
          height: "calc(100% - 0px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: 18,
            background: "linear-gradient(to right, #000080, #1084d0)",
            display: "flex",
            alignItems: "center",
            cursor: isDraggable ? "move" : "default",
            paddingLeft: 2,
            paddingRight: 2,
            boxSizing: "border-box",
          }}
          onPointerDown={startDrag}
        >
          <div style={{ width: 16, height: 16, flex: "0 0 auto" }}>{titleIcon}</div>

          <div
            style={{
              fontFamily,
              fontSize: 11,
              fontWeight: 700,
              color: "#FFFFFF",
              marginLeft: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: "1 1 auto",
              lineHeight: 1,
              paddingTop: 1,
            }}
          >
            {titleBarText}
          </div>

          <div style={{ display: "flex", flex: "0 0 auto" }}>
            {/* Minimize */}
            <div
              role="button"
              aria-label="Minimize"
              style={{
                width: 16,
                height: 14,
                marginLeft: 2,
                cursor: "default",
              }}
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
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                <RaisedBevel sunken={pressed === "min"} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontFamily,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  _
                </div>
              </div>
            </div>

            {/* Maximize / Restore */}
            <div
              role="button"
              aria-label="Maximize"
              style={{
                width: 16,
                height: 14,
                marginLeft: 2,
                cursor: "default",
              }}
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
            >
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <RaisedBevel sunken={pressed === "max"} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontFamily,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {win.maximized ? "❐" : "□"}
                </div>
              </div>
            </div>

            {/* Close */}
            <div
              role="button"
              aria-label="Close"
              style={{
                width: 16,
                height: 14,
                marginLeft: 2,
                cursor: "default",
              }}
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
            >
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <RaisedBevel sunken={pressed === "close"} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontFamily,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu bar */}
        <div
          style={{
            height: 18,
            backgroundColor: "#C0C0C0",
            display: "flex",
            alignItems: "center",
            boxSizing: "border-box",
            padding: "0 0px",
            fontFamily,
            fontSize: 11,
            color: "#000000",
          }}
        >
          {["File", "Edit", "View", "Help"].map((item) => (
            <div
              key={item}
              style={{
                padding: "0 6px",
                cursor: "default",
                userSelect: "none",
                lineHeight: 1,
              }}
              onPointerDown={(e) => {
                // Win95 behavior: clicking does nothing in our mock.
                e.stopPropagation();
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            flex: "1 1 auto",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #808080",
            borderLeft: "1px solid #808080",
            borderBottom: "1px solid #FFFFFF",
            borderRight: "1px solid #FFFFFF",
            boxSizing: "border-box",
            paddingLeft: 4,
            paddingTop: 3,
            fontFamily,
            fontSize: 11,
            color: "#000000",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onFocus();
          }}
        >
          [content coming soon]
        </div>
      </div>
    </motion.div>
  );
}

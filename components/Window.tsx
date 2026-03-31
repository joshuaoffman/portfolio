import type { RefObject } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, useDragControls } from "framer-motion";

export type Win95WindowModel = {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
};

type WindowProps = {
  win: Win95WindowModel;
  desktopConstraintsRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
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

export default function Window({
  win,
  desktopConstraintsRef,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
}: WindowProps) {
  const dragControls = useDragControls();
  const [pressed, setPressed] = useState<null | "min" | "max" | "close">(null);
  const [liveSize, setLiveSize] = useState(win.size);

  useEffect(() => {
    setLiveSize(win.size);
  }, [win.size.height, win.size.width]);

  const frameStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: win.position.x,
      top: win.position.y,
      width: liveSize.width,
      height: liveSize.height,
      zIndex: win.zIndex,
      userSelect: "none" as const,
      boxSizing: "border-box" as const,
      borderTop: "2px solid #FFFFFF",
      borderLeft: "2px solid #FFFFFF",
      borderBottom: "2px solid #000000",
      borderRight: "2px solid #000000",
      backgroundColor: "#C0C0C0",
    }),
    [liveSize.height, liveSize.width, win.position.x, win.position.y, win.zIndex]
  );

  const startResize = (e: any, dir: "right" | "bottom" | "corner") => {
    e.stopPropagation();
    onFocus();
    if (win.maximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = liveSize.width;
    const startH = liveSize.height;

    const constraintsEl = desktopConstraintsRef.current;
    const maxW = constraintsEl ? constraintsEl.clientWidth - win.position.x : window.innerWidth - win.position.x;
    const maxH = constraintsEl ? constraintsEl.clientHeight - win.position.y : window.innerHeight - 28 - win.position.y;

    const minW = 200;
    const minH = 150;

    let committedW = startW;
    let committedH = startH;

    const onMovePointer = (pe: PointerEvent) => {
      const dx = pe.clientX - startX;
      const dy = pe.clientY - startY;

      let nextW = startW;
      let nextH = startH;
      if (dir === "right" || dir === "corner") {
        nextW = Math.max(minW, Math.min(maxW, startW + dx));
      }
      if (dir === "bottom" || dir === "corner") {
        nextH = Math.max(minH, Math.min(maxH, startH + dy));
      }

      committedW = nextW;
      committedH = nextH;
      setLiveSize({ width: nextW, height: nextH });
    };

    const onUpPointer = () => {
      window.removeEventListener("pointermove", onMovePointer);
      window.removeEventListener("pointerup", onUpPointer);
      onResize?.(committedW, committedH);
    };

    window.addEventListener("pointermove", onMovePointer);
    window.addEventListener("pointerup", onUpPointer);
  };

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
      {/* Inner bevel */}
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
        {/* Title bar */}
        <div
          style={{
            height: 18,
            background: "linear-gradient(to right, #000080, #1084d0)",
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
              fontFamily,
              fontSize: 11,
              fontWeight: 700,
              color: "#FFFFFF",
              paddingLeft: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: "1 1 auto",
              lineHeight: 1,
              paddingTop: 1,
            }}
          >
            {win.title}
          </div>

          {/* Buttons: no gap */}
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

        {/* Menu bar */}
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
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onFocus();
          }}
        >
          <div style={{ paddingRight: 12, cursor: "default" }}>File</div>
          <div style={{ paddingRight: 12, cursor: "default" }}>Edit</div>
          <div style={{ paddingRight: 12, cursor: "default" }}>View</div>
          <div style={{ paddingRight: 12, cursor: "default" }}>Help</div>
        </div>

        {/* Content area */}
        <div
          style={{
            flex: "1 1 auto",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #808080",
            borderLeft: "1px solid #808080",
            borderBottom: "1px solid #FFFFFF",
            borderRight: "1px solid #FFFFFF",
            boxSizing: "border-box",
            padding: 8,
            overflow: "auto",
            fontFamily,
            fontSize: 11,
            color: "#000000",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onFocus();
          }}
        >
          test
        </div>

        {/* Right edge resize handle */}
        {!win.maximized ? (
          <div
            role="presentation"
            onPointerDown={(e) => startResize(e, "right")}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 4,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 5,
            }}
          />
        ) : null}

        {/* Bottom edge resize handle */}
        {!win.maximized ? (
          <div
            role="presentation"
            onPointerDown={(e) => startResize(e, "bottom")}
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              height: 4,
              cursor: "ns-resize",
              zIndex: 5,
            }}
          />
        ) : null}

        {/* Bottom-right corner Win95 grip */}
        {!win.maximized ? (
          <div
            role="presentation"
            onPointerDown={(e) => startResize(e, "corner")}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 12,
              height: 12,
              cursor: "nwse-resize",
              zIndex: 6,
              backgroundColor: "#FFFFFF",
              borderLeft: "1px solid #808080",
              borderTop: "1px solid #808080",
              boxSizing: "border-box",
            }}
          >
            <svg
              viewBox="0 0 12 12"
              width="12"
              height="12"
              shapeRendering="crispEdges"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="9" width="1" height="1" fill="#808080" />
              <rect x="6" y="9" width="1" height="1" fill="#808080" />
              <rect x="9" y="9" width="1" height="1" fill="#808080" />
              <rect x="6" y="6" width="1" height="1" fill="#808080" />
              <rect x="9" y="6" width="1" height="1" fill="#808080" />
              <rect x="9" y="3" width="1" height="1" fill="#808080" />
            </svg>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

import { useCallback, useMemo, useRef, useState } from "react";

export type WindowPos = { x: number; y: number };
export type WindowSize = { width: number; height: number };

export type Win95Window = {
  id: string;
  title: string;
  position: WindowPos;
  size: WindowSize;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
};

export type UseWindowManagerArgs = {
  desktopArea: { width: number; height: number };
  windowTitles: Record<string, string>;
  defaultWindowSize?: WindowSize;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function useWindowManager({
  desktopArea,
  windowTitles,
  defaultWindowSize = { width: 400, height: 300 },
}: UseWindowManagerArgs) {
  const [openWindows, setOpenWindows] = useState<Win95Window[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);

  const nextZRef = useRef(10);
  const savedRectsRef = useRef<
    Record<
      string,
      { position: WindowPos; size: WindowSize } | undefined
    >
  >({});

  const getCenteredPosition = useCallback((): WindowPos => {
    const x = Math.round((desktopArea.width - defaultWindowSize.width) / 2);
    const y = Math.round((desktopArea.height - defaultWindowSize.height) / 2);

    const maxX = desktopArea.width - defaultWindowSize.width;
    const maxY = desktopArea.height - defaultWindowSize.height;

    return {
      x: clamp(x, 0, Math.max(0, maxX)),
      y: clamp(y, 0, Math.max(0, maxY)),
    };
  }, [desktopArea.height, desktopArea.width, defaultWindowSize.height, defaultWindowSize.width]);

  const focusWindow = useCallback((id: string) => {
    setOpenWindows((prev) => {
      const nextZ = nextZRef.current + 1;
      nextZRef.current = nextZ;
      return prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ } : w));
    });
    setFocusedWindowId(id);
  }, []);

  const openWindow = useCallback(
    (id: string) => {
      const title = windowTitles[id] ?? id;

      const initialRect = (() => {
        const position = getCenteredPosition();
        return { position, size: { ...defaultWindowSize } };
      })();

      setOpenWindows((prev) => {
        const existing = prev.find((w) => w.id === id);
        const nextZ = nextZRef.current + 1;
        nextZRef.current = nextZ;

        if (existing) {
          return prev.map((w) => {
            if (w.id !== id) return w;
            return {
              ...w,
              minimized: false,
              zIndex: nextZ,
            };
          });
        }

        return [
          ...prev,
          {
            id,
            title,
            position: initialRect.position,
            size: initialRect.size,
            zIndex: nextZ,
            minimized: false,
            maximized: false,
          },
        ];
      });

      setFocusedWindowId(id);
    },
    [defaultWindowSize, getCenteredPosition, windowTitles]
  );

  const closeWindow = useCallback((id: string) => {
    setOpenWindows((prev) => prev.filter((w) => w.id !== id));
    setFocusedWindowId((prevFocused) => {
      if (prevFocused !== id) return prevFocused;

      const remaining = openWindows
        .filter((w) => w.id !== id)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      return remaining ? remaining.id : null;
    });
  }, [openWindows]);

  const minimizeWindow = useCallback(
    (id: string) => {
      setOpenWindows((prev) => {
        const wasFocused = id === focusedWindowId;
        const next = prev.map((w) => (w.id === id ? { ...w, minimized: true } : w));

        if (wasFocused) {
          const nextFocused = [...next]
            .filter((w) => !w.minimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0];
          setFocusedWindowId(nextFocused ? nextFocused.id : null);
        }

        return next;
      });
    },
    [focusedWindowId]
  );

  const maximizeWindow = useCallback(
    (id: string) => {
      setOpenWindows((prev) => {
        const nextZ = nextZRef.current + 1;
        nextZRef.current = nextZ;

        const areaSize: WindowSize = {
          width: desktopArea.width,
          height: desktopArea.height,
        };

        return prev.map((w) => {
          if (w.id !== id) return w;

          if (!w.maximized) {
            savedRectsRef.current[id] = {
              position: w.position,
              size: w.size,
            };
            return {
              ...w,
              maximized: true,
              minimized: false,
              zIndex: nextZ,
              position: { x: 0, y: 0 },
              size: areaSize,
            };
          }

          const saved = savedRectsRef.current[id];
          const restoredPos = saved?.position ?? getCenteredPosition();
          const restoredSize = saved?.size ?? defaultWindowSize;

          return {
            ...w,
            maximized: false,
            minimized: false,
            zIndex: nextZ,
            position: {
              x: clamp(restoredPos.x, 0, Math.max(0, desktopArea.width - restoredSize.width)),
              y: clamp(restoredPos.y, 0, Math.max(0, desktopArea.height - restoredSize.height)),
            },
            size: restoredSize,
          };
        });
      });

      focusWindow(id);
    },
    [desktopArea.height, desktopArea.width, defaultWindowSize, focusWindow, getCenteredPosition]
  );

  const moveWindow = useCallback(
    (id: string, x: number, y: number) => {
      setOpenWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          if (w.minimized) return w;
          if (w.maximized) return w;

          const clampedX = clamp(x, 0, Math.max(0, desktopArea.width - w.size.width));
          const clampedY = clamp(y, 0, Math.max(0, desktopArea.height - w.size.height));
          return { ...w, position: { x: clampedX, y: clampedY } };
        })
      );
    },
    [desktopArea.height, desktopArea.width]
  );

  // Useful for taskbar bevel state
  const focusedWindow = useMemo(
    () => openWindows.find((w) => w.id === focusedWindowId) ?? null,
    [focusedWindowId, openWindows]
  );

  const focusMostRecentVisibleWindow = useCallback(() => {
    const visible = openWindows
      .filter((w) => !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];
    setFocusedWindowId(visible ? visible.id : null);
  }, [openWindows]);

  // Keep focus sane if desktop size changes and constraints shift.
  // This intentionally does not modify zIndex ordering beyond clamping.
  const clampAllWindowsToDesktop = useCallback(() => {
    setOpenWindows((prev) =>
      prev.map((w) => {
        if (w.maximized) return w;
        const clampedX = clamp(w.position.x, 0, Math.max(0, desktopArea.width - w.size.width));
        const clampedY = clamp(w.position.y, 0, Math.max(0, desktopArea.height - w.size.height));
        return { ...w, position: { x: clampedX, y: clampedY } };
      })
    );
    // Ensure focused id points to something visible.
    if (focusedWindowId) {
      const stillExistsAndVisible = openWindows.some((w) => w.id === focusedWindowId && !w.minimized);
      if (!stillExistsAndVisible) focusMostRecentVisibleWindow();
    }
  }, [desktopArea.height, desktopArea.width, focusMostRecentVisibleWindow, focusedWindowId, openWindows]);

  return {
    openWindows,
    focusedWindow,
    focusedWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    moveWindow,
    clampAllWindowsToDesktop,
  };
}


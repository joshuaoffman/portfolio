const font = '"IBM Plex Mono", monospace';

function PortraitPlaceholder() {
  return (
    <svg
      width="56"
      height="72"
      viewBox="0 0 56 72"
      aria-hidden
      style={{ display: "block" }}
    >
      <ellipse cx="28" cy="18" rx="12" ry="14" fill="#A0A0A0" />
      <path d="M10 72 L10 46 Q28 32 46 46 L46 72 Z" fill="#A0A0A0" />
    </svg>
  );
}

export default function AboutWindow() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        fontFamily: font,
        textTransform: "lowercase",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          background: "#C0C0C0",
          borderBottom: "1px solid #808080",
          padding: "4px 8px",
          fontSize: 10,
          color: "#555555",
          boxSizing: "border-box",
        }}
      >
        c:\about\joshua_offman.txt
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "row",
          padding: 16,
          gap: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 180,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              width: 160,
              height: 200,
              background: "#D8D8D8",
              border: "1px solid #A0A0A0",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PortraitPlaceholder />
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 9,
              color: "#888888",
              textAlign: "center",
            }}
          >
            fig 1: [ add photo ]
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000000" }}>joshua offman</div>
            <div style={{ marginTop: 6, fontSize: 10, color: "#555555" }}>mechanical engineering student</div>
            <div style={{ marginTop: 4, fontSize: 10, color: "#555555" }}>university of ottawa</div>
          </div>

          <div
            style={{
              marginTop: 12,
              marginBottom: 12,
              height: 1,
              background: "#E0E0E0",
              width: "100%",
            }}
          />

          <div style={{ fontSize: 10, color: "#333333", lineHeight: 1.5 }}>
            <div>📍 toronto / ottawa, on</div>
            <div style={{ marginTop: 6 }}>🎓 b.eng — mechanical</div>
            <div style={{ marginTop: 6 }}>⚙️ systems, data, software</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 9, color: "#888888" }}>about.txt</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#333333", lineHeight: 1.8 }}>
            <p style={{ margin: 0 }}>
              i'm a mechanical engineering student at the university of ottawa. i got into engineering because i like
              understanding how things work, and i've stayed because it turns out building things that actually function
              the way you intended is a lot harder and more interesting than it sounds.
            </p>
            <p style={{ margin: "14px 0 0 0" }}>
              a lot of my projects end up mixing engineering with software and data in some way. not really by design,
              just because most interesting problems don't stay in one lane. i like working on things that have some
              structure and logic to them, and i like seeing them actually work at the end. i also built this site to
              look like a desktop os because i thought it would be fun, and it was.
            </p>
          </div>

          <div style={{ marginTop: 14, height: 1, background: "#E0E0E0", width: "100%" }} />

          <div style={{ marginTop: 12, fontSize: 9, color: "#888888" }}>
            last updated: 2025 — university of ottawa, faculty of engineering
          </div>
        </div>
      </div>
    </div>
  );
}

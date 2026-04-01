import type { CSSProperties } from "react";

const font = '"IBM Plex Mono", monospace';

const linkStyle: CSSProperties = {
  fontFamily: font,
  fontSize: 12,
  color: "#0078D7",
  textDecoration: "none",
  cursor: "pointer",
};

export default function ContactWindow() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        fontFamily: font,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `.contact-window-link:hover { text-decoration: underline; }`,
        }}
      />
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
        c:\contact\index
      </div>
      <div
        style={{
          padding: 24,
          fontSize: 12,
          color: "#333333",
          lineHeight: 1.55,
          textTransform: "lowercase",
          boxSizing: "border-box",
        }}
      >
        <div>
          you can reach me at{" "}
          <a className="contact-window-link" href="mailto:joffm034@uottawa.ca" style={linkStyle}>
            joffm034@uottawa.ca
          </a>
        </div>
        <div style={{ marginTop: "0.65em" }}>
          or shoot me a message on my{" "}
          <a
            className="contact-window-link"
            href="https://www.linkedin.com/in/joshua-offman-3011392b3/"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            linkedin
          </a>
          !
        </div>
      </div>
    </div>
  );
}

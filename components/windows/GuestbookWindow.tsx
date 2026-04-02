"use client";

import type { OSName } from "@/lib/osContext";
import type { CSSProperties, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

const font = '"IBM Plex Mono", monospace';

export type GuestbookComment = {
  id: string;
  name: string;
  message: string;
  timestamp: string;
};

type GuestTheme = "windows95" | "windowsxp" | "windows10";

type GuestbookWindowProps = {
  theme: OSName;
};

function formatNoteTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mon = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const min = String(m).padStart(2, "0");
  return `${mon} ${day} ${year} ${h}:${min} ${ampm}`;
}

function stickyNoteStyles(t: GuestTheme): {
  card: React.CSSProperties;
  nameColor: string;
  msgColor: string;
  tsColor: string;
} {
  if (t === "windowsxp") {
    return {
      card: {
        background: "#FFF5A0",
        border: "1px solid #C8C800",
        padding: "8px 10px",
        marginBottom: 8,
        boxSizing: "border-box",
      },
      nameColor: "#000000",
      msgColor: "#333333",
      tsColor: "#888888",
    };
  }
  if (t === "windows10") {
    return {
      card: {
        background: "#2A2A1A",
        border: "1px solid #4A4A2A",
        padding: "8px 10px",
        marginBottom: 8,
        boxSizing: "border-box",
      },
      nameColor: "#E0E0A0",
      msgColor: "#E0E0A0",
      tsColor: "#888888",
    };
  }
  return {
    card: {
      background: "#FFFFC0",
      border: "1px solid #808080",
      padding: "10px 12px",
      marginBottom: 8,
      boxSizing: "border-box" as const,
    },
    nameColor: "#000000",
    msgColor: "#333333",
    tsColor: "#888888",
  };
}

export default function GuestbookWindow({ theme }: GuestbookWindowProps) {
  const guestTheme: GuestTheme =
    theme === "windowsxp" ? "windowsxp" : theme === "windows10" ? "windows10" : "windows95";
  const noteStyles = useMemo(() => stickyNoteStyles(guestTheme), [guestTheme]);

  const [comments, setComments] = useState<GuestbookComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profanityMsg, setProfanityMsg] = useState<string | null>(null);
  const [btnHover, setBtnHover] = useState(false);

  const fetchComments = useCallback(async (opts?: { showListLoading?: boolean }) => {
    const showListLoading = opts?.showListLoading !== false;
    if (showListLoading) setLoading(true);
    try {
      const res = await fetch("/api/comments");
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as GuestbookComment[];
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      if (showListLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (!profanityMsg) return;
    const t = window.setTimeout(() => setProfanityMsg(null), 3000);
    return () => window.clearTimeout(t);
  }, [profanityMsg]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setProfanityMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 400 && typeof data.error === "string") {
        setProfanityMsg(data.error);
        return;
      }
      if (!res.ok) {
        if (typeof data.error === "string") setProfanityMsg(data.error);
        return;
      }
      setName("");
      setMessage("");
      await fetchComments({ showListLoading: false });
    } finally {
      setSubmitting(false);
    }
  };

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
        overflow: "hidden",
      }}
    >
      {/* Section 1 — compose */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            background: "#C0C0C0",
            borderBottom: "1px solid #808080",
            padding: "4px 8px",
            fontFamily: font,
            fontSize: 10,
            color: "#555555",
            boxSizing: "border-box",
          }}
        >
          c:\notes\new_message.txt
        </div>
        <form onSubmit={onSubmit} style={{ padding: 12, boxSizing: "border-box" }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name..."
            autoComplete="off"
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: font,
              fontSize: 11,
              border: "1px solid #808080",
              borderRadius: 0,
              padding: 4,
            }}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="leave a message! it will be publicly visible on the notepad"
            style={{
              marginTop: 8,
              width: "100%",
              height: 80,
              boxSizing: "border-box",
              fontFamily: font,
              fontSize: 11,
              border: "1px solid #808080",
              borderRadius: 0,
              padding: 4,
              resize: "none",
            }}
          />
          <div style={{ marginTop: 6, fontFamily: font, fontSize: 9, color: "#888888" }}>
            messages are public and visible to all visitors
          </div>
          <button
            type="submit"
            disabled={submitting}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              marginTop: 10,
              fontFamily: font,
              fontSize: 11,
              background: btnHover ? "#B8B8B8" : "#C0C0C0",
              border: "1px solid #808080",
              borderRadius: 0,
              padding: "4px 12px",
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            post note
          </button>
          {profanityMsg ? (
            <div style={{ marginTop: 8, fontFamily: font, fontSize: 11, color: "#CC0000" }}>{profanityMsg}</div>
          ) : null}
        </form>
      </div>

      {/* Section 2 — board */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", borderTop: "1px solid #E0E0E0" }}>
        <div
          style={{
            flexShrink: 0,
            background: "#C0C0C0",
            borderBottom: "1px solid #808080",
            padding: "4px 8px",
            fontFamily: font,
            fontSize: 10,
            color: "#555555",
            boxSizing: "border-box",
          }}
        >
          c:\notes\public_board.txt — {comments.length} notes
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: 12,
            boxSizing: "border-box",
            background: "#FFFFFF",
          }}
        >
          {loading ? (
            <div style={{ fontFamily: font, fontSize: 10, color: "#888888" }}>loading notes...</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={noteStyles.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: font,
                      fontSize: 10,
                      fontWeight: 700,
                      color: noteStyles.nameColor,
                    }}
                  >
                    {c.name}
                  </span>
                  <span style={{ fontFamily: font, fontSize: 9, color: noteStyles.tsColor, flexShrink: 0 }}>
                    {formatNoteTimestamp(c.timestamp)}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: font,
                    fontSize: 10,
                    color: noteStyles.msgColor,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {c.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

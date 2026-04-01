import { randomUUID } from "crypto";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export type StoredComment = {
  id: string;
  name: string;
  message: string;
  timestamp: string;
};

const COMMENTS_FILE = join(process.cwd(), "comments.json");

/** Basic profanity / slur filter — case-insensitive substring match against name and message. */
const BLOCKED_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "nigger",
  "nigga",
  "fag",
  "faggot",
  "retard",
  "rape",
  "slut",
  "whore",
];

const REJECTION_MESSAGE = "try to keep the bad language to a minimum!";

function containsBlockedTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}

async function readComments(): Promise<StoredComment[]> {
  try {
    const raw = await readFile(COMMENTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is StoredComment =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as StoredComment).id === "string" &&
        typeof (c as StoredComment).name === "string" &&
        typeof (c as StoredComment).message === "string" &&
        typeof (c as StoredComment).timestamp === "string"
    );
  } catch {
    return [];
  }
}

async function writeComments(comments: StoredComment[]): Promise<void> {
  await writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf8");
}

export async function GET() {
  const comments = await readComments();
  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const name = typeof (body as { name?: unknown }).name === "string" ? (body as { name: string }).name.trim() : "";
  const message =
    typeof (body as { message?: unknown }).message === "string" ? (body as { message: string }).message.trim() : "";

  if (!name || !message) {
    return NextResponse.json({ error: "name and message required" }, { status: 400 });
  }

  if (containsBlockedTerm(name) || containsBlockedTerm(message)) {
    return NextResponse.json({ error: REJECTION_MESSAGE }, { status: 400 });
  }

  const timestamp = new Date().toISOString();
  const comment: StoredComment = {
    id: randomUUID(),
    name,
    message,
    timestamp,
  };

  const existing = await readComments();
  const next = [comment, ...existing];
  try {
    await writeComments(next);
  } catch {
    return NextResponse.json({ error: "could not save comment" }, { status: 503 });
  }

  return NextResponse.json(comment, { status: 201 });
}

/**
 * D4AI long-term memory: chat history + user facts.
 * Uses localStorage (web + WebView). Survives app restarts on the same device.
 */

export type UserFact = { key: string; value: string; updatedAt: number };

const FACTS_KEY = "d4ai_user_facts_v1";
const PROFILE_KEY = "d4ai_user_profile_v1";

export type UserProfile = {
  displayName?: string;
  notes?: string;
  updatedAt?: number;
};

export function loadUserFacts(): UserFact[] {
  try {
    const raw = localStorage.getItem(FACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserFact[];
    return Array.isArray(parsed) ? parsed.slice(0, 80) : [];
  } catch {
    return [];
  }
}

export function saveUserFacts(facts: UserFact[]) {
  try {
    localStorage.setItem(FACTS_KEY, JSON.stringify(facts.slice(0, 80)));
  } catch {
    /* quota */
  }
}

export function upsertFact(key: string, value: string) {
  const k = key.trim().toLowerCase().slice(0, 40);
  const v = value.trim().slice(0, 200);
  if (!k || !v) return;
  const list = loadUserFacts().filter((f) => f.key !== k);
  list.unshift({ key: k, value: v, updatedAt: Date.now() });
  saveUserFacts(list);
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UserProfile;
  } catch {
    return {};
  }
}

export function saveProfile(p: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...p, updatedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

/** Extract memorable facts from a user message. */
export function extractFactsFromMessage(text: string): void {
  const t = String(text || "").trim();
  if (!t || t.length > 280) return;

  const name =
    t.match(/\b(?:my name is|i'm|i am|call me)\s+([A-Za-z][A-Za-z0-9' -]{1,30})/i) ||
    t.match(/\bi'm\s+([A-Za-z][A-Za-z0-9']{1,24})\b/i);
  if (name) {
    const n = name[1].trim();
    upsertFact("name", n);
    const p = loadProfile();
    saveProfile({ ...p, displayName: n });
  }

  const school = t.match(/\b(?:i (?:study|school) at|my school is)\s+(.+)/i);
  if (school) upsertFact("school", school[1].slice(0, 80));

  const like = t.match(/\b(?:i (?:like|love|enjoy))\s+(.+)/i);
  if (like) upsertFact("likes", like[1].slice(0, 80));

  const live = t.match(/\b(?:i live in|i'm from|i am from)\s+(.+)/i);
  if (live) upsertFact("location", live[1].slice(0, 60));
}

/** Short memory block to prepend to system/context for the model. */
export function memoryContextBlock(): string {
  const facts = loadUserFacts();
  const profile = loadProfile();
  const lines: string[] = [];
  if (profile.displayName) lines.push(`User name: ${profile.displayName}`);
  for (const f of facts.slice(0, 12)) {
    if (f.key === "name" && profile.displayName) continue;
    lines.push(`${f.key}: ${f.value}`);
  }
  if (!lines.length) return "";
  return (
    "Known about this user (from past chats on this device):\n" +
    lines.map((l) => `- ${l}`).join("\n") +
    "\nUse this only when helpful; don't force it into every reply."
  );
}

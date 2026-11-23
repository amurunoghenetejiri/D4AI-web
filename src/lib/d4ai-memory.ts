/**
 * D4AI memory — user facts + conversation persistence helpers.
 * Conversations themselves are stored by the chat page (localStorage).
 * This module extracts personal facts and builds a context block for the model.
 */

const MEMORY_KEY = "d4ai_user_memory_v1";
const PROFILE_KEY = "d4ai_profile_v1";
const SUMMARY_KEY = "d4ai_chat_summary_v1";

export type UserFact = {
  key: string;
  value: string;
  updatedAt: number;
};

export type UserMemory = {
  facts: UserFact[];
  displayName?: string;
  school?: string;
  location?: string;
  likes?: string[];
  notes?: string[];
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadMemory(): UserMemory {
  if (typeof window === "undefined") return { facts: [] };
  return safeParse(localStorage.getItem(MEMORY_KEY), { facts: [] });
}

export function saveMemory(mem: UserMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
  } catch {
    /* quota */
  }
}

export function loadProfile(): { displayName?: string } {
  if (typeof window === "undefined") return {};
  return safeParse(localStorage.getItem(PROFILE_KEY), {});
}

export function saveProfile(p: { displayName?: string }): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

function upsertFact(mem: UserMemory, key: string, value: string, updatedAt: number) {
  const i = mem.facts.findIndex((f) => f.key === key);
  if (i >= 0) mem.facts[i] = { key, value, updatedAt };
  else mem.facts.push({ key, value, updatedAt });
}

/** Extract simple facts from a user message and merge into memory. */
export function extractFactsFromMessage(text: string): UserMemory {
  const mem = loadMemory();
  const now = Date.now();

  const nameMatch = text.match(
    /(?:my name is|i'm|i am|call me)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i
  );
  if (nameMatch) {
    const name = nameMatch[1].trim().replace(/[.,!?].*$/, "");
    if (name.length > 1) {
      mem.displayName = name;
      upsertFact(mem, "name", name, now);
      saveProfile({ displayName: name });
    }
  }

  const schoolMatch = text.match(
    /(?:i (?:go to|attend|study at|am at)|my school is|school[:\s]+)\s*([A-Za-z0-9][A-Za-z0-9\s'.-]{2,60})/i
  );
  if (schoolMatch) {
    const school = schoolMatch[1].trim().replace(/[.,!?].*$/, "");
    mem.school = school;
    upsertFact(mem, "school", school, now);
  }

  const locMatch = text.match(
    /(?:i live in|i'm from|i am from|my city is|location[:\s]+)\s*([A-Za-z][A-Za-z\s,.-]{2,50})/i
  );
  if (locMatch) {
    const loc = locMatch[1].trim().replace(/[.,!?].*$/, "");
    mem.location = loc;
    upsertFact(mem, "location", loc, now);
  }

  const likeMatch = text.match(
    /(?:i like|i love|i enjoy|my favorite is|favourites?[:\s]+)\s+(.+)/i
  );
  if (likeMatch) {
    const liked = likeMatch[1].trim().slice(0, 80);
    mem.likes = mem.likes || [];
    if (!mem.likes.includes(liked)) mem.likes.push(liked);
    upsertFact(mem, "likes", mem.likes.join(", "), now);
  }

  // Free-form "remember that …"
  const rememberMatch = text.match(/remember (?:that )?(.+)/i);
  if (rememberMatch) {
    const note = rememberMatch[1].trim().slice(0, 120);
    mem.notes = mem.notes || [];
    if (!mem.notes.includes(note)) mem.notes.unshift(note);
    mem.notes = mem.notes.slice(0, 12);
    upsertFact(mem, "note", note, now);
  }

  saveMemory(mem);
  return mem;
}

/** Short rolling summary of recent conversation (helps model stay consistent). */
export function updateChatSummary(userMsg: string, assistantMsg: string): void {
  if (typeof window === "undefined") return;
  const prev = safeParse<string[]>(localStorage.getItem(SUMMARY_KEY), []);
  const line = `User: ${userMsg.slice(0, 120)} → AI: ${assistantMsg.slice(0, 160)}`;
  prev.unshift(line);
  try {
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(prev.slice(0, 8)));
  } catch {
    /* ignore */
  }
}

export function getChatSummary(): string {
  if (typeof window === "undefined") return "";
  const lines = safeParse<string[]>(localStorage.getItem(SUMMARY_KEY), []);
  if (!lines.length) return "";
  return `[Recent conversation context]\n${lines.join("\n")}\n`;
}

/** Build context block to prepend so the model remembers the user. */
export function memoryContextBlock(): string {
  const mem = loadMemory();
  const profile = loadProfile();
  const parts: string[] = [];
  const name = mem.displayName || profile.displayName;
  if (name) parts.push(`User's name: ${name}`);
  if (mem.school) parts.push(`School: ${mem.school}`);
  if (mem.location) parts.push(`Location: ${mem.location}`);
  if (mem.likes?.length) parts.push(`Likes: ${mem.likes.slice(0, 5).join("; ")}`);
  if (mem.notes?.length) parts.push(`Notes: ${mem.notes.slice(0, 5).join("; ")}`);
  for (const f of mem.facts.slice(0, 8)) {
    if (!["name", "school", "location", "likes", "note"].includes(f.key)) {
      parts.push(`${f.key}: ${f.value}`);
    }
  }
  const summary = getChatSummary();
  let block = "";
  if (parts.length) {
    block += `[User memory — use naturally]\n${parts.join("\n")}\n`;
  }
  if (summary) block += summary;
  return block;
}

/**
 * D4AI local memory — extracts and stores user facts across sessions.
 * Stored in localStorage. Prepended to chat context so the model remembers you.
 */

const MEMORY_KEY = "d4ai_user_memory_v1";
const PROFILE_KEY = "d4ai_profile_v1";

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

/** Extract simple facts from a user message and merge into memory. */
export function extractFactsFromMessage(text: string): UserMemory {
  const mem = loadMemory();
  const lower = text.toLowerCase().trim();
  const now = Date.now();

  // Name
  const nameMatch = text.match(/(?:my name is|i'm|i am|call me)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i);
  if (nameMatch) {
    const name = nameMatch[1].trim().replace(/[.,!?].*$/, "");
    if (name.length > 1) {
      mem.displayName = name;
      upsertFact(mem, "name", name, now);
      saveProfile({ displayName: name });
    }
  }

  // School
  const schoolMatch = text.match(/(?:i (?:go to|attend|study at|am at)|my school is|school[:\s]+)\s*([A-Za-z0-9][A-Za-z0-9\s'.-]{2,60})/i);
  if (schoolMatch) {
    const school = schoolMatch[1].trim().replace(/[.,!?].*$/, "");
    mem.school = school;
    upsertFact(mem, "school", school, now);
  }

  // Location
  const locMatch = text.match(/(?:i live in|i'm from|i am from|my city is|location[:\s]+)\s*([A-Za-z][A-Za-z\s,.-]{2,50})/i);
  if (locMatch) {
    const loc = locMatch[1].trim().replace(/[.,!?].*$/, "");
    mem.location = loc;
    upsertFact(mem, "location", loc, now);
  }

  // Likes
  const likeMatch = text.match(/(?:i like|i love|i enjoy|my favorite is|favourites?[:\s]+)\s+(.+)/i);
  if (likeMatch) {
    const liked = likeMatch[1].trim().slice(0, 80);
    mem.likes = mem.likes || [];
    if (!mem.likes.includes(liked)) mem.likes.push(liked);
    upsertFact(mem, "likes", mem.likes.join(", "), now);
  }

  saveMemory(mem);
  return mem;
}

function upsertFact(mem: UserMemory, key: string, value: string, updatedAt: number) {
  const i = mem.facts.findIndex((f) => f.key === key);
  if (i >= 0) mem.facts[i] = { key, value, updatedAt };
  else mem.facts.push({ key, value, updatedAt });
}

/** Build a short context block to prepend to the system / first message. */
export function memoryContextBlock(): string {
  const mem = loadMemory();
  const profile = loadProfile();
  const parts: string[] = [];
  const name = mem.displayName || profile.displayName;
  if (name) parts.push(`User's name: ${name}`);
  if (mem.school) parts.push(`School: ${mem.school}`);
  if (mem.location) parts.push(`Location: ${mem.location}`);
  if (mem.likes?.length) parts.push(`Likes: ${mem.likes.slice(0, 5).join("; ")}`);
  for (const f of mem.facts.slice(0, 8)) {
    if (!["name", "school", "location", "likes"].includes(f.key)) {
      parts.push(`${f.key}: ${f.value}`);
    }
  }
  if (parts.length === 0) return "";
  return `[User memory — use naturally, do not list as bullet points unless asked]\n${parts.join("\n")}\n`;
}

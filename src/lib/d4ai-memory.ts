/**
 * D4AI durable memory — name, school, location, likes, notes.
 * Stored in localStorage and injected into every chat turn.
 */

const MEMORY_KEY = "d4ai_user_memory_v1";
const PROFILE_KEY = "d4ai_profile_v1";
const SUMMARY_KEY = "d4ai_chat_summary_v1";
const NICK_KEY = "d4ai-nickname";

export type UserFact = { key: string; value: string; updatedAt: number };

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
  const mem = safeParse<UserMemory>(localStorage.getItem(MEMORY_KEY), { facts: [] });
  if (!mem.facts) mem.facts = [];
  // Migrate nickname key if present
  try {
    const nick = localStorage.getItem(NICK_KEY);
    if (nick && !mem.displayName) {
      mem.displayName = nick;
      saveMemory(mem);
    }
  } catch {
    /* */
  }
  return mem;
}

export function saveMemory(mem: UserMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
    if (mem.displayName) {
      localStorage.setItem(NICK_KEY, mem.displayName);
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ displayName: mem.displayName }));
    }
  } catch {
    /* quota */
  }
}

export function loadProfile(): { displayName?: string } {
  if (typeof window === "undefined") return {};
  const p = safeParse<{ displayName?: string }>(localStorage.getItem(PROFILE_KEY), {});
  if (!p.displayName) {
    try {
      const nick = localStorage.getItem(NICK_KEY);
      if (nick) return { displayName: nick };
    } catch {
      /* */
    }
  }
  return p;
}

export function saveProfile(p: { displayName?: string }): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    if (p.displayName) localStorage.setItem(NICK_KEY, p.displayName);
  } catch {
    /* */
  }
}

function upsertFact(mem: UserMemory, key: string, value: string, updatedAt: number) {
  const i = mem.facts.findIndex((f) => f.key === key);
  if (i >= 0) mem.facts[i] = { key, value, updatedAt };
  else mem.facts.push({ key, value, updatedAt });
}

/** Extract personal facts from a user message. */
export function extractFactsFromMessage(text: string): UserMemory {
  const mem = loadMemory();
  const now = Date.now();
  const t = text.trim();

  // Name patterns (order matters)
  const namePatterns = [
    /(?:my\s+name\s+is)\s+([A-Za-z][A-Za-z\s'.-]{1,48})/i,
    /(?:call\s+me)\s+([A-Za-z][A-Za-z\s'.-]{1,48})/i,
    /(?:i(?:'m| am))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})(?:\s|$|[.,!?])/ ,
    /(?:name[:\s]+)\s*([A-Za-z][A-Za-z\s'.-]{1,48})/i,
  ];
  for (const re of namePatterns) {
    const m = t.match(re);
    if (m) {
      let name = m[1].trim().replace(/[.,!?].*$/, "").replace(/\s+/g, " ");
      // avoid false positives
      if (
        name.length > 1 &&
        name.length < 48 &&
        !/^(a|an|the|here|there|from|going|looking|trying|using|d4ai)/i.test(name)
      ) {
        mem.displayName = name;
        upsertFact(mem, "name", name, now);
        saveProfile({ displayName: name });
        break;
      }
    }
  }

  const schoolMatch = t.match(
    /(?:i (?:go to|attend|study at|am at)|my school is|school[:\s]+)\s*([A-Za-z0-9][A-Za-z0-9\s'.-]{2,60})/i
  );
  if (schoolMatch) {
    const school = schoolMatch[1].trim().replace(/[.,!?].*$/, "");
    mem.school = school;
    upsertFact(mem, "school", school, now);
  }

  const locMatch = t.match(
    /(?:i live in|i'm from|i am from|my city is|location[:\s]+)\s*([A-Za-z][A-Za-z\s,.-]{2,50})/i
  );
  if (locMatch) {
    const loc = locMatch[1].trim().replace(/[.,!?].*$/, "");
    mem.location = loc;
    upsertFact(mem, "location", loc, now);
  }

  const likeMatch = t.match(/(?:i like|i love|i enjoy|my favorite is)\s+(.+)/i);
  if (likeMatch) {
    const liked = likeMatch[1].trim().slice(0, 80);
    mem.likes = mem.likes || [];
    if (!mem.likes.includes(liked)) mem.likes.push(liked);
    upsertFact(mem, "likes", mem.likes.join(", "), now);
  }

  const rememberMatch = t.match(/remember (?:that )?(.+)/i);
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

export function updateChatSummary(userMsg: string, assistantMsg: string): void {
  if (typeof window === "undefined") return;
  const prev = safeParse<string[]>(localStorage.getItem(SUMMARY_KEY), []);
  const line = `User: ${userMsg.slice(0, 120)} → AI: ${assistantMsg.slice(0, 160)}`;
  prev.unshift(line);
  try {
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(prev.slice(0, 8)));
  } catch {
    /* */
  }
}

export function getChatSummary(): string {
  if (typeof window === "undefined") return "";
  const lines = safeParse<string[]>(localStorage.getItem(SUMMARY_KEY), []);
  if (!lines.length) return "";
  return `[Recent conversation]\n${lines.join("\n")}\n`;
}

export function getKnownName(): string {
  const mem = loadMemory();
  const profile = loadProfile();
  return (mem.displayName || profile.displayName || "").trim();
}

/** Context block injected into each request. */
export function memoryContextBlock(): string {
  const mem = loadMemory();
  const profile = loadProfile();
  const parts: string[] = [];
  const name = mem.displayName || profile.displayName;
  if (name) {
    parts.push(`The user's real name is ${name}.`);
    parts.push(`Always use their name (${name}) when they ask who they are or what their name is.`);
    parts.push(`Never say [Name] or leave a placeholder — use "${name}".`);
  }
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
    block += `[User memory — follow these facts exactly]\n${parts.join("\n")}\n`;
  }
  if (summary) block += summary;
  return block;
}

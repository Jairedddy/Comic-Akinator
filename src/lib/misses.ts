// Local-only log of games where the engine failed to guess. The shape was
// fixed in M2.5; M4.x (sim tuning) reads this to spot characters that defeat
// the bank, and Phase 2 (learning queue) will replay these to adjust weights.
//
// Storage: localStorage["ca:misses:v1"], JSON array, oldest first. Capped at
// MAX_ENTRIES so a chatty player can't blow past the 5 MB origin quota.

import type { Answer, TraitCategory } from "@/lib/engine/types";

const STORAGE_KEY = "ca:misses:v1";
const MAX_ENTRIES = 50;

export type MissAsked = {
  questionId: string;
  trait: string;
  category: TraitCategory;
  answer: Answer;
};

export type MissRecord = {
  gameId: string;
  characterId: string;
  asked: string[]; // question IDs in turn order
  answers: Answer[]; // answers in turn order, same length as asked
  history: MissAsked[]; // richer per-turn detail for tuning
  at: string; // ISO timestamp
};

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readMisses(): MissRecord[] {
  const store = safeStorage();
  if (!store) return [];
  const raw = store.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MissRecord[]) : [];
  } catch {
    return [];
  }
}

export function appendMiss(record: MissRecord): void {
  const store = safeStorage();
  if (!store) return;
  const all = readMisses();
  all.push(record);
  const trimmed = all.length > MAX_ENTRIES ? all.slice(-MAX_ENTRIES) : all;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota or private mode — silently drop. The miss is not load-bearing for
    // gameplay, only for future tuning.
  }
}

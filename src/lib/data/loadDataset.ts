// Fetches the canonical dataset (characters + questions) from static
// public/data/*.json assets and caches the result for the lifetime of the
// page. M3.2 will add PWA caching on top of this so repeat loads are instant
// + offline-capable.

import type { Character, Question, QuestionsFile } from "@/lib/engine/types";

export type Dataset = {
  characters: Character[];
  questions: Question[];
};

let cached: Promise<Dataset> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function loadDataset(): Promise<Dataset> {
  if (cached) return cached;
  cached = (async () => {
    const [characters, questionsFile] = await Promise.all([
      fetchJson<Character[]>("/data/characters.json"),
      fetchJson<QuestionsFile>("/data/questions.json"),
    ]);
    if (!Array.isArray(characters) || characters.length === 0) {
      throw new Error("characters.json is empty or malformed");
    }
    if (!questionsFile?.questions?.length) {
      throw new Error("questions.json is empty or malformed");
    }
    return { characters, questions: questionsFile.questions };
  })();
  // On failure, drop the cache so a retry can re-attempt.
  cached.catch(() => {
    cached = null;
  });
  return cached;
}

// Test helper — primarily for the M2.3 manual test that disables localStorage
// then re-loads. Not for production callers.
export function _resetDatasetCacheForTests(): void {
  cached = null;
}

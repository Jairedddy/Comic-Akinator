import type {
  Answer,
  Belief,
  Character,
  Question,
  TraitCategory,
} from "./types";
import { entropy } from "./entropy";

// ============================================================================
// Hot path. Both UI (per turn) and sim (per game × turn) call selectNextQuestion
// thousands of times, so this file is tuned for speed:
//
//   - Belief is converted to a Float64Array indexed by character index once
//     per call. Inner loops use indexed access, no Object.values/entries.
//   - Trait values per character per trait are pre-extracted into a matrix
//     and cached on the characters array via WeakMap. Built once per game.
//   - The expected-entropy computation is fully inlined per answer — no
//     allocation of intermediate belief objects, no Math calls outside the
//     inner sums.
//
// The math is identical to the canonical formulation in posterior.ts +
// entropy.ts + likelihood.ts. If you change those, mirror the change here.
// ============================================================================

// likelihood(answer, v) — duplicated from likelihood.ts so this hot loop
// doesn't pay the function-call cost. Keep in sync.
//
// answerIdx: 0=yes, 1=probably, 2=dont-know, 3=probably-not, 4=no
function fastLikelihood(
  answerIdx: number,
  v: number,
  vIsNull: boolean,
): number {
  if (answerIdx === 2) return 1; // dont-know
  if (vIsNull) return 0.5;
  switch (answerIdx) {
    case 0:
      return 0.05 + 0.9 * v;
    case 1:
      return 0.15 + 0.6 * v;
    case 3:
      return 0.75 - 0.6 * v;
    case 4:
      return 0.95 - 0.9 * v;
  }
  return 1;
}

// Linear formulation: sum over answers of lik(a, v) is the same for any v
// in [0,1]: 2.9. For v=null all 5 likelihoods are 0.5,0.5,1,0.5,0.5 → 3.0.
const LIK_SUM_KNOWN = 2.9;
const LIK_SUM_NULL = 3.0;

const MIN_BELIEF = 1e-6;
const DIVERSITY_PENALTY = 0.85;
const ANSWERS_LEN = 5;

// ============================================================================
// Trait matrix — one row per trait, one column per character index.
// Cached per characters array.
// ============================================================================

type TraitMatrix = {
  characters: Character[];
  charIndex: Map<string, number>;
  // For each trait id, two parallel arrays the size of `characters.length`:
  //   values[i] = trait value (0..1) or NaN if null/unknown
  //   isNull[i] = 1 if null, 0 otherwise (Uint8Array for cheap checks)
  byTrait: Map<string, { values: Float32Array; isNull: Uint8Array }>;
};

const matrixCache = new WeakMap<Character[], TraitMatrix>();

function getMatrix(characters: Character[]): TraitMatrix {
  let m = matrixCache.get(characters);
  if (m) return m;

  // Discover trait ids from the first character that has any.
  const traitIds = new Set<string>();
  for (const c of characters) {
    for (const k of Object.keys(c.traits ?? {})) traitIds.add(k);
  }

  const byTrait = new Map<
    string,
    { values: Float32Array; isNull: Uint8Array }
  >();
  for (const tid of traitIds) {
    const values = new Float32Array(characters.length);
    const isNull = new Uint8Array(characters.length);
    for (let i = 0; i < characters.length; i++) {
      const v = characters[i].traits[tid];
      if (v === null || v === undefined) {
        values[i] = 0;
        isNull[i] = 1;
      } else {
        values[i] = v;
        isNull[i] = 0;
      }
    }
    byTrait.set(tid, { values, isNull });
  }

  const charIndex = new Map<string, number>();
  for (let i = 0; i < characters.length; i++)
    charIndex.set(characters[i].id, i);

  m = { characters, charIndex, byTrait };
  matrixCache.set(characters, m);
  return m;
}

// ============================================================================
// Fast expected-entropy for a single trait
// ============================================================================

function expectedEntropyFast(
  beliefArr: Float64Array,
  traitValues: Float32Array,
  traitIsNull: Uint8Array,
  scratch: Float64Array,
): number {
  const N = beliefArr.length;
  let expectedH = 0;

  for (let a = 0; a < ANSWERS_LEN; a++) {
    let pAns = 0;
    let postSum = 0;

    // First pass: build unnormalized posterior + marginal P(answer).
    for (let i = 0; i < N; i++) {
      const vIsNull = traitIsNull[i] !== 0;
      const v = traitValues[i];
      const lik = fastLikelihood(a, v, vIsNull);
      const likSum = vIsNull ? LIK_SUM_NULL : LIK_SUM_KNOWN;
      const prior = beliefArr[i];
      pAns += prior * (lik / likSum);
      const raw = prior * lik;
      const floored = raw < MIN_BELIEF ? MIN_BELIEF : raw;
      scratch[i] = floored;
      postSum += floored;
    }

    if (pAns < 1e-9 || postSum < 1e-12) continue;

    // Second pass: normalize + accumulate entropy.
    const inv = 1 / postSum;
    let h = 0;
    for (let i = 0; i < N; i++) {
      const p = scratch[i] * inv;
      if (p > 0) h -= p * Math.log2(p);
    }
    expectedH += pAns * h;
  }

  return expectedH;
}

// ============================================================================
// Public API — same signature as before
// ============================================================================

export function selectNextQuestion(
  belief: Belief,
  questions: Question[],
  characters: Character[],
  askedTraits: string[],
  recentCategories: TraitCategory[],
): Question | null {
  const asked = new Set(askedTraits);
  const recentCats = new Set(recentCategories);

  // Pick one question per trait (multiple phrasings have identical info-gain).
  const seenTraits = new Set<string>();
  const candidates: Question[] = [];
  for (const q of questions) {
    if (asked.has(q.trait)) continue;
    if (seenTraits.has(q.trait)) continue;
    seenTraits.add(q.trait);
    candidates.push(q);
  }
  if (!candidates.length) return null;

  const matrix = getMatrix(characters);
  const N = characters.length;

  // Convert Belief → Float64Array once.
  const beliefArr = new Float64Array(N);
  for (let i = 0; i < N; i++) beliefArr[i] = belief[characters[i].id] ?? 0;

  // Current entropy — same math as entropy.ts, but on the typed array.
  let currentH = 0;
  for (let i = 0; i < N; i++) {
    const p = beliefArr[i];
    if (p > 0) currentH -= p * Math.log2(p);
  }

  const scratch = new Float64Array(N);

  let best: Question | null = null;
  let bestGain = -Infinity;

  for (const q of candidates) {
    const m = matrix.byTrait.get(q.trait);
    if (!m) continue; // trait not in dataset

    const expH = expectedEntropyFast(beliefArr, m.values, m.isNull, scratch);
    let gain = currentH - expH;
    if (recentCats.has(q.category)) gain *= DIVERSITY_PENALTY;
    if (q.cost > 0) gain /= q.cost;

    if (gain > bestGain) {
      bestGain = gain;
      best = q;
    }
  }

  return best;
}

// Re-export entropy for use in other engine files (was previously imported here).
export { entropy };

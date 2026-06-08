import type { Answer, Belief, Character } from "./types";
import { likelihood } from "./likelihood";

// Posterior floor — never let a character's belief reach exactly zero.
// Allows recovery if the player mis-answers a single question, and keeps
// log() in entropy() finite. 1e-6 is far below any meaningful threshold but
// well above floating-point underflow risk after a few multiplications.
const MIN_BELIEF = 1e-6;

export function createUniformBelief(characters: Character[]): Belief {
  const b: Belief = {};
  if (!characters.length) return b;
  const p = 1 / characters.length;
  for (const c of characters) b[c.id] = p;
  return b;
}

// Bayes update: belief'(c) ∝ belief(c) * P(answer | c.traits[trait])
// then renormalize to sum to 1.
export function updateBelief(
  belief: Belief,
  trait: string,
  answer: Answer,
  characters: Character[],
): Belief {
  const next: Belief = {};
  let sum = 0;
  for (const c of characters) {
    const prior = belief[c.id] ?? 0;
    const v = c.traits[trait] ?? null;
    const lik = likelihood(answer, v);
    const post = Math.max(prior * lik, MIN_BELIEF);
    next[c.id] = post;
    sum += post;
  }
  if (sum > 0) {
    for (const id of Object.keys(next)) next[id] /= sum;
  }
  return next;
}

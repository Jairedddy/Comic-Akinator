import type {
  Answer,
  Belief,
  Character,
  Question,
  TraitCategory,
} from "./types";
import { likelihood } from "./likelihood";
import { entropy } from "./entropy";
import { updateBelief } from "./posterior";

const ANSWERS: Answer[] = [
  "yes",
  "probably",
  "dont-know",
  "probably-not",
  "no",
];

// Asking a question of the same category as one of the last N questions gets
// scaled down. Keeps the game from feeling like a single line of inquiry.
const DIVERSITY_PENALTY = 0.85;

// Per-character answer probability: lik(a, v) renormalized over answers so
// the answer distribution sums to 1 for each character. Used to compute
// marginal P(answer | belief).
function answerProbability(answer: Answer, v: number | null): number {
  const num = likelihood(answer, v);
  let denom = 0;
  for (const a of ANSWERS) denom += likelihood(a, v);
  return denom > 0 ? num / denom : 0;
}

// E_a[ H(belief | trait, a) ] — the expected entropy of the posterior after
// asking about `trait`, averaged over which answer the player might give.
function expectedEntropyAfter(
  belief: Belief,
  trait: string,
  characters: Character[],
): number {
  let expectedH = 0;
  for (const ans of ANSWERS) {
    let pAns = 0;
    for (const c of characters) {
      const v = c.traits[trait] ?? null;
      pAns += (belief[c.id] ?? 0) * answerProbability(ans, v);
    }
    if (pAns < 1e-9) continue;
    const posterior = updateBelief(belief, trait, ans, characters);
    expectedH += pAns * entropy(posterior);
  }
  return expectedH;
}

export function selectNextQuestion(
  belief: Belief,
  questions: Question[],
  characters: Character[],
  askedTraits: string[],
  recentCategories: TraitCategory[],
): Question | null {
  const asked = new Set(askedTraits);
  const recentCats = new Set(recentCategories);

  // Pick one question per trait; if multiple phrasings exist for the same
  // trait, they have identical info-gain so we just take the first.
  const seenTraits = new Set<string>();
  const candidates: Question[] = [];
  for (const q of questions) {
    if (asked.has(q.trait)) continue;
    if (seenTraits.has(q.trait)) continue;
    seenTraits.add(q.trait);
    candidates.push(q);
  }
  if (!candidates.length) return null;

  const currentH = entropy(belief);

  let best: Question | null = null;
  let bestGain = -Infinity;

  for (const q of candidates) {
    const expH = expectedEntropyAfter(belief, q.trait, characters);
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

import type { Belief, Character, GuessCandidate } from "./types";

// Tuning constants. M4.1 will adjust these against the sim harness.
const HIGH_CONFIDENCE = 0.85; // top-1 belief above this → confident guess
const DOMINANCE_RATIO = 6; // top-1 / top-2 above this → confident guess
const MIN_TURNS_BEFORE_GUESS = 8; // don't guess too eagerly
const SOFT_CAP = 20; // by this turn, just guess whoever's leading
const HARD_CAP = 25; // beyond this, give up
const MAX_WRONG_GUESSES = 3;

type Ranked = { id: string; p: number };

function rankBelief(belief: Belief): Ranked[] {
  return Object.entries(belief)
    .map(([id, p]) => ({ id, p }))
    .sort((a, b) => b.p - a.p);
}

export type GuessDecision = {
  shouldGuess: boolean;
  targetId: string | null;
  confidence: number;
};

export function shouldGuess(
  belief: Belief,
  turn: number,
  wrongGuessCount: number,
  alreadyGuessed: Set<string>,
): GuessDecision {
  const ranked = rankBelief(belief).filter((r) => !alreadyGuessed.has(r.id));
  if (!ranked.length) {
    return { shouldGuess: false, targetId: null, confidence: 0 };
  }

  const top1 = ranked[0];
  const top2 = ranked[1];
  const confidence = top1.p;

  // Out of room — caller will fall through to giveup
  if (turn >= HARD_CAP || wrongGuessCount >= MAX_WRONG_GUESSES) {
    return { shouldGuess: false, targetId: top1.id, confidence };
  }

  // Soft cap: stop dithering and commit
  if (turn >= SOFT_CAP) {
    return { shouldGuess: true, targetId: top1.id, confidence };
  }

  // Early-confidence guess
  if (turn >= MIN_TURNS_BEFORE_GUESS) {
    if (top1.p > HIGH_CONFIDENCE) {
      return { shouldGuess: true, targetId: top1.id, confidence };
    }
    if (top2 && top2.p > 0 && top1.p / top2.p > DOMINANCE_RATIO) {
      return { shouldGuess: true, targetId: top1.id, confidence };
    }
  }

  return { shouldGuess: false, targetId: top1.id, confidence };
}

export function shouldGiveUp(turn: number, wrongGuessCount: number): boolean {
  return turn >= HARD_CAP || wrongGuessCount >= MAX_WRONG_GUESSES;
}

export function topCandidates(
  belief: Belief,
  characters: Character[],
  n = 5,
): GuessCandidate[] {
  const byId = new Map(characters.map((c) => [c.id, c]));
  return rankBelief(belief)
    .slice(0, n)
    .map(({ id, p }) => ({
      characterId: id,
      character: byId.get(id)!,
      belief: p,
    }))
    .filter((c) => c.character !== undefined);
}

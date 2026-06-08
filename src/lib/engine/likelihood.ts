import type { Answer } from "./types";

// Likelihood of `answer` given the character has trait value `v`.
//
// v ∈ [0, 1] means the character has the trait with that strength
// (1 = definitely has it, 0 = definitely doesn't, 0.5 = partial/uncertain).
// v = null means the data doesn't know.
//
// Returned values are multipliers used in the Bayes update (NOT
// probabilities over answer types — they don't sum to 1 across answers).
//
// Design choices:
//   "yes" with v=1   → 0.95 (almost-certain weight in favour)
//   "yes" with v=0   → 0.05 (almost-certain weight against)
//   "yes" with v=0.5 → 0.50 (neutral — partial trait doesn't push either way)
//   "yes" with v=null → 0.50 (data ignorance shouldn't punish; engine learns nothing)
//   "probably" — softer slope (0.15..0.75) so a wrong "probably" is recoverable.
//   "dont-know" — always 1.0; the user opts out, belief unchanged.

export function likelihood(answer: Answer, v: number | null): number {
  if (answer === "dont-know") return 1.0;
  if (v === null) return 0.5;
  switch (answer) {
    case "yes":
      return 0.05 + 0.9 * v;
    case "probably":
      return 0.15 + 0.6 * v;
    case "probably-not":
      return 0.75 - 0.6 * v;
    case "no":
      return 0.95 - 0.9 * v;
  }
}

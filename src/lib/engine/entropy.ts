import type { Belief } from "./types";

// Shannon entropy of a belief distribution, base 2.
// For a uniform distribution over N characters, entropy(b) = log2(N).
// As belief concentrates on a single character, entropy → 0.
export function entropy(belief: Belief): number {
  let h = 0;
  for (const p of Object.values(belief)) {
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

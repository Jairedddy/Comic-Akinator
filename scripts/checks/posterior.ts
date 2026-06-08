import {
  createUniformBelief,
  updateBelief,
} from "../../src/lib/engine/posterior";
import type { Character } from "../../src/lib/engine/types";

// Synthetic 3-character set. Only "alice" has trait `x = 1`; the others have `x = 0`.
// A "yes" answer to a question about `x` should drive alice's posterior to ~1.0
// after one update, and the others to near zero.

function mockChar(id: string, x: number | null): Character {
  return {
    id,
    name: id,
    realName: null,
    publisher: "Marvel",
    image: "",
    alignment: null,
    gender: null,
    species: null,
    eyeColor: null,
    hairColor: null,
    powerstats: null,
    appearances: null,
    yearFirstAppeared: null,
    identity: null,
    aliases: [],
    occupation: null,
    groupAffiliation: null,
    placeOfBirth: null,
    firstAppearance: null,
    traits: { x },
    traitCompleteness: 1,
  };
}

const chars: Character[] = [
  mockChar("alice", 1),
  mockChar("bob", 0),
  mockChar("carol", 0),
];

const uniform = createUniformBelief(chars);
console.log(`Prior uniform: ${JSON.stringify(uniform)}`);

const post = updateBelief(uniform, "x", "yes", chars);
const sum = Object.values(post).reduce((s, p) => s + p, 0);
console.log(`Posterior after "yes": ${JSON.stringify(post, null, 2)}`);
console.log(`Sums to: ${sum.toFixed(6)}`);

// Expected math: prior 1/3 each, likelihoods (yes|x=1)=0.95 vs (yes|x=0)=0.05.
//   alice ∝ 1/3 * 0.95 = 0.317
//   bob   ∝ 1/3 * 0.05 = 0.0167
//   carol ∝ 1/3 * 0.05 = 0.0167
//   sum = 0.35 → alice = 0.905, bob = carol = 0.048
// Single update with 19:1 likelihood ratio can't reach 0.99; that's
// intentional — the engine tolerates one mis-answer. A stronger test
// applies many updates; for "single update" the win condition is
// "alice clearly dominates".
const ok =
  Math.abs(sum - 1.0) < 1e-9 &&
  post["alice"] > 0.85 &&
  post["alice"] / Math.max(post["bob"], post["carol"]) > 10 &&
  post["bob"] < 0.1 &&
  post["carol"] < 0.1;

console.log(ok ? "PASS" : "FAIL");
process.exit(ok ? 0 : 1);

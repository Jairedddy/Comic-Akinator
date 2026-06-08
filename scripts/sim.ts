import fs from "node:fs";
import path from "node:path";
import {
  answerQuestion,
  createInitialState,
  decide,
  rejectGuess,
} from "../src/lib/engine";
import type { Answer, Character, QuestionsFile } from "../src/lib/engine/types";

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
let noise = 0;
let baseSeed = 42;
let detailed = false;
for (const a of args) {
  if (a.startsWith("--noise=")) noise = parseFloat(a.split("=")[1]);
  else if (a.startsWith("--seed=")) baseSeed = parseInt(a.split("=")[1], 10);
  else if (a === "--detailed") detailed = true;
  else if (a === "--help" || a === "-h") {
    console.log("Usage: npm run sim -- [--noise=0.1] [--seed=42] [--detailed]");
    process.exit(0);
  }
}

// ============================================================================
// Data
// ============================================================================

const ROOT = process.cwd();
const characters = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "characters.json"), "utf8"),
) as Character[];
const questions = (
  JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "questions.json"), "utf8"),
  ) as QuestionsFile
).questions;

const charById = new Map(characters.map((c) => [c.id, c]));

// ============================================================================
// Seeded RNG (mulberry32). Deterministic per character so noise runs are
// reproducible. Each character gets baseSeed + their index.
// ============================================================================

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// Oracle — answers as the target character would, with optional noise
// ============================================================================

function oracleAnswer(c: Character, trait: string, rng: () => number): Answer {
  // Noise: flip a fraction of answers to "dont-know" to simulate a fuzzy human.
  if (noise > 0 && rng() < noise) return "dont-know";

  const v = c.traits[trait];
  if (v === null || v === undefined) return "dont-know";
  if (v >= 0.85) return "yes";
  if (v >= 0.6) return "probably";
  if (v >= 0.4) return "dont-know";
  if (v >= 0.15) return "probably-not";
  return "no";
}

// ============================================================================
// Play a single game
// ============================================================================

type Outcome =
  | { kind: "correct"; turns: number; wrongGuesses: string[] }
  | {
      kind: "wrong-guess-cap";
      turns: number;
      wrongGuesses: string[];
      guessedInstead: string;
    }
  | {
      kind: "giveup";
      turns: number;
      wrongGuesses: string[];
      topCandidates: { id: string; belief: number }[];
      targetInTop: boolean;
    }
  | { kind: "safety-bail"; turns: number; wrongGuesses: string[] };

function playOne(target: Character, rng: () => number): Outcome {
  let state = createInitialState(characters);
  let safety = 0;
  const wrongGuesses: string[] = [];

  while (safety++ < 60) {
    const decision = decide(state, questions);

    if (decision.kind === "question") {
      const ans = oracleAnswer(target, decision.question.trait, rng);
      state = answerQuestion(state, decision.question, ans);
    } else if (decision.kind === "guess") {
      if (decision.characterId === target.id) {
        return { kind: "correct", turns: state.turn, wrongGuesses };
      }
      wrongGuesses.push(decision.characterId);
      state = rejectGuess(state, decision.characterId);
    } else {
      const topCandidates = decision.topCandidates.map((c) => ({
        id: c.characterId,
        belief: c.belief,
      }));
      const targetInTop = topCandidates.some((c) => c.id === target.id);
      return {
        kind: targetInTop ? "giveup" : "giveup",
        turns: state.turn,
        wrongGuesses,
        topCandidates,
        targetInTop,
      };
    }
  }

  return { kind: "safety-bail", turns: state.turn, wrongGuesses };
}

// ============================================================================
// Diagnose why a game failed
// ============================================================================

function diagnoseFailure(target: Character, outcome: Outcome): string {
  const tc = target.traitCompleteness;
  if (tc < 0.2) return "sparse trait data";

  if (outcome.kind === "wrong-guess-cap") {
    const final = outcome.guessedInstead;
    return `guessed ${final} instead of ${target.id}`;
  }

  if (outcome.kind === "giveup") {
    if (outcome.targetInTop) {
      const rank =
        outcome.topCandidates.findIndex((c) => c.id === target.id) + 1;
      return `target in top ${outcome.topCandidates.length} (rank ${rank}) but engine couldn't commit`;
    }
    return `target absent from final top candidates — ambiguous answers`;
  }

  return "exhausted decision budget";
}

// ============================================================================
// Run all characters
// ============================================================================

console.log(
  `Simulating ${characters.length} characters | noise=${noise} | seed=${baseSeed}`,
);
const startedAt = Date.now();

type Row = {
  id: string;
  name: string;
  correct: boolean;
  turns: number;
  wrongGuessCount: number;
  outcomeKind: Outcome["kind"];
  reason: string | null;
};

const rows: Row[] = [];
for (let i = 0; i < characters.length; i++) {
  const c = characters[i];
  const rng = makeRng(baseSeed + i);
  const outcome = playOne(c, rng);
  const correct = outcome.kind === "correct";
  rows.push({
    id: c.id,
    name: c.name,
    correct,
    turns: outcome.turns,
    wrongGuessCount: outcome.wrongGuesses.length,
    outcomeKind: outcome.kind,
    reason: correct ? null : diagnoseFailure(c, outcome),
  });
}

const elapsedMs = Date.now() - startedAt;

// ============================================================================
// Aggregate
// ============================================================================

const total = rows.length;
const correctCount = rows.filter((r) => r.correct).length;
const accuracy = correctCount / total;

const turnsArr = rows.map((r) => r.turns).sort((a, b) => a - b);
const avgTurns = turnsArr.reduce((s, n) => s + n, 0) / total;
const p50 = turnsArr[Math.floor(total * 0.5)];
const p95 = turnsArr[Math.floor(total * 0.95)];
const p99 = turnsArr[Math.floor(total * 0.99)];
const maxTurns = turnsArr[turnsArr.length - 1];

const failures = rows
  .filter((r) => !r.correct)
  .sort((a, b) => b.turns - a.turns || a.name.localeCompare(b.name));

const topFailures = failures.slice(0, 20).map((r) => ({
  id: r.id,
  name: r.name,
  turns: r.turns,
  wrongGuesses: r.wrongGuessCount,
  outcome: r.outcomeKind,
  reason: r.reason,
}));

// ============================================================================
// Print human-readable summary
// ============================================================================

console.log(`\nFinished in ${(elapsedMs / 1000).toFixed(1)}s`);
console.log(
  `  accuracy:  ${(accuracy * 100).toFixed(1)}% (${correctCount}/${total})`,
);
console.log(`  avg turns: ${avgTurns.toFixed(1)}`);
console.log(`  p50/p95/p99/max turns: ${p50}/${p95}/${p99}/${maxTurns}`);

if (failures.length > 0) {
  console.log(
    `\nTop ${Math.min(20, failures.length)} failures (longest first):`,
  );
  for (const f of topFailures) {
    console.log(
      `  ${f.name.padEnd(28)} t=${String(f.turns).padStart(2)}  wg=${f.wrongGuesses}  ${f.outcome.padEnd(12)} ${f.reason ?? ""}`,
    );
  }
} else {
  console.log(`\n100% accuracy — no failures.`);
}

// ============================================================================
// Write report
// ============================================================================

const reportPath = path.join(
  ROOT,
  noise > 0 ? `sim-report-noise-${noise}.json` : "sim-report.json",
);

const report = {
  version: 1,
  noise,
  seed: baseSeed,
  characters: total,
  accuracy,
  correctCount,
  avgTurns,
  p50Turns: p50,
  p95Turns: p95,
  p99Turns: p99,
  maxTurns,
  topFailures,
  // Per-character outcomes only when explicitly requested — keeps the
  // tracked baseline file small and diff-friendly. Sort by id for
  // deterministic order.
  outcomes: detailed
    ? rows
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((r) => ({
          id: r.id,
          correct: r.correct,
          turns: r.turns,
          wrongGuesses: r.wrongGuessCount,
          outcome: r.outcomeKind,
        }))
    : undefined,
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(`\nReport written to ${path.relative(ROOT, reportPath)}`);

// Quiet hint about charById being referenced (typecheck only); avoids unused-import warnings.
void charById;

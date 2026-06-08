import fs from "node:fs";
import path from "node:path";
import {
  answerQuestion,
  createInitialState,
  decide,
  rejectGuess,
} from "../../src/lib/engine";
import type {
  Answer,
  Character,
  QuestionsFile,
} from "../../src/lib/engine/types";

// Auto-play one character against the engine. The character itself is the
// oracle — we answer each question using that character's own trait value.
// Engine should land on the right guess in well under 25 turns.

const charsPath = path.join(process.cwd(), "data", "characters.json");
const qPath = path.join(process.cwd(), "data", "questions.json");
const characters = JSON.parse(
  fs.readFileSync(charsPath, "utf8"),
) as Character[];
const questions = (JSON.parse(fs.readFileSync(qPath, "utf8")) as QuestionsFile)
  .questions;

const targetSlug = process.argv[2] ?? "spider-man";
const target = characters.find((c) => c.id === targetSlug);
if (!target) {
  console.error(`Character not found: ${targetSlug}`);
  console.error(`Try a slug like spider-man, batman, thor, etc.`);
  process.exit(1);
}

function oracleAnswer(c: Character, trait: string): Answer {
  const v = c.traits[trait];
  if (v === null || v === undefined) return "dont-know";
  if (v >= 0.85) return "yes";
  if (v >= 0.6) return "probably";
  if (v >= 0.4) return "dont-know";
  if (v >= 0.15) return "probably-not";
  return "no";
}

function fmtTop(belief: Record<string, number>, n: number): string {
  return Object.entries(belief)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, p]) => `${id}(${p.toFixed(3)})`)
    .join(", ");
}

console.log(`Auto-playing as: ${target.name} (${target.id})\n`);

let state = createInitialState(characters);
let safetyCounter = 0;

while (safetyCounter++ < 40) {
  const decision = decide(state, questions);

  if (decision.kind === "question") {
    const ans = oracleAnswer(target, decision.question.trait);
    state = answerQuestion(state, decision.question, ans);
    console.log(
      `Turn ${state.turn.toString().padStart(2)} [${decision.question.category.padEnd(18)}] "${decision.question.text}"`,
    );
    console.log(`         → ${ans}`);
    console.log(`         top3: ${fmtTop(state.belief, 3)}`);
  } else if (decision.kind === "guess") {
    console.log(
      `\nEngine guesses: ${decision.character.name} (confidence ${decision.confidence.toFixed(3)})`,
    );
    if (decision.characterId === target.id) {
      console.log(`PASS — guessed correctly in ${state.turn} turns`);
      process.exit(0);
    }
    console.log(`Wrong — rejecting and continuing.`);
    state = rejectGuess(state, decision.characterId);
  } else {
    console.log(`\nEngine gives up after ${state.turn} turns`);
    console.log(`Top candidates:`);
    for (const c of decision.topCandidates) {
      console.log(`  ${c.character.name.padEnd(28)} ${c.belief.toFixed(4)}`);
    }
    const inTop = decision.topCandidates.some(
      (c) => c.characterId === target.id,
    );
    console.log(inTop ? "PARTIAL — target in top candidates" : "FAIL");
    process.exit(inTop ? 0 : 1);
  }
}

console.error(
  "FAIL — safety counter exceeded (engine looped past 40 decisions)",
);
process.exit(1);

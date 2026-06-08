import fs from "node:fs";
import path from "node:path";
import { createUniformBelief } from "../../src/lib/engine/posterior";
import { selectNextQuestion } from "../../src/lib/engine/select";
import type { Character, QuestionsFile } from "../../src/lib/engine/types";

const charsPath = path.join(process.cwd(), "data", "characters.json");
const qPath = path.join(process.cwd(), "data", "questions.json");
const allCharacters = JSON.parse(
  fs.readFileSync(charsPath, "utf8"),
) as Character[];
const questions = (JSON.parse(fs.readFileSync(qPath, "utf8")) as QuestionsFile)
  .questions;

// Take 50 Marvel + 50 DC — a deliberately balanced pool. The maximum-info-gain
// first question should be one that splits the pool cleanly. With 50/50
// universe split, a "universe" question wins.

const marvel = allCharacters
  .filter((c) => c.publisher === "Marvel")
  .slice(0, 50);
const dc = allCharacters.filter((c) => c.publisher === "DC").slice(0, 50);
const pool = [...marvel, ...dc];

const belief = createUniformBelief(pool);
const q = selectNextQuestion(belief, questions, pool, [], []);

if (!q) {
  console.error("FAIL: no question selected");
  process.exit(1);
}

console.log(`Pool: ${marvel.length} Marvel + ${dc.length} DC = ${pool.length}`);
console.log(`Selected question: "${q.text}"`);
console.log(`  trait    = ${q.trait}`);
console.log(`  category = ${q.category}`);

const ok = q.category === "universe";
console.log(ok ? "PASS" : "FAIL");
process.exit(ok ? 0 : 1);

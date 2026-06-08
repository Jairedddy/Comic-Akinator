import fs from "node:fs";
import path from "node:path";
import { entropy } from "../../src/lib/engine/entropy";
import { createUniformBelief } from "../../src/lib/engine/posterior";
import type { Character } from "../../src/lib/engine/types";

const charsPath = path.join(process.cwd(), "data", "characters.json");
const characters = JSON.parse(
  fs.readFileSync(charsPath, "utf8"),
) as Character[];

const n = characters.length;
const uniform = createUniformBelief(characters);
const h = entropy(uniform);
const expected = Math.log2(n);

console.log(`entropy(uniform over ${n}) = ${h.toFixed(6)}`);
console.log(`expected ~log2(${n})       = ${expected.toFixed(6)}`);

const diff = Math.abs(h - expected);
const ok = diff < 1e-6;
console.log(`|diff| = ${diff.toExponential(2)}`);
console.log(ok ? "PASS" : "FAIL");
process.exit(ok ? 0 : 1);

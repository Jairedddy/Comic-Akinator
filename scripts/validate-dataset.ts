import fs from "node:fs";
import path from "node:path";
import {
  type Character,
  type QuestionsFile,
  type TraitsFile,
  PATHS,
  countNonNullTraits,
} from "./lib/normalize";

const MIN_TRAITS = 8;
const MIN_CHARACTERS = 400;

function fail(msg: string): never {
  console.error(`\nvalidate-dataset: ${msg}\n`);
  process.exit(1);
}

function loadJson<T>(p: string, hint: string): T {
  if (!fs.existsSync(p)) {
    fail(`Missing ${path.relative(process.cwd(), p)} — ${hint}`);
  }
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch (e) {
    fail(`Could not parse ${p}: ${(e as Error).message}`);
  }
}

function validateTraits(traitDefs: TraitsFile): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const validCategories = new Set(traitDefs.categories);

  for (const [i, t] of traitDefs.traits.entries()) {
    const where = `trait #${i} (${t?.id ?? "unnamed"})`;
    if (!t.id) errors.push(`${where}: missing id`);
    if (!t.category) errors.push(`${where}: missing category`);
    if (!t.label) errors.push(`${where}: missing label`);
    if (t.category && !validCategories.has(t.category))
      errors.push(`${where}: category "${t.category}" not in categories[]`);
    if (t.id && seenIds.has(t.id))
      errors.push(`${where}: duplicate trait id "${t.id}"`);
    if (t.id) seenIds.add(t.id);
    if (typeof t.derivable !== "boolean")
      errors.push(`${where}: derivable must be a boolean`);
  }
  return errors;
}

function validateQuestions(
  questionsFile: QuestionsFile,
  traitDefs: TraitsFile,
): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const validTraitIds = new Set(traitDefs.traits.map((t) => t.id));
  const referencedTraits = new Set<string>();

  for (const [i, q] of questionsFile.questions.entries()) {
    const where = `question #${i} (${q?.id ?? "unnamed"})`;
    if (!q.id) errors.push(`${where}: missing id`);
    if (!q.trait) errors.push(`${where}: missing trait`);
    if (!q.text) errors.push(`${where}: missing text`);
    if (!q.inverse) errors.push(`${where}: missing inverse`);
    if (typeof q.cost !== "number")
      errors.push(`${where}: cost must be a number`);
    if (q.id && seenIds.has(q.id))
      errors.push(`${where}: duplicate question id "${q.id}"`);
    if (q.id) seenIds.add(q.id);
    if (q.trait) {
      if (!validTraitIds.has(q.trait))
        errors.push(`${where}: references unknown trait "${q.trait}"`);
      else referencedTraits.add(q.trait);
    }
  }

  for (const t of traitDefs.traits) {
    if (!referencedTraits.has(t.id))
      errors.push(`trait "${t.id}" is not referenced by any question`);
  }

  return errors;
}

function validateCharacters(
  chars: Character[],
  traitDefs: TraitsFile,
): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (chars.length < MIN_CHARACTERS) {
    errors.push(`Expected ≥${MIN_CHARACTERS} characters, got ${chars.length}`);
    return errors;
  }

  const knownTraitIds = new Set(traitDefs.traits.map((t) => t.id));

  for (const [i, c] of chars.entries()) {
    const where = `entry #${i} (${c?.name ?? "unnamed"})`;
    if (!c.id) errors.push(`${where}: missing id`);
    if (!c.name) errors.push(`${where}: missing name`);
    if (!c.publisher) errors.push(`${where}: missing publisher`);
    if (!c.image) errors.push(`${where}: missing image`);
    if (c.publisher !== "Marvel" && c.publisher !== "DC")
      errors.push(`${where}: bad publisher "${c.publisher}"`);

    if (c.id && seenIds.has(c.id))
      errors.push(`${where}: duplicate id "${c.id}"`);
    if (c.id) seenIds.add(c.id);

    if (!c.traits || typeof c.traits !== "object") {
      errors.push(`${where}: missing traits object`);
    } else {
      for (const tid of Object.keys(c.traits)) {
        if (!knownTraitIds.has(tid))
          errors.push(`${where}: unknown trait "${tid}"`);
      }
      for (const tid of knownTraitIds) {
        if (!(tid in c.traits)) errors.push(`${where}: missing trait "${tid}"`);
      }
    }

    const nonNull = countNonNullTraits(c);
    if (nonNull < MIN_TRAITS)
      errors.push(
        `${where}: only ${nonNull} non-null traits (need ≥${MIN_TRAITS})`,
      );
  }

  return errors;
}

function main(): void {
  const traitDefs = loadJson<TraitsFile>(
    PATHS.traits,
    "data/traits.json should be committed as part of M1.3.",
  );
  const questionsFile = loadJson<QuestionsFile>(
    PATHS.questions,
    "data/questions.json should be committed as part of M1.3.",
  );
  const chars = loadJson<Character[]>(
    PATHS.output,
    "Run `npm run dataset:build` first.",
  );

  if (!Array.isArray(chars)) fail("characters.json: expected an array");

  const allErrors = [
    ...validateTraits(traitDefs),
    ...validateQuestions(questionsFile, traitDefs),
    ...validateCharacters(chars, traitDefs),
  ];

  if (allErrors.length) {
    console.error(
      `\nvalidate-dataset failed with ${allErrors.length} issue(s):`,
    );
    for (const e of allErrors.slice(0, 20)) console.error(`  ${e}`);
    if (allErrors.length > 20)
      console.error(`  …and ${allErrors.length - 20} more`);
    process.exit(1);
  }

  const marvelCount = chars.filter((c) => c.publisher === "Marvel").length;
  const dcCount = chars.filter((c) => c.publisher === "DC").length;
  const top50 = [...chars]
    .sort((a, b) => (b.appearances ?? 0) - (a.appearances ?? 0))
    .slice(0, 50);
  const top50UnderRichness = top50.filter(
    (c) => countNonNullTraits(c) < 15,
  ).length;

  console.log(`validate-dataset: ${chars.length} characters OK`);
  console.log(`  ${marvelCount} Marvel, ${dcCount} DC`);
  console.log(
    `  ${traitDefs.traits.length} traits, ${questionsFile.questions.length} questions`,
  );
  console.log(
    `  every character has all ${traitDefs.traits.length} trait keys + ≥${MIN_TRAITS} non-null`,
  );
  console.log(
    `  every question references a real trait; every trait has ≥1 question`,
  );
  if (top50UnderRichness > 0) {
    console.log(
      `  warning: ${top50UnderRichness}/50 top characters have fewer than 15 non-null traits (M1.3 target)`,
    );
  } else {
    console.log(
      `  top-50 characters all have ≥15 non-null traits (M1.3 target met)`,
    );
  }
}

main();

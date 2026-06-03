import fs from "node:fs";
import path from "node:path";
import { type Character, PATHS, countTraits } from "./lib/normalize";

const MIN_TRAITS = 8;
const MIN_CHARACTERS = 400;

function fail(msg: string): never {
  console.error(`\nvalidate-dataset: ${msg}\n`);
  process.exit(1);
}

function main(): void {
  if (!fs.existsSync(PATHS.output)) {
    fail(
      `${path.relative(process.cwd(), PATHS.output)} does not exist. Run \`npm run dataset:build\` first.`,
    );
  }

  let chars: Character[];
  try {
    chars = JSON.parse(fs.readFileSync(PATHS.output, "utf8")) as Character[];
  } catch (e) {
    fail(`Could not parse ${PATHS.output}: ${(e as Error).message}`);
  }

  if (!Array.isArray(chars)) fail(`Expected an array, got ${typeof chars}`);
  if (chars.length < MIN_CHARACTERS)
    fail(`Expected ≥${MIN_CHARACTERS} characters, got ${chars.length}`);

  const errors: string[] = [];
  const seenIds = new Set<string>();

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

    const traits = countTraits(c);
    if (traits < MIN_TRAITS)
      errors.push(
        `${where}: only ${traits} populated traits (need ≥${MIN_TRAITS})`,
      );
  }

  if (errors.length) {
    console.error(`\nvalidate-dataset failed with ${errors.length} issue(s):`);
    for (const e of errors.slice(0, 20)) console.error(`  ${e}`);
    if (errors.length > 20) console.error(`  …and ${errors.length - 20} more`);
    process.exit(1);
  }

  const marvelCount = chars.filter((c) => c.publisher === "Marvel").length;
  const dcCount = chars.filter((c) => c.publisher === "DC").length;
  console.log(`validate-dataset: ${chars.length} characters OK`);
  console.log(`  ${marvelCount} Marvel, ${dcCount} DC`);
  console.log(
    `  every entry has id + name + publisher + image + ≥${MIN_TRAITS} traits`,
  );
}

main();

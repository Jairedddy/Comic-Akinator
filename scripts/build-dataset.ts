import fs from "node:fs";
import path from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import {
  type Character,
  type PowerStats,
  PATHS,
  TRAIT_FIELDS,
  cleanNumber,
  cleanString,
  countTraits,
  dedupeKey,
  normalizeAlignment,
  normalizeGender,
  normalizeIdentity,
  normalizePublisher,
  parseYear,
  slugify,
} from "./lib/normalize";

type SuperheroEntry = {
  id: number;
  name: string;
  slug: string;
  powerstats: Record<string, number | string | null>;
  appearance: Record<string, string | string[] | null>;
  biography: Record<string, string | string[] | null>;
  work: Record<string, string | null>;
  connections: Record<string, string | null>;
  images?: { xs?: string; sm?: string; md?: string; lg?: string };
};

type FtRow = {
  name?: string;
  ID?: string;
  ALIGN?: string;
  EYE?: string;
  HAIR?: string;
  SEX?: string;
  ALIVE?: string;
  APPEARANCES?: string;
  "FIRST APPEARANCE"?: string;
  Year?: string;
  YEAR?: string;
};

const TARGET_COUNT = 500;
// Hard floor — matches the validator's MIN_TRAITS. Anything below this gets
// dropped from the final dataset so the validator never sees stragglers.
const MIN_TRAITS = 8;

// Hand-curated rescue for canonical heroes whose Superhero API publisher is a
// variant label AND whose fullName doesn't dedupe-match FT538 (e.g., "Clint
// Barton" vs FT538's "Clinton Barton"). Keyed by slugified hero name.
const FAMOUS_PUBLISHER_OVERRIDES: Record<string, "Marvel" | "DC"> = {
  hawkeye: "Marvel",
};

function ensureFile(p: string, hint: string): void {
  if (!fs.existsSync(p)) {
    console.error(`\nMissing source file:  ${p}`);
    console.error(`  ${hint}\n`);
    process.exit(1);
  }
}

// Return the list of FT538 lookup keys for a Superhero API entry:
// the slugged alias plus the slugged real-name (FT538 indexes some top heroes
// by alias like "Spider-Man (...)", secondary heroes by real name like
// "Clinton Barton (Earth-616)" — try both).
function ftLookupKeys(name: string, fullName: string | null): string[] {
  const keys = [dedupeKey(name)];
  if (fullName) {
    const k = dedupeKey(fullName);
    if (k && k !== keys[0]) keys.push(k);
  }
  return keys;
}

function lookupFt(
  keys: string[],
  map: Map<string, FtRow>,
): FtRow | undefined {
  for (const k of keys) {
    const hit = map.get(k);
    if (hit) return hit;
  }
  return undefined;
}

function loadSuperhero(
  ftMarvel: Map<string, FtRow>,
  ftDc: Map<string, FtRow>,
): Character[] {
  ensureFile(
    PATHS.superheroJson,
    "Download https://akabab.github.io/superhero-api/api/all.json and save it to that path.",
  );
  const raw = fs.readFileSync(PATHS.superheroJson, "utf8");
  const entries = JSON.parse(raw) as SuperheroEntry[];

  let recoveredByFt = 0;
  const out: Character[] = [];
  for (const e of entries) {
    // 1. Try the Superhero API's own publisher field.
    let publisher = normalizePublisher(e.biography.publisher as string);
    // 2. Fall back to the FT538 character-name index when the API's publisher
    //    is garbage (the dataset mis-uses the field for variant labels like
    //    "Rune King Thor" or "Evil Deadpool"). Try alias and real-name keys.
    if (!publisher) {
      const fullName = cleanString(e.biography.fullName as string);
      const keys = ftLookupKeys(e.name, fullName);
      if (lookupFt(keys, ftMarvel)) publisher = "Marvel";
      else if (lookupFt(keys, ftDc)) publisher = "DC";
      if (publisher) recoveredByFt++;
    }
    // 3. Final hand-curated rescue for known canonical heroes.
    if (!publisher) {
      const override = FAMOUS_PUBLISHER_OVERRIDES[slugify(e.name)];
      if (override) publisher = override;
    }
    if (!publisher) continue;

    const image =
      e.images?.md ?? e.images?.lg ?? e.images?.sm ?? e.images?.xs;
    if (!image) continue;

    const ps = e.powerstats;
    const statKeys = [
      "intelligence",
      "strength",
      "speed",
      "durability",
      "power",
      "combat",
    ] as const;
    const stats = statKeys.map((k) => cleanNumber(ps[k]));
    const powerstats: PowerStats | null = stats.every((n) => n != null)
      ? {
          intelligence: stats[0]!,
          strength: stats[1]!,
          speed: stats[2]!,
          durability: stats[3]!,
          power: stats[4]!,
          combat: stats[5]!,
        }
      : null;

    const id = slugify(e.name);
    if (!id) continue;

    const aliasesArr = (e.biography.aliases as string[] | undefined) ?? [];

    out.push({
      id,
      name: e.name.trim(),
      realName: cleanString(e.biography.fullName as string),
      publisher,
      image,

      alignment: normalizeAlignment(e.biography.alignment as string),
      gender: normalizeGender(e.appearance.gender as string),
      species: cleanString(e.appearance.race as string),
      eyeColor: cleanString(e.appearance.eyeColor as string),
      hairColor: cleanString(e.appearance.hairColor as string),

      powerstats,

      appearances: null,
      yearFirstAppeared: parseYear(e.biography.firstAppearance as string),
      identity: null,

      aliases: aliasesArr
        .map((a) => cleanString(a))
        .filter((a): a is string => a !== null),
      occupation: cleanString(e.work.occupation as string),
      groupAffiliation: cleanString(e.connections.groupAffiliation as string),
      placeOfBirth: cleanString(e.biography.placeOfBirth as string),
      firstAppearance: cleanString(e.biography.firstAppearance as string),

      traitCompleteness: 0,
    });
  }
  if (recoveredByFt > 0) {
    console.log(
      `  recovered ${recoveredByFt} characters whose Superhero API publisher was a variant label (via FT538 name lookup)`,
    );
  }
  return out;
}

function loadFt538(filePath: string, publisher: string): Map<string, FtRow> {
  ensureFile(
    filePath,
    `Download from https://github.com/fivethirtyeight/data/tree/master/comic-characters and save the ${publisher} CSV to ${filePath}.`,
  );
  const raw = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as FtRow[];
  const map = new Map<string, FtRow>();
  for (const row of rows) {
    if (!row.name) continue;
    const key = dedupeKey(row.name);
    const prev = map.get(key);
    // Keep the row with higher appearance count when names collide.
    if (
      !prev ||
      (parseInt(row.APPEARANCES ?? "0", 10) || 0) >
        (parseInt(prev.APPEARANCES ?? "0", 10) || 0)
    ) {
      map.set(key, row);
    }
  }
  console.log(
    `  loaded ${rows.length} ${publisher} rows from FiveThirtyEight (${map.size} unique by name)`,
  );
  return map;
}

function mergeWithFt(
  chars: Character[],
  ftMarvel: Map<string, FtRow>,
  ftDc: Map<string, FtRow>,
): void {
  let augmented = 0;
  for (const c of chars) {
    const keys = ftLookupKeys(c.name, c.realName);
    const ft = lookupFt(keys, c.publisher === "Marvel" ? ftMarvel : ftDc);
    if (!ft) continue;
    augmented++;

    const appearances = ft.APPEARANCES ? parseInt(ft.APPEARANCES, 10) : NaN;
    if (Number.isFinite(appearances) && appearances > 0)
      c.appearances = appearances;

    const year = parseYear(ft.Year ?? ft.YEAR);
    if (year && !c.yearFirstAppeared) c.yearFirstAppeared = year;

    if (!c.identity) c.identity = normalizeIdentity(ft.ID);
    if (!c.gender) c.gender = normalizeGender(ft.SEX);
    if (!c.eyeColor) c.eyeColor = cleanString(ft.EYE);
    if (!c.hairColor) c.hairColor = cleanString(ft.HAIR);
    if (!c.alignment) c.alignment = normalizeAlignment(ft.ALIGN);
  }
  console.log(
    `  augmented ${augmented}/${chars.length} characters with FiveThirtyEight data`,
  );
}

function dedupeById(chars: Character[]): Character[] {
  const seen = new Map<string, Character>();
  for (const c of chars) {
    const existing = seen.get(c.id);
    if (!existing) {
      seen.set(c.id, c);
      continue;
    }
    if (countTraits(c) > countTraits(existing)) seen.set(c.id, c);
  }
  return [...seen.values()];
}

function selectTopN(chars: Character[], n: number): Character[] {
  return [...chars]
    .map((c) => {
      const pop = Math.log10((c.appearances ?? 1) + 1);
      const score = c.traitCompleteness * (1 + pop);
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.c);
}

function reportFamousMissing(chars: Character[]): void {
  const famous = [
    "spider-man",
    "batman",
    "superman",
    "iron-man",
    "wonder-woman",
    "captain-america",
    "hulk",
    "thor",
    "black-widow",
    "hawkeye",
    "the-flash",
    "flash",
    "green-lantern",
    "aquaman",
    "wolverine",
    "storm",
    "deadpool",
    "doctor-strange",
    "black-panther",
    "joker",
  ];
  const ids = new Set(chars.map((c) => c.id));
  const missing = famous.filter((f) => !ids.has(f));
  // "flash" vs "the-flash" — treat both as one entry: only flag if BOTH absent.
  const flashOk = ids.has("the-flash") || ids.has("flash");
  const filtered = missing.filter((f) =>
    f === "flash" || f === "the-flash" ? !flashOk : true,
  );
  if (filtered.length) {
    console.log(
      `  heads-up: ${filtered.length} canonical heroes not in final set: ${filtered.join(", ")}`,
    );
  } else {
    console.log(`  all canonical top heroes present`);
  }
}

function main(): void {
  console.log("Loading sources…");

  // Load FT538 first — its name index is what rescues Superhero API entries
  // whose `publisher` field is a character-variant label rather than the
  // actual publisher.
  const ftMarvel = loadFt538(PATHS.marvelCsv, "Marvel");
  const ftDc = loadFt538(PATHS.dcCsv, "DC");

  let chars = loadSuperhero(ftMarvel, ftDc);
  console.log(
    `  loaded ${chars.length} Marvel/DC characters from Superhero API (with image)`,
  );

  console.log("Merging FiveThirtyEight data into matched entries…");
  mergeWithFt(chars, ftMarvel, ftDc);

  console.log("Deduplicating by id…");
  chars = dedupeById(chars);
  console.log(`  ${chars.length} unique characters`);

  for (const c of chars) c.traitCompleteness = countTraits(c) / TRAIT_FIELDS;

  const before = chars.length;
  chars = chars.filter((c) => countTraits(c) >= MIN_TRAITS);
  console.log(
    `  dropped ${before - chars.length} characters with fewer than ${MIN_TRAITS} traits`,
  );

  console.log(`Selecting top ${TARGET_COUNT} by completeness × popularity…`);
  const top = selectTopN(chars, TARGET_COUNT);

  const minComplete = top.reduce((m, c) => Math.min(m, c.traitCompleteness), 1);
  const maxComplete = top.reduce((m, c) => Math.max(m, c.traitCompleteness), 0);
  const avgComplete =
    top.reduce((s, c) => s + c.traitCompleteness, 0) / top.length;

  const dataDir = path.dirname(PATHS.output);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(PATHS.output, JSON.stringify(top, null, 2), "utf8");

  console.log(
    `\nWrote ${top.length} characters to ${path.relative(process.cwd(), PATHS.output)}`,
  );
  console.log(
    `  completeness — min ${(minComplete * 100).toFixed(0)}%, ` +
      `avg ${(avgComplete * 100).toFixed(0)}%, ` +
      `max ${(maxComplete * 100).toFixed(0)}%`,
  );

  const marvelCount = top.filter((c) => c.publisher === "Marvel").length;
  const dcCount = top.filter((c) => c.publisher === "DC").length;
  console.log(`  ${marvelCount} Marvel, ${dcCount} DC`);

  reportFamousMissing(top);

  const top10 = [...top]
    .sort((a, b) => (b.appearances ?? 0) - (a.appearances ?? 0))
    .slice(0, 10);
  console.log(`  top 10 by appearances:`);
  for (const c of top10) {
    console.log(
      `    ${c.name.padEnd(30)} ${c.publisher.padEnd(7)} ${c.appearances ?? "?"} appearances`,
    );
  }
}

main();

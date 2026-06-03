import path from "node:path";

export type Publisher = "Marvel" | "DC";
export type Alignment = "good" | "bad" | "neutral";
export type Gender = "Male" | "Female";
export type Identity = "Secret" | "Public" | "Unknown";

export type PowerStats = {
  intelligence: number;
  strength: number;
  speed: number;
  durability: number;
  power: number;
  combat: number;
};

export type Character = {
  id: string;
  name: string;
  realName: string | null;
  publisher: Publisher;
  image: string;

  alignment: Alignment | null;
  gender: Gender | null;
  species: string | null;
  eyeColor: string | null;
  hairColor: string | null;

  powerstats: PowerStats | null;

  appearances: number | null;
  yearFirstAppeared: number | null;
  identity: Identity | null;

  aliases: string[];
  occupation: string | null;
  groupAffiliation: string | null;
  placeOfBirth: string | null;
  firstAppearance: string | null;

  traitCompleteness: number;
};

const PAREN_RE = /\s*\([^)]*\)\s*/g;
const NON_SLUG_RE = /[^a-z0-9]+/g;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(PAREN_RE, " ")
    .trim()
    .replace(NON_SLUG_RE, "-")
    .replace(/^-+|-+$/g, "");
}

export function dedupeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(PAREN_RE, "")
    .replace(/\s+(comics?|character|prime|new\s+earth|earth-\d+)$/gi, "")
    .replace(NON_SLUG_RE, "")
    .trim();
}

export function normalizePublisher(
  raw: string | null | undefined,
): Publisher | null {
  if (!raw) return null;
  const l = raw.toLowerCase();
  if (l.includes("marvel")) return "Marvel";
  if (l.includes("dc")) return "DC";
  return null;
}

export function normalizeAlignment(
  raw: string | null | undefined,
): Alignment | null {
  if (!raw) return null;
  const l = raw.toLowerCase().trim();
  if (l === "good" || l === "good characters") return "good";
  if (l === "bad" || l === "bad characters") return "bad";
  if (l.startsWith("neutral")) return "neutral";
  return null;
}

export function normalizeGender(raw: string | null | undefined): Gender | null {
  if (!raw) return null;
  const l = raw.toLowerCase();
  if (l.includes("female")) return "Female";
  if (l.includes("male")) return "Male";
  return null;
}

export function normalizeIdentity(
  raw: string | null | undefined,
): Identity | null {
  if (!raw) return null;
  const l = raw.toLowerCase();
  if (l.includes("secret")) return "Secret";
  if (l.includes("public")) return "Public";
  if (l.includes("known") || l.includes("unknown")) return "Unknown";
  return null;
}

// "Aug-62" → 1962; "Mar-95" → 1995; "2008" → 2008
export function parseYear(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = raw.match(/(\d{2,4})/);
  if (!m) return null;
  let n = parseInt(m[1], 10);
  if (n < 100) n = n < 30 ? 2000 + n : 1900 + n;
  if (n < 1930 || n > 2030) return null;
  return n;
}

// Superhero API uses sentinel strings like "No alter egos found." and "-" for missing.
export function cleanString(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  if (t === "-" || t === "null") return null;
  if (/^no\s+/i.test(t) && /\s+(found|known)\.?$/i.test(t)) return null;
  return t;
}

export function cleanNumber(
  raw: number | string | null | undefined,
): number | null {
  if (raw == null) return null;
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

// 15 = number of trait fields we count in completeness (keep in sync with countTraits).
export const TRAIT_FIELDS = 15;

export function countTraits(c: Character): number {
  let n = 0;
  if (c.alignment) n++;
  if (c.gender) n++;
  if (c.species) n++;
  if (c.eyeColor) n++;
  if (c.hairColor) n++;
  if (c.powerstats) n++;
  if (c.appearances) n++;
  if (c.yearFirstAppeared) n++;
  if (c.identity) n++;
  if (c.aliases.length) n++;
  if (c.occupation) n++;
  if (c.groupAffiliation) n++;
  if (c.placeOfBirth) n++;
  if (c.firstAppearance) n++;
  if (c.realName) n++;
  return n;
}

const ROOT = process.cwd();
export const PATHS = {
  marvelCsv: path.join(ROOT, "scripts", "sources", "marvel.csv"),
  dcCsv: path.join(ROOT, "scripts", "sources", "dc.csv"),
  superheroJson: path.join(ROOT, "scripts", "sources", "superhero-api.json"),
  output: path.join(ROOT, "data", "characters.json"),
};

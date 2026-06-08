import type { Character, TraitsFile } from "./normalize";

// ============================================================================
// Famous-character lookups.
//
// The source data has gaps (Superhero API marks Thor's species as "God / Eternal"
// but Wolverine's as "Mutant" — patchy), and the engine works better when we
// fill those holes with high-confidence facts about well-known characters.
// Each set holds character slugs (lowercase, hyphenated — matches Character.id).
//
// Edit these sets if you find a known character mis-classified during play.
// ============================================================================

const KNOWN_DEITIES = new Set<string>([
  "thor",
  "loki",
  "odin",
  "hela",
  "sif",
  "balder",
  "heimdall",
  "tyr",
  "amora",
  "skurge",
  "frigga",
  "valkyrie",
  "fandral",
  "hogun",
  "volstagg",
  "ulik",
  "hercules",
  "ares",
  "neptune",
  "apollo",
  "atlas",
]);

const KNOWN_ASGARDIANS = new Set<string>([
  "thor",
  "loki",
  "odin",
  "hela",
  "sif",
  "balder",
  "heimdall",
  "tyr",
  "amora",
  "skurge",
  "frigga",
  "valkyrie",
  "fandral",
  "hogun",
  "volstagg",
  "beta-ray-bill",
  "ulik",
]);

const KNOWN_ATLANTEANS = new Set<string>([
  "aquaman",
  "namor",
  "namorita",
  "mera",
  "aqualad",
  "tempest",
  "ocean-master",
  "garth",
]);

const KNOWN_SYMBIOTES = new Set<string>([
  "venom",
  "carnage",
  "toxin",
  "anti-venom",
  "scream",
  "agent-venom",
  "venom-ii",
  "venom-iii",
  "spider-carnage",
]);

const KNOWN_ANDROIDS_ROBOTS = new Set<string>([
  "vision",
  "ultron",
  "machine-man",
  "sentinel",
  "red-tornado",
  "brainiac",
  "amazo",
  "metallo",
  "ironheart", // borderline, but uses tech-only armor with AI
  "anti-vision",
]);

const KNOWN_CYBORGS = new Set<string>([
  "cyborg",
  "deathlok",
  "bishop",
  "deathstroke",
]);

const KNOWN_DEMONS_SUPERNATURAL = new Set<string>([
  "mephisto",
  "ghost-rider",
  "ghost-rider-ii",
  "blade",
  "dracula",
  "morbius",
  "hellstorm",
  "spawn",
  "etrigan",
  "spectre",
  "deadman",
  "swamp-thing",
  "ghost-rider-johnny-blaze",
  "raven",
]);

const KNOWN_MUTANTS = new Set<string>([
  "wolverine",
  "storm",
  "cyclops",
  "jean-grey",
  "phoenix",
  "professor-x",
  "magneto",
  "mystique",
  "rogue",
  "gambit",
  "beast",
  "nightcrawler",
  "iceman",
  "colossus",
  "kitty-pryde",
  "shadowcat",
  "emma-frost",
  "jubilee",
  "psylocke",
  "dazzler",
  "bishop",
  "cable",
  "sunfire",
  "polaris",
  "havok",
  "banshee",
  "multiple-man",
  "forge",
  "cannonball",
  "husk",
  "northstar",
  "aurora",
  "x-23",
  "hope-summers",
  "pixie",
  "deadpool",
  "domino",
  "longshot",
  "siryn",
  "shatterstar",
  "boom-boom",
  "sebastian-shaw",
  "white-queen",
  "namora",
  "evil-deadpool",
  "vindicator-ii",
  "thunderbird-ii",
  "angel-salvadore",
  "boom-boom-marvel",
  "she-thing",
]);

const KNOWN_ALIENS = new Set<string>([
  "superman",
  "supergirl",
  "super-girl",
  "superboy",
  "superboy-prime",
  "general-zod",
  "bizarro",
  "martian-manhunter",
  "j-onn-jonzz",
  "miss-martian",
  "starfire",
  "blackfire",
  "silver-surfer",
  "thanos",
  "drax",
  "drax-the-destroyer",
  "gamora",
  "rocket-raccoon",
  "groot",
  "mantis",
  "nebula",
  "adam-warlock",
  "warlock",
  "hyperion",
  "ronan",
  "captain-mar-vell",
  "phyla-vell",
  "mongul",
  "darkseid",
  "lobo",
  "kang",
  "annihilus",
  "captain-marvel",
  "ms-marvel-ii",
  "venom-ii", // overlap with symbiote — symbiote check takes priority
]);

const KNOWN_COSMIC_ENTITIES = new Set<string>([
  "galactus",
  "eternity",
  "infinity",
  "living-tribunal",
  "death-of-the-endless",
  "beyonder",
  "anti-monitor",
  "presence",
  "the-presence",
]);

const KNOWN_HUMANS_NO_POWERS = new Set<string>([
  // Marvel "regular" humans
  "hawkeye",
  "black-widow",
  "punisher",
  "iron-fist",
  "shang-chi",
  "moon-knight",
  "elektra",
  "winter-soldier",
  "war-machine",
  "falcon",
  "kingpin",
  // DC street-level
  "batman",
  "robin",
  "robin-ii",
  "robin-iii",
  "robin-v",
  "nightwing",
  "red-hood",
  "batgirl",
  "batgirl-ii",
  "batgirl-iii",
  "batgirl-v",
  "batwoman",
  "huntress",
  "alfred",
  "alfred-pennyworth",
  "commissioner-gordon",
  "joker",
  "riddler",
  "penguin",
  "scarecrow",
  "poison-ivy",
  "harley-quinn",
  "mr-freeze",
  "two-face",
  "hugo-strange",
  "ras-al-ghul",
  "ra-s-al-ghul",
  "lex-luthor",
  "deathstroke",
  "lady-shiva",
  "catwoman",
  "green-arrow",
  "deadshot",
  "ozymandias",
  "rorschach",
  "comedian",
  "nite-owl-ii",
  "question",
  "spoiler",
  "orphan",
]);

const KNOWN_GOTHAMITES = new Set<string>([
  "batman",
  "robin",
  "robin-ii",
  "robin-iii",
  "robin-v",
  "nightwing",
  "red-hood",
  "batgirl",
  "batgirl-ii",
  "batgirl-iii",
  "batgirl-v",
  "batwoman",
  "huntress",
  "spoiler",
  "orphan",
  "alfred",
  "alfred-pennyworth",
  "commissioner-gordon",
  "joker",
  "riddler",
  "penguin",
  "scarecrow",
  "poison-ivy",
  "harley-quinn",
  "mr-freeze",
  "two-face",
  "hugo-strange",
  "ras-al-ghul",
  "ra-s-al-ghul",
  "killer-croc",
  "man-bat",
  "bane",
  "clayface",
  "deadshot",
  "catwoman",
  "victor-zsasz",
  "killer-moth",
  "professor-pyg",
]);

const KNOWN_METROPOLITANS = new Set<string>([
  "superman",
  "supergirl",
  "super-girl",
  "superboy",
  "lex-luthor",
  "lois-lane",
  "jimmy-olsen",
  "perry-white",
  "general-zod",
  "bizarro",
  "metallo",
  "brainiac",
  "parasite",
  "steel",
  "livewire",
  "mongul",
]);

const KNOWN_NEW_YORKERS = new Set<string>([
  "spider-man",
  "spider-man-ii",
  "spider-girl",
  "spider-woman",
  "miles-morales",
  "spider-man-noir",
  "ben-reilly",
  "scarlet-spider",
  "scarlet-spider-ii",
  "daredevil",
  "elektra",
  "punisher",
  "jessica-jones",
  "luke-cage",
  "iron-fist",
  "ms-marvel",
  "ms-marvel-ii",
  "captain-america",
  "kingpin",
  "vulture",
  "doctor-octopus",
  "green-goblin",
  "rhino",
  "lizard",
  "mysterio",
  "kraven-the-hunter",
  "shocker",
  "sandman",
  "mister-fantastic",
  "human-torch",
  "thing",
  "invisible-woman",
  "iron-man",
  "doctor-strange",
  "she-hulk",
  "moon-knight",
  "winter-soldier",
  "falcon",
  "hawkeye",
  "black-widow",
  "iceman",
  "magik",
]);

const KNOWN_UK_ORIGIN = new Set<string>([
  "captain-britain",
  "psylocke",
  "union-jack",
  "spitfire",
  "pete-wisdom",
  "meggan",
]);

const KNOWN_NON_HUMAN_SKIN = new Set<string>([
  "hulk",
  "she-hulk",
  "red-hulk",
  "skaar",
  "beast",
  "beast-boy",
  "nightcrawler",
  "mystique",
  "j-onn-jonzz",
  "martian-manhunter",
  "miss-martian",
  "brainiac",
  "vision",
  "mister-sinister",
  "spectre",
  "raven",
  "thanos",
  "gamora",
  "drax",
  "drax-the-destroyer",
  "nebula",
  "ronan",
  "kang",
  "darkseid",
  "starfire",
  "blackfire",
]);

// ============================================================================
// Derivation
// ============================================================================

const ALL_SPECIES_KEYS = [
  "human",
  "mutant",
  "alien",
  "deity",
  "android-robot",
  "cyborg",
  "demon-supernatural",
  "symbiote",
  "atlantean",
  "cosmic-entity",
] as const;

const ALL_ORIGIN_KEYS = [
  "new-york",
  "gotham",
  "metropolis",
  "london-uk",
  "asgard",
  "atlantis",
  "outer-space",
] as const;

function inferPrimarySpecies(
  c: Character,
): (typeof ALL_SPECIES_KEYS)[number] | null {
  const slug = c.id;

  // Name lookups (highest confidence — override the field).
  // Order matters: more specific / less common categories first.
  if (KNOWN_SYMBIOTES.has(slug)) return "symbiote";
  if (KNOWN_ATLANTEANS.has(slug)) return "atlantean";
  if (KNOWN_DEITIES.has(slug)) return "deity";
  if (KNOWN_ANDROIDS_ROBOTS.has(slug)) return "android-robot";
  if (KNOWN_CYBORGS.has(slug)) return "cyborg";
  if (KNOWN_DEMONS_SUPERNATURAL.has(slug)) return "demon-supernatural";
  if (KNOWN_COSMIC_ENTITIES.has(slug)) return "cosmic-entity";
  if (KNOWN_MUTANTS.has(slug)) return "mutant";
  if (KNOWN_ALIENS.has(slug)) return "alien";
  if (KNOWN_HUMANS_NO_POWERS.has(slug)) return "human";

  // Species field fallback.
  const sp = (c.species ?? "").toLowerCase().trim();
  if (!sp) return null;

  if (/\b(symbiote|klyntar)\b/.test(sp)) return "symbiote";
  if (/\batlantean\b/.test(sp)) return "atlantean";
  if (/\b(android|robot|artificial intelligence)\b/.test(sp))
    return "android-robot";
  if (/\bcyborg\b/.test(sp)) return "cyborg";
  if (/\b(god|goddess|deity|eternal|asgardian|olympian)\b/.test(sp))
    return "deity";
  if (/\b(demon|ghost|undead|vampire|werewolf|spectre)\b/.test(sp))
    return "demon-supernatural";
  if (/\b(celestial|cosmic entity|abstract being)\b/.test(sp))
    return "cosmic-entity";
  if (/\bmutant\b/.test(sp)) return "mutant";
  if (
    /\b(alien|kryptonian|martian|czarnian|tamaranean|inhuman|saiyan|new ?god|skrull|kree|xandarian)\b/.test(
      sp,
    )
  )
    return "alien";
  if (/\b(human|mutate|metahuman|hybrid)\b/.test(sp) && !/non-human/.test(sp))
    return "human";

  return null;
}

function applyPowerTraits(
  c: Character,
  t: Record<string, number | null>,
): void {
  if (c.powerstats) {
    const ps = c.powerstats;
    const yn = (v: number, yes: number, no: number): number | null =>
      v >= yes ? 1 : v <= no ? 0 : null;

    t["power-super-strength"] = yn(ps.strength, 75, 45);
    t["power-super-speed"] = yn(ps.speed, 75, 45);
    t["power-super-durability"] = yn(ps.durability, 75, 45);
    t["power-super-intelligence"] = yn(ps.intelligence, 90, 60);
    t["power-master-combatant"] = yn(ps.combat, 80, 50);
    t["power-cosmic-energy"] = yn(ps.power, 85, 50);

    const maxStat = Math.max(
      ps.intelligence,
      ps.strength,
      ps.speed,
      ps.durability,
      ps.power,
      ps.combat,
    );
    t["power-no-superpowers"] = maxStat <= 60 ? 1 : maxStat >= 80 ? 0 : null;
  }

  // Name override — these characters are canonically powerless even if their
  // powerstats are misleadingly high.
  if (KNOWN_HUMANS_NO_POWERS.has(c.id)) {
    t["power-no-superpowers"] = 1;
  }
}

function applyEyeTraits(c: Character, t: Record<string, number | null>): void {
  if (!c.eyeColor) return;
  const ec = c.eyeColor.toLowerCase();
  const isUnusual =
    /\b(red|yellow|gold|silver|white|black|glowing|violet|purple|orange|pink|amber)\b/.test(
      ec,
    );
  t["eyes-blue"] = /\bblue\b/.test(ec) ? 1 : 0;
  t["eyes-brown"] = /\bbrown\b/.test(ec) && !/blue|green/.test(ec) ? 1 : 0;
  t["eyes-green"] = /\bgreen\b/.test(ec) ? 1 : 0;
  t["eyes-unusual"] = isUnusual ? 1 : 0;
}

function applyHairTraits(c: Character, t: Record<string, number | null>): void {
  if (!c.hairColor) return;
  const hc = c.hairColor.toLowerCase();

  if (/\b(bald|no hair)\b/.test(hc)) {
    t["hair-bald"] = 1;
    t["hair-black"] = 0;
    t["hair-blonde"] = 0;
    t["hair-red"] = 0;
    t["hair-brown"] = 0;
    return;
  }

  const isBlack = /\bblack\b/.test(hc);
  const isBlonde = /\b(blond|blonde|yellow)\b/.test(hc);
  // Red includes auburn, reddish, strawberry blond. Check before brown.
  const isRed = /\b(red|auburn|strawberry)\b/.test(hc);
  const isBrown = /\bbrown\b/.test(hc) && !isRed;

  t["hair-black"] = isBlack ? 1 : 0;
  t["hair-blonde"] = isBlonde ? 1 : 0;
  t["hair-red"] = isRed ? 1 : 0;
  t["hair-brown"] = isBrown ? 1 : 0;
  t["hair-bald"] = 0;
}

function applyOriginTraits(
  c: Character,
  t: Record<string, number | null>,
): void {
  const slug = c.id;
  const pob = (c.placeOfBirth ?? "").toLowerCase();

  let primary: (typeof ALL_ORIGIN_KEYS)[number] | null = null;

  // Name lookups (high confidence)
  if (KNOWN_GOTHAMITES.has(slug)) primary = "gotham";
  else if (KNOWN_METROPOLITANS.has(slug)) primary = "metropolis";
  else if (KNOWN_ATLANTEANS.has(slug)) primary = "atlantis";
  else if (KNOWN_ASGARDIANS.has(slug)) primary = "asgard";
  else if (KNOWN_NEW_YORKERS.has(slug)) primary = "new-york";
  else if (KNOWN_UK_ORIGIN.has(slug)) primary = "london-uk";
  else if (KNOWN_ALIENS.has(slug) || KNOWN_COSMIC_ENTITIES.has(slug))
    primary = "outer-space";
  // Place-of-birth string match
  else if (/\bgotham\b/.test(pob)) primary = "gotham";
  else if (/\bmetropolis\b/.test(pob)) primary = "metropolis";
  else if (/\batlantis\b/.test(pob)) primary = "atlantis";
  else if (/\basgard\b/.test(pob)) primary = "asgard";
  else if (/\bnew york\b/.test(pob)) primary = "new-york";
  else if (/\b(london|united kingdom|england|britain)\b/.test(pob))
    primary = "london-uk";
  else if (/\b(planet|galaxy|cosmos|krypton|mars\b|tamaran)\b/.test(pob))
    primary = "outer-space";

  if (primary !== null) {
    for (const o of ALL_ORIGIN_KEYS) {
      t[`origin-${o}`] = primary === o ? 1 : 0;
    }
  }
}

export function deriveTraits(
  c: Character,
  traitDefs: TraitsFile,
): Record<string, number | null> {
  const t: Record<string, number | null> = {};

  // Default every trait to null, then fill the derivable ones.
  for (const td of traitDefs.traits) t[td.id] = null;

  // --- Universe ---
  t["universe-marvel"] = c.publisher === "Marvel" ? 1 : 0;
  t["universe-dc"] = c.publisher === "DC" ? 1 : 0;

  // --- Alignment (mutually exclusive when known) ---
  if (c.alignment !== null) {
    t["alignment-hero"] = c.alignment === "good" ? 1 : 0;
    t["alignment-villain"] = c.alignment === "bad" ? 1 : 0;
    t["alignment-antihero"] = c.alignment === "neutral" ? 1 : 0;
  }

  // --- Gender ---
  if (c.gender !== null) {
    t["gender-male"] = c.gender === "Male" ? 1 : 0;
    t["gender-female"] = c.gender === "Female" ? 1 : 0;
  }

  // --- Species (mutually exclusive primary) ---
  const primarySpecies = inferPrimarySpecies(c);
  if (primarySpecies !== null) {
    for (const sId of ALL_SPECIES_KEYS) {
      t[`species-${sId}`] = primarySpecies === sId ? 1 : 0;
    }
  }

  // --- Powers ---
  applyPowerTraits(c, t);

  // --- Era ---
  if (c.yearFirstAppeared !== null) {
    const y = c.yearFirstAppeared;
    t["era-golden-age"] = y >= 1938 && y < 1956 ? 1 : 0;
    t["era-silver-age"] = y >= 1956 && y < 1970 ? 1 : 0;
    t["era-bronze-age"] = y >= 1970 && y < 1985 ? 1 : 0;
    t["era-modern-age"] = y >= 1985 && y < 2000 ? 1 : 0;
    t["era-recent"] = y >= 2000 ? 1 : 0;
  }

  // --- Appearance ---
  applyEyeTraits(c, t);
  applyHairTraits(c, t);

  if (
    primarySpecies === "alien" ||
    primarySpecies === "demon-supernatural" ||
    primarySpecies === "symbiote" ||
    primarySpecies === "atlantean" ||
    primarySpecies === "cosmic-entity" ||
    primarySpecies === "android-robot" ||
    KNOWN_NON_HUMAN_SKIN.has(c.id)
  ) {
    t["skin-non-human-color"] = 1;
  } else if (primarySpecies !== null) {
    t["skin-non-human-color"] = 0;
  }

  // --- Secret Identity ---
  if (c.identity === "Secret") {
    t["identity-secret"] = 1;
    t["identity-public"] = 0;
  } else if (c.identity === "Public") {
    t["identity-secret"] = 0;
    t["identity-public"] = 1;
  }

  // --- Origin City ---
  applyOriginTraits(c, t);

  return t;
}

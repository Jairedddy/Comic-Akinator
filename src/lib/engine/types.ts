// Canonical engine + data types. Pure TypeScript — no Node, no React, no DOM.
// Both src/lib/engine/* and scripts/lib/normalize.ts import from here.

// ============================================================================
// Data types (shape of data/characters.json, data/traits.json, data/questions.json)
// ============================================================================

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

  // Derived in M1.3 (deriveTraits). Keys are trait IDs from data/traits.json.
  // Value 1.0 = character has trait; 0.0 = doesn't; null = unknown.
  traits: Record<string, number | null>;

  traitCompleteness: number;
};

export type TraitCategory =
  | "universe"
  | "alignment"
  | "gender"
  | "species"
  | "powers"
  | "equipment"
  | "teams"
  | "era"
  | "appearance"
  | "costume"
  | "secret-identity"
  | "origin-city"
  | "adaptations"
  | "death-resurrection";

export type Trait = {
  id: string;
  category: TraitCategory;
  label: string;
  polarity: "positive";
  derivable: boolean;
};

export type TraitsFile = {
  version: number;
  categories: TraitCategory[];
  traits: Trait[];
};

export type Question = {
  id: string;
  trait: string;
  category: TraitCategory;
  text: string;
  inverse: string;
  cost: number;
};

export type QuestionsFile = {
  version: number;
  questions: Question[];
};

// ============================================================================
// Engine-only types
// ============================================================================

// The 5 answer types the player can give. Used as a discriminator into the
// likelihood table. "dont-know" is neutral (doesn't update belief).
export type Answer = "yes" | "probably" | "dont-know" | "probably-not" | "no";

// A probability distribution over character IDs. Always sums to ~1.0.
// Use Record<string, number> rather than Map<> for JSON serializability.
export type Belief = Record<string, number>;

export type HistoryEntry = {
  questionId: string;
  trait: string;
  category: TraitCategory;
  answer: Answer;
};

// Full game state. Pure data — serializable, fits in a URL hash or any
// persistent client-side store (the UI layer decides where to put it).
export type GameState = {
  characters: Character[];
  belief: Belief;
  history: HistoryEntry[];
  askedTraits: string[]; // dedupe key — same trait never asked twice
  wrongGuesses: string[]; // character IDs the engine guessed and was told "wrong"
  turn: number;
};

// What the engine wants to do next. UI dispatches on `kind`.
export type EngineDecision =
  | {
      kind: "question";
      questionId: string;
      question: Question;
    }
  | {
      kind: "guess";
      characterId: string;
      character: Character;
      confidence: number;
    }
  | {
      kind: "giveup";
      topCandidates: GuessCandidate[];
    };

export type GuessCandidate = {
  characterId: string;
  character: Character;
  belief: number;
};

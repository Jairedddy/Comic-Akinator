import type {
  Answer,
  Character,
  EngineDecision,
  GameState,
  Question,
} from "./types";
import { createUniformBelief, updateBelief } from "./posterior";
import { selectNextQuestion } from "./select";
import { shouldGiveUp, shouldGuess, topCandidates } from "./guess";

// How many recent question categories to consider when applying the
// diversity penalty. 2 = "the last two questions".
const RECENT_CATEGORIES_DEPTH = 2;

export function createInitialState(characters: Character[]): GameState {
  return {
    characters,
    belief: createUniformBelief(characters),
    history: [],
    askedTraits: [],
    wrongGuesses: [],
    turn: 0,
  };
}

// Pure decision step. Inspects state + question pool and decides whether to
// ask a question, attempt a guess, or give up. Does NOT mutate state.
export function decide(
  state: GameState,
  questions: Question[],
): EngineDecision {
  if (shouldGiveUp(state.turn, state.wrongGuesses.length)) {
    return {
      kind: "giveup",
      topCandidates: topCandidates(state.belief, state.characters, 5),
    };
  }

  const alreadyGuessed = new Set(state.wrongGuesses);
  const guess = shouldGuess(
    state.belief,
    state.turn,
    state.wrongGuesses.length,
    alreadyGuessed,
  );
  if (guess.shouldGuess && guess.targetId) {
    const character = state.characters.find((c) => c.id === guess.targetId);
    if (character) {
      return {
        kind: "guess",
        characterId: character.id,
        character,
        confidence: guess.confidence,
      };
    }
  }

  const recentCategories = state.history
    .slice(-RECENT_CATEGORIES_DEPTH)
    .map((h) => h.category);

  const next = selectNextQuestion(
    state.belief,
    questions,
    state.characters,
    state.askedTraits,
    recentCategories,
  );

  if (!next) {
    // Pool exhausted — fall back to giveup with current top candidates.
    return {
      kind: "giveup",
      topCandidates: topCandidates(state.belief, state.characters, 5),
    };
  }

  return { kind: "question", questionId: next.id, question: next };
}

// Apply a player's answer to a question. Returns a new GameState.
export function answerQuestion(
  state: GameState,
  question: Question,
  answer: Answer,
): GameState {
  return {
    ...state,
    belief: updateBelief(
      state.belief,
      question.trait,
      answer,
      state.characters,
    ),
    history: [
      ...state.history,
      {
        questionId: question.id,
        trait: question.trait,
        category: question.category,
        answer,
      },
    ],
    askedTraits: [...state.askedTraits, question.trait],
    turn: state.turn + 1,
  };
}

// Player rejects an attempted guess. Pins that character near zero in the
// belief and renormalizes. Turn count does NOT advance — a wrong guess is
// "free" since the player still has to answer more questions.
export function rejectGuess(state: GameState, characterId: string): GameState {
  const next = { ...state.belief };
  next[characterId] = 1e-6;
  let sum = 0;
  for (const p of Object.values(next)) sum += p;
  if (sum > 0) {
    for (const id of Object.keys(next)) next[id] /= sum;
  }
  return {
    ...state,
    belief: next,
    wrongGuesses: [...state.wrongGuesses, characterId],
  };
}

// Re-export the public surface so consumers can `import { ... } from "@/lib/engine"`.
export type {
  Answer,
  Belief,
  Character,
  EngineDecision,
  GameState,
  GuessCandidate,
  HistoryEntry,
  Question,
  Trait,
  TraitCategory,
  TraitsFile,
  QuestionsFile,
  Publisher,
  Alignment,
  Gender,
  Identity,
  PowerStats,
} from "./types";

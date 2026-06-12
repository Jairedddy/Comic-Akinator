// The real game state. Replaces useFakeGameState. Owns: dataset loading,
// engine state, UI status, persistence across reloads.
//
// Architecture:
// - Persisted slice (localStorage key "ca:game:v1") holds only the user's
//   progress as IDs + small primitives. The 500-character dataset is NOT
//   persisted — it gets re-fetched after rehydration via loadDataset().
// - Runtime slice (characters, questions, loadError) is rebuilt on every
//   page load and not persisted.
// - Actions reconstruct the full engine GameState by merging persisted
//   engineCore + runtime characters before calling into the pure engine.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Answer,
  Character,
  EngineDecision,
  GameState,
  GuessCandidate,
  Question,
} from "@/lib/engine/types";
import {
  answerQuestion,
  createInitialState,
  decide,
  rejectGuess,
} from "@/lib/engine";
import { loadDataset } from "@/lib/data/loadDataset";

export type UiStatus =
  | "idle"
  | "loading"
  | "asking"
  | "guessing"
  | "wrong-guess"
  | "giveup"
  | "won"
  | "lost"
  | "error";

type PersistedCore = Omit<GameState, "characters">;

type PersistedSlice = {
  status: UiStatus;
  engineCore: PersistedCore | null;
  currentQuestionId: string | null;
  pendingGuess: { characterId: string; confidence: number } | null;
  giveUpCandidateIds: { id: string; belief: number }[];
  startedAt: string | null;
};

type RuntimeSlice = {
  characters: Character[] | null;
  questions: Question[] | null;
  loadError: string | null;
  hydrated: boolean;
};

type Actions = {
  ensureLoaded: () => Promise<void>;
  startGame: () => Promise<void>;
  answer: (a: Answer) => void;
  confirmGuess: (correct: boolean) => void;
  reveal: (characterId: string) => void;
  giveUp: () => void;
  reset: () => void;
};

type Store = PersistedSlice & RuntimeSlice & Actions;

const INITIAL_PERSISTED: PersistedSlice = {
  status: "idle",
  engineCore: null,
  currentQuestionId: null,
  pendingGuess: null,
  giveUpCandidateIds: [],
  startedAt: null,
};

const INITIAL_RUNTIME: RuntimeSlice = {
  characters: null,
  questions: null,
  loadError: null,
  hydrated: false,
};

// Strip characters off a full GameState before persisting.
function toCore(state: GameState): PersistedCore {
  const { characters: _drop, ...core } = state;
  void _drop;
  return core;
}

// Reattach the runtime characters to rebuild a full GameState for engine calls.
function toFull(core: PersistedCore, characters: Character[]): GameState {
  return { ...core, characters };
}

// Translate an engine decision into the persisted UI fields.
function applyDecision(decision: EngineDecision): Partial<PersistedSlice> {
  switch (decision.kind) {
    case "question":
      return {
        status: "asking",
        currentQuestionId: decision.questionId,
        pendingGuess: null,
        giveUpCandidateIds: [],
      };
    case "guess":
      return {
        status: "guessing",
        currentQuestionId: null,
        pendingGuess: {
          characterId: decision.characterId,
          confidence: decision.confidence,
        },
        giveUpCandidateIds: [],
      };
    case "giveup":
      return {
        status: "giveup",
        currentQuestionId: null,
        pendingGuess: null,
        giveUpCandidateIds: decision.topCandidates.map(
          (c: GuessCandidate) => ({
            id: c.characterId,
            belief: c.belief,
          }),
        ),
      };
  }
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...INITIAL_PERSISTED,
      ...INITIAL_RUNTIME,

      ensureLoaded: async () => {
        const state = get();
        if (state.characters && state.questions) return;
        if (state.loadError) set({ loadError: null });
        try {
          const ds = await loadDataset();
          set({
            characters: ds.characters,
            questions: ds.questions,
            loadError: null,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed to load dataset";
          set({ loadError: msg, status: "error" });
        }
      },

      startGame: async () => {
        set({ status: "loading", loadError: null });
        await get().ensureLoaded();
        const { characters, questions, loadError } = get();
        if (loadError || !characters || !questions) return;
        const initial = createInitialState(characters);
        const decision = decide(initial, questions);
        set({
          ...INITIAL_PERSISTED,
          engineCore: toCore(initial),
          startedAt: new Date().toISOString(),
          ...applyDecision(decision),
        });
      },

      answer: (a: Answer) => {
        const {
          engineCore,
          characters,
          questions,
          currentQuestionId,
          status,
        } = get();
        if (status !== "asking") return;
        if (!engineCore || !characters || !questions) return;
        if (!currentQuestionId) return;
        const question = questions.find((q) => q.id === currentQuestionId);
        if (!question) return;
        const full = toFull(engineCore, characters);
        const next = answerQuestion(full, question, a);
        const decision = decide(next, questions);
        set({
          engineCore: toCore(next),
          ...applyDecision(decision),
        });
      },

      confirmGuess: (correct: boolean) => {
        const { engineCore, characters, questions, pendingGuess, status } = get();
        if (status !== "guessing" || !pendingGuess) return;
        if (!engineCore || !characters || !questions) return;
        if (correct) {
          // M2.6 will route to /result/[id] from here. For M2.3 we just flag
          // status='won' so the UI can render a placeholder reveal.
          set({ status: "won" });
          return;
        }
        const full = toFull(engineCore, characters);
        const rejected = rejectGuess(full, pendingGuess.characterId);
        const decision = decide(rejected, questions);
        set({
          engineCore: toCore(rejected),
          status: "wrong-guess",
          // Immediately apply the next decision so the player goes straight to
          // the next question without an intermediate screen.
          ...applyDecision(decision),
        });
      },

      reveal: (characterId: string) => {
        // M2.5 will use this when the player picks from top-5 or searches.
        const { status, pendingGuess } = get();
        if (status !== "giveup" && status !== "wrong-guess") return;
        set({
          status: "lost",
          pendingGuess: pendingGuess ?? {
            characterId,
            confidence: 0,
          },
        });
      },

      giveUp: () => {
        const { engineCore, characters, status } = get();
        if (
          status !== "asking" &&
          status !== "guessing" &&
          status !== "wrong-guess"
        )
          return;
        if (!engineCore || !characters) return;
        const full = toFull(engineCore, characters);
        // Borrow the engine's topCandidates helper indirectly via decide() —
        // forcing it returns 'giveup' since shouldGiveUp() is keyed on turn.
        // Cheaper to inline a top-5 read off the belief directly:
        const sorted = Object.entries(full.belief)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        set({
          status: "giveup",
          currentQuestionId: null,
          pendingGuess: null,
          giveUpCandidateIds: sorted.map(([id, belief]) => ({ id, belief })),
        });
      },

      reset: () => {
        set({ ...INITIAL_PERSISTED });
      },
    }),
    {
      name: "ca:game:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Persist only the user's progress. Runtime dataset + load-error flags
      // are NOT persisted — they get rebuilt by ensureLoaded() on rehydrate.
      partialize: (state): PersistedSlice => ({
        status: state.status,
        engineCore: state.engineCore,
        currentQuestionId: state.currentQuestionId,
        pendingGuess: state.pendingGuess,
        giveUpCandidateIds: state.giveUpCandidateIds,
        startedAt: state.startedAt,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration completes, mark hydrated so SSR/CSR can branch
        // safely. Also coerce transient statuses back to 'idle' — they don't
        // survive a refresh (loading was mid-fetch; wrong-guess was mid-step).
        if (!state) return;
        if (state.status === "loading" || state.status === "error") {
          state.status = "idle";
          state.loadError = null;
        }
        state.hydrated = true;
      },
    },
  ),
);

// Selectors — keep components free of derivation logic. Pass directly to
// useGameStore(selector).
export const selectCurrentQuestion = (s: Store): Question | null => {
  if (!s.currentQuestionId || !s.questions) return null;
  return s.questions.find((q) => q.id === s.currentQuestionId) ?? null;
};

export const selectPendingCharacter = (s: Store): Character | null => {
  if (!s.pendingGuess || !s.characters) return null;
  return s.characters.find((c) => c.id === s.pendingGuess!.characterId) ?? null;
};

// NOTE: derive give-up characters inside the component via useMemo over the
// raw `giveUpCandidateIds` + `characters` selectors. A selector that maps
// over an array on every call returns a new reference each time, which
// trips Zustand 5's useSyncExternalStore stability check ("getSnapshot
// should be cached to avoid an infinite loop").

export const selectThinkingAbout = (s: Store): number => {
  if (!s.engineCore) return 0;
  let n = 0;
  for (const p of Object.values(s.engineCore.belief)) {
    if (p > 0.001) n++;
  }
  return n;
};

export const selectIsInGame = (s: Store): boolean => {
  if (!s.hydrated) return false;
  if (s.status === "idle" || s.status === "error") return false;
  return (s.engineCore?.turn ?? 0) > 0 || s.status === "won" || s.status === "lost";
};

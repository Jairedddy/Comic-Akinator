// Fake game state for M2.2 — drives the question-screen UI in isolation.
// Replaced by the real Zustand store + engine wiring in M2.3.
//
// Shape mirrors what M2.3 will provide so swapping is a near drop-in.

import { useCallback, useState } from "react";
import type { Answer } from "@/lib/engine/types";

type FakeQuestion = {
  id: string;
  text: string;
  // Used by HintLine to show a believable "thinking about N" number.
  thinkingAboutAfter: number;
};

// Hand-written sample bank. Order is fixed — answer dispatch just advances index.
const SAMPLE_QUESTIONS: readonly FakeQuestion[] = [
  { id: "q-publisher-marvel", text: "Is your character from Marvel?", thinkingAboutAfter: 248 },
  { id: "q-can-fly", text: "Can your character fly?", thinkingAboutAfter: 87 },
  { id: "q-has-cape", text: "Does your character wear a cape?", thinkingAboutAfter: 34 },
  { id: "q-team-avengers", text: "Are they part of the Avengers?", thinkingAboutAfter: 12 },
  { id: "q-secret-identity", text: "Do they have a secret identity?", thinkingAboutAfter: 5 },
] as const;

const INITIAL_THINKING_ABOUT = 487;
const HARD_CAP = 25;

export type FakeGameState = {
  question: FakeQuestion | null;
  answers: readonly Answer[];
  turn: number;
  thinkingAbout: number;
  isFinished: boolean;
  answer: (a: Answer) => void;
  reset: () => void;
};

export function useFakeGameState(): FakeGameState {
  const [answers, setAnswers] = useState<readonly Answer[]>([]);

  const answer = useCallback((a: Answer) => {
    setAnswers((prev) => {
      if (prev.length >= HARD_CAP) return prev;
      return [...prev, a];
    });
  }, []);

  const reset = useCallback(() => setAnswers([]), []);

  const turn = answers.length;
  const question =
    turn < SAMPLE_QUESTIONS.length ? SAMPLE_QUESTIONS[turn] : null;
  const thinkingAbout =
    turn === 0
      ? INITIAL_THINKING_ABOUT
      : (SAMPLE_QUESTIONS[turn - 1]?.thinkingAboutAfter ?? 1);

  return {
    question,
    answers,
    turn,
    thinkingAbout,
    isFinished: question === null,
    answer,
    reset,
  };
}

export const FAKE_HARD_CAP = HARD_CAP;

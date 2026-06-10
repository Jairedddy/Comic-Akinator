"use client";

import { useEffect } from "react";
import { QuestionCard } from "./QuestionCard";
import { AnswerButtonRow } from "./AnswerButtonRow";
import { ProgressDots } from "./ProgressDots";
import { HintLine } from "./HintLine";
import { SHORTCUT_TO_ANSWER } from "./answers";
import { useFakeGameState, FAKE_HARD_CAP } from "./useFakeGameState";

export function PlayScreen() {
  const game = useFakeGameState();

  useEffect(() => {
    if (game.isFinished) return;
    function handleKey(e: KeyboardEvent) {
      // Don't hijack keys when the user is typing in a form control.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const answer = SHORTCUT_TO_ANSWER[e.key];
      if (!answer) return;
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.log("[play] keyboard dispatch", answer);
      game.answer(answer);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [game]);

  if (game.isFinished) {
    return (
      <div className="flex flex-col gap-6">
        <section className="border-border-strong bg-bg-detail border-[3px] p-8 text-center">
          <p className="font-display text-accent text-4xl tracking-[2px]">
            END OF FAKE BANK
          </p>
          <p className="text-ink-dim mt-3 text-sm">
            M2.2 ships a fixed 5-question demo. M2.3 wires the real engine and
            keeps going until a guess.
          </p>
          <button
            type="button"
            onClick={game.reset}
            className="border-accent text-accent hover:bg-accent hover:text-bg font-display mt-6 inline-block border-2 px-5 py-2 tracking-[2px] transition-colors"
          >
            Restart Demo
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-7">
      <ProgressDots total={FAKE_HARD_CAP} answers={game.answers} />
      <QuestionCard
        questionId={game.question!.id}
        text={game.question!.text}
      />
      <HintLine count={game.thinkingAbout} />
      <AnswerButtonRow onAnswer={game.answer} />
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard } from "./QuestionCard";
import { AnswerButtonRow } from "./AnswerButtonRow";
import { ProgressDots } from "./ProgressDots";
import { HintLine } from "./HintLine";
import { GuessReveal } from "./GuessReveal";
import { SHORTCUT_TO_ANSWER } from "./answers";
import {
  useGameStore,
  selectCurrentQuestion,
  selectPendingCharacter,
  selectThinkingAbout,
} from "@/state/gameStore";
import type { Answer, HistoryEntry } from "@/lib/engine/types";

const HARD_CAP = 25;
// Stable empty reference — selectors and useMemo branches return this instead
// of constructing fresh `[]` on every render. Without this the
// useSyncExternalStore inside Zustand 5 thinks state changed every tick and
// spins into the "getSnapshot should be cached" infinite-loop warning.
const EMPTY_ANSWERS: readonly Answer[] = [];

export function PlayScreen() {
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const status = useGameStore((s) => s.status);
  const loadError = useGameStore((s) => s.loadError);
  const turn = useGameStore((s) => s.engineCore?.turn ?? 0);
  const gameId = useGameStore((s) => s.gameId);
  // Pull the raw history ref (or undefined). Derivation happens in useMemo
  // below so we never return a new array from a selector.
  const historyRef = useGameStore(
    (s) => s.engineCore?.history as readonly HistoryEntry[] | undefined,
  );
  const ensureLoaded = useGameStore((s) => s.ensureLoaded);
  const startGame = useGameStore((s) => s.startGame);
  const answer = useGameStore((s) => s.answer);
  const confirmGuess = useGameStore((s) => s.confirmGuess);
  const reset = useGameStore((s) => s.reset);

  const currentQuestion = useGameStore(selectCurrentQuestion);
  const pendingCharacter = useGameStore(selectPendingCharacter);
  const thinkingAbout = useGameStore(selectThinkingAbout);

  // Derive the answer-typed dot colors from history. Memoized on history ref
  // so identity is stable across unrelated renders.
  const answers = useMemo<readonly Answer[]>(() => {
    if (!historyRef || historyRef.length === 0) return EMPTY_ANSWERS;
    return historyRef.map((h) => h.answer);
  }, [historyRef]);

  // On mount, either start a fresh game (no prior state) or just rehydrate the
  // runtime dataset for the existing one.
  useEffect(() => {
    if (!hydrated) return;
    if (status === "idle") {
      void startGame();
    } else {
      void ensureLoaded();
    }
    // We only want this on first mount per session; subsequent state changes
    // shouldn't re-trigger startGame. Reading from the store inside the effect
    // also keeps us from re-running on every status update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Navigation on terminal states. The engine flips status to "won" / "giveup"
  // and this effect routes accordingly. M2.5 will replace the /give-up stub
  // with the real top-5 picker; M2.6 lands the /result page.
  useEffect(() => {
    if (status === "won" && gameId) {
      router.replace(`/result/${gameId}`);
    } else if (status === "giveup") {
      router.replace("/give-up");
    }
  }, [status, gameId, router]);

  // Keyboard answer dispatch — only active in the asking phase.
  useEffect(() => {
    if (status !== "asking") return;
    function handleKey(e: KeyboardEvent) {
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
      const a = SHORTCUT_TO_ANSWER[e.key];
      if (!a) return;
      e.preventDefault();
      answer(a);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, answer]);

  // Pre-hydration / SSR — render nothing structural so we don't flash a
  // mismatched UI. The shell footer is still visible.
  if (!hydrated) {
    return <Panel kicker="Round 1" title="LOADING…" />;
  }

  if (status === "error") {
    return (
      <Panel kicker="Off Panel" title="DATASET FAILED">
        <p>{loadError ?? "Couldn’t load the character dataset."}</p>
        <button
          type="button"
          onClick={() => void startGame()}
          className="border-accent text-accent hover:bg-accent hover:text-bg font-display mt-4 inline-block border-2 px-5 py-2 tracking-[2px] transition-colors"
        >
          Retry
        </button>
      </Panel>
    );
  }

  if (status === "guessing" && pendingCharacter) {
    return (
      <>
        <Panel kicker="POW!" title="I’VE GOT A HUNCH…">
          <p className="text-ink-dim">
            Locking in my guess after {turn} question{turn === 1 ? "" : "s"}.
          </p>
        </Panel>
        <GuessReveal
          key={pendingCharacter.id}
          character={pendingCharacter}
          turn={turn}
          onYes={() => confirmGuess(true)}
          onNo={() => confirmGuess(false)}
        />
      </>
    );
  }

  // Won and giveup are routed away by the navigation effect above; render a
  // brief transitional panel so the screen isn't blank during router.replace.
  if (status === "won" || status === "giveup") {
    return <Panel kicker="Reveal" title="REVEALING…" />;
  }

  if (status === "lost") {
    return (
      <Panel kicker="You Win" title="GOOD ONE">
        <p className="text-ink-dim mb-4">
          You stumped me. Full reveal lands in M2.5/M2.6.
        </p>
        <button
          type="button"
          onClick={() => {
            reset();
            void startGame();
          }}
          className="border-accent text-accent hover:bg-accent hover:text-bg font-display inline-block border-2 px-5 py-2 tracking-[2px] transition-colors"
        >
          Play Again
        </button>
      </Panel>
    );
  }

  // Catch-all for idle / loading / wrong-guess / asking-without-question-yet.
  // Must come BEFORE the final asking render to avoid a null deref on
  // currentQuestion. The startGame effect above will transition us into a
  // proper "asking" state with a question on the next tick.
  if (status !== "asking" || !currentQuestion) {
    return (
      <Panel kicker="Round 1" title="THINKING…">
        Loading the character dossier.
      </Panel>
    );
  }

  // status === "asking" AND currentQuestion is a real Question.
  return (
    <div className="flex flex-col gap-5 sm:gap-7">
      <ProgressDots total={HARD_CAP} answers={answers} />
      <QuestionCard
        questionId={currentQuestion.id}
        text={currentQuestion.text}
      />
      <HintLine count={thinkingAbout} />
      <AnswerButtonRow onAnswer={answer} />
    </div>
  );
}

function Panel({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-border-strong bg-bg-detail relative -rotate-[0.3deg] border-[3px] p-6 shadow-[6px_6px_0_var(--color-bg-card)] sm:p-10">
      <span
        aria-hidden
        className="border-accent/35 pointer-events-none absolute inset-1.5 border border-dashed"
      />
      {kicker && (
        <span className="bg-villain font-display inline-block -rotate-2 px-3 py-1 text-sm tracking-[0.2em] text-white shadow-[3px_3px_0_var(--color-bg-card)]">
          {kicker}
        </span>
      )}
      <h1 className="text-accent font-display mt-3 text-3xl leading-none tracking-[2px] [text-shadow:3px_3px_0_var(--color-villain),6px_6px_0_var(--color-bg-card)] sm:text-5xl">
        {title}
      </h1>
      {children && <div className="text-ink mt-4 max-w-2xl text-sm">{children}</div>}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/state/gameStore";
import { CharacterSearchModal } from "./CharacterSearchModal";
import { appendMiss, type MissAsked } from "@/lib/misses";
import type { Character, HistoryEntry } from "@/lib/engine/types";

const EMPTY_CHARS: readonly Character[] = [];
const EMPTY_HISTORY: readonly HistoryEntry[] = [];

export function GiveUpScreen() {
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const status = useGameStore((s) => s.status);
  const turn = useGameStore((s) => s.engineCore?.turn ?? 0);
  const wrongGuessCount = useGameStore(
    (s) => s.engineCore?.wrongGuesses.length ?? 0,
  );
  const candidateIds = useGameStore((s) => s.giveUpCandidateIds);
  const characters = useGameStore((s) => s.characters);
  const historyRef = useGameStore(
    (s) => s.engineCore?.history as readonly HistoryEntry[] | undefined,
  );
  const gameId = useGameStore((s) => s.gameId);
  const ensureLoaded = useGameStore((s) => s.ensureLoaded);
  const startGame = useGameStore((s) => s.startGame);
  const reveal = useGameStore((s) => s.reveal);

  const [searchOpen, setSearchOpen] = useState(false);
  // Bumped each time the search modal opens so CharacterSearchModal remounts
  // with a fresh query state (avoids a setState-in-effect inside the modal).
  const [searchOpenCount, setSearchOpenCount] = useState(0);
  const someoneElseBtnRef = useRef<HTMLButtonElement>(null);

  const candidates = useMemo<readonly Character[]>(() => {
    if (!characters || candidateIds.length === 0) return EMPTY_CHARS;
    const out: Character[] = [];
    for (const c of candidateIds) {
      const ch = characters.find((x) => x.id === c.id);
      if (ch) out.push(ch);
    }
    return out;
  }, [characters, candidateIds]);

  useEffect(() => {
    if (!hydrated) return;
    if (!characters) void ensureLoaded();
  }, [hydrated, characters, ensureLoaded]);

  // Anyone landing here without a giveup state shouldn't be here. Bounce them
  // back to /play so a fresh game starts.
  useEffect(() => {
    if (!hydrated) return;
    if (status === "lost") {
      // reveal() ran below; let the navigation effect there route us.
      return;
    }
    if (status !== "giveup") {
      router.replace("/play");
    }
  }, [hydrated, status, router]);

  function handleReveal(characterId: string) {
    // Snapshot the asked/answer pair BEFORE reveal() so the miss log reflects
    // the give-up moment, not the lost-state aftermath.
    const history = historyRef ?? EMPTY_HISTORY;
    const richHistory: MissAsked[] = history.map((h) => ({
      questionId: h.questionId,
      trait: h.trait,
      category: h.category,
      answer: h.answer,
    }));
    if (gameId) {
      appendMiss({
        gameId,
        characterId,
        asked: history.map((h) => h.questionId),
        answers: history.map((h) => h.answer),
        history: richHistory,
        at: new Date().toISOString(),
      });
    }
    reveal(characterId);
    setSearchOpen(false);
    // The result page reads status + pendingGuess from the store; navigate
    // once reveal has set status to "lost".
    if (gameId) router.replace(`/result/${gameId}`);
  }

  if (!hydrated || (status !== "giveup" && status !== "lost")) {
    return <Panel kicker="…" title="LOADING…" />;
  }

  const reason =
    wrongGuessCount >= 3
      ? "Three wrong guesses. You win this round."
      : `Hit the ${turn}-question cap. You stumped me.`;

  return (
    <section className="border-border-strong bg-bg-detail relative -rotate-[0.3deg] border-[3px] p-6 shadow-[6px_6px_0_var(--color-bg-card)] sm:p-10">
      <span
        aria-hidden
        className="border-accent/35 pointer-events-none absolute inset-1.5 border border-dashed"
      />
      <span className="bg-villain font-display inline-block -rotate-2 px-3 py-1 text-sm tracking-[0.2em] text-white shadow-[3px_3px_0_var(--color-bg-card)]">
        I GIVE UP
      </span>
      <h1 className="text-accent font-display mt-3 text-3xl leading-none tracking-[2px] [text-shadow:3px_3px_0_var(--color-villain),6px_6px_0_var(--color-bg-card)] sm:text-5xl">
        GOT ME
      </h1>
      <p className="text-ink-dim mt-4 text-sm">{reason}</p>

      <p className="text-ink-dimmer mt-6 text-xs tracking-[0.2em] uppercase">
        My closest hunches — pick the one you had in mind:
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {candidates.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => handleReveal(c.id)}
              aria-label={`Reveal: it was ${c.name}`}
              className={[
                "group border-border-soft bg-bg-card hover:border-accent",
                "flex w-full flex-col overflow-hidden border-2 text-left transition-colors",
                "focus-visible:ring-accent focus-visible:ring-offset-bg-detail",
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              ].join(" ")}
            >
              <div className="bg-bg relative aspect-[5/6] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/silhouette.svg";
                  }}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-2.5 py-2">
                <div className="font-display text-ink text-sm leading-tight">
                  {c.name}
                </div>
                <div className="text-ink-dimmer mt-0.5 text-[10px] uppercase tracking-wider">
                  {c.publisher}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          ref={someoneElseBtnRef}
          type="button"
          onClick={() => {
            setSearchOpenCount((n) => n + 1);
            setSearchOpen(true);
          }}
          className={[
            "border-accent text-accent hover:bg-accent hover:text-bg",
            "font-display border-2 px-5 py-2 tracking-[2px] transition-colors",
            "focus-visible:ring-accent focus-visible:ring-offset-bg-detail",
            "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          ].join(" ")}
        >
          SOMEONE ELSE
        </button>
        <button
          type="button"
          onClick={() => {
            void startGame().then(() => router.replace("/play"));
          }}
          className={[
            "border-border-soft text-ink-dim hover:text-ink hover:border-accent",
            "font-display border-2 px-5 py-2 tracking-[2px] transition-colors",
            "focus-visible:ring-accent focus-visible:ring-offset-bg-detail",
            "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          ].join(" ")}
        >
          PLAY AGAIN
        </button>
      </div>

      <CharacterSearchModal
        key={searchOpenCount}
        open={searchOpen}
        characters={characters ?? EMPTY_CHARS}
        onPick={handleReveal}
        onClose={() => {
          setSearchOpen(false);
          // Return focus to the trigger as the spec requires.
          requestAnimationFrame(() => someoneElseBtnRef.current?.focus());
        }}
      />
    </section>
  );
}

function Panel({ kicker, title }: { kicker?: string; title: string }) {
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
    </section>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/state/gameStore";
import type { Character } from "@/lib/engine/types";

const EMPTY_CHARS: readonly Character[] = [];

// M2.4 stub: shows "Got me", lists the engine's top-5 suspects, and offers a
// Play Again button. M2.5 turns the list into a selectable picker + search and
// wires the reveal action through the store's reveal() call.
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
  const ensureLoaded = useGameStore((s) => s.ensureLoaded);
  const startGame = useGameStore((s) => s.startGame);

  const candidates = useMemo<readonly Character[]>(() => {
    if (!characters || candidateIds.length === 0) return EMPTY_CHARS;
    const out: Character[] = [];
    for (const c of candidateIds) {
      const ch = characters.find((x) => x.id === c.id);
      if (ch) out.push(ch);
    }
    return out;
  }, [characters, candidateIds]);

  // Re-hydrate the dataset if the user opened /give-up directly after a reload.
  useEffect(() => {
    if (!hydrated) return;
    if (!characters) void ensureLoaded();
  }, [hydrated, characters, ensureLoaded]);

  // Anyone landing here without a giveup state shouldn't be here. Bounce them
  // back to /play so a fresh game starts.
  useEffect(() => {
    if (!hydrated) return;
    if (status !== "giveup" && status !== "lost") {
      router.replace("/play");
    }
  }, [hydrated, status, router]);

  if (!hydrated || status !== "giveup") {
    return (
      <Panel kicker="…" title="LOADING…" />
    );
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

      {candidates.length > 0 && (
        <>
          <p className="text-ink-dimmer mt-6 text-xs tracking-[0.2em] uppercase">
            My top suspects (M2.5 turns this into a picker):
          </p>
          <ul className="mt-2 grid gap-2">
            {candidates.map((c) => (
              <li
                key={c.id}
                className="border-border-soft bg-bg-card flex items-center gap-3 border p-2"
              >
                <span className="font-display text-ink text-lg">{c.name}</span>
                <span className="text-ink-dimmer text-xs">{c.publisher}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <button
        type="button"
        onClick={() => {
          void startGame().then(() => router.replace("/play"));
        }}
        className="border-accent text-accent hover:bg-accent hover:text-bg font-display mt-6 inline-block border-2 px-5 py-2 tracking-[2px] transition-colors"
      >
        PLAY AGAIN
      </button>
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

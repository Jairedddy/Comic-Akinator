"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore, selectPendingCharacter } from "@/state/gameStore";
import { PlaceholderHero } from "@/components/layout/PlaceholderHero";

type Props = { id: string };

// M2.5 stub of the result screen: distinguishes won vs lost (give-up) copy and
// gracefully bounces stale URLs. Full bio + share button land in M2.6.
export function ResultScreen({ id }: Props) {
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const status = useGameStore((s) => s.status);
  const gameId = useGameStore((s) => s.gameId);
  const turn = useGameStore((s) => s.engineCore?.turn ?? 0);
  const character = useGameStore(selectPendingCharacter);
  const startGame = useGameStore((s) => s.startGame);
  const ensureLoaded = useGameStore((s) => s.ensureLoaded);

  useEffect(() => {
    if (!hydrated) return;
    void ensureLoaded();
  }, [hydrated, ensureLoaded]);

  if (!hydrated) {
    return <PlaceholderHero kicker="Reveal" title="LOADING…" />;
  }

  // The URL identifies the game. If the store has moved on (new game started
  // in another tab, or this URL is just stale), show a graceful "expired"
  // state instead of pretending the game data is valid.
  const matchesActive = gameId === id;
  const terminal = status === "won" || status === "lost";

  if (!matchesActive || !terminal || !character) {
    return (
      <PlaceholderHero kicker="Game Over" title="THIS GAME EXPIRED">
        <p>
          The session for <code className="font-mono text-ink">{id}</code> isn’t
          loaded in this browser. Start a new round?
        </p>
        <button
          type="button"
          onClick={() => {
            void startGame().then(() => router.replace("/play"));
          }}
          className="border-accent text-accent hover:bg-accent hover:text-bg font-display mt-5 inline-block border-2 px-5 py-2 tracking-[2px] transition-colors"
        >
          PLAY AGAIN
        </button>
      </PlaceholderHero>
    );
  }

  const won = status === "won";
  const kicker = won ? "POW!" : "GOT ME";
  const title = won ? "I GOT YOU." : `IT WAS ${character.name.toUpperCase()}.`;
  const subtitle = won
    ? `${character.name} in ${turn} question${turn === 1 ? "" : "s"}.`
    : `You stumped me in ${turn} question${turn === 1 ? "" : "s"}.`;

  return (
    <section className="border-border-strong bg-bg-detail relative -rotate-[0.3deg] border-[3px] p-6 shadow-[6px_6px_0_var(--color-bg-card)] sm:p-10">
      <span
        aria-hidden
        className="border-accent/35 pointer-events-none absolute inset-1.5 border border-dashed"
      />
      <span className="bg-villain font-display inline-block -rotate-2 px-3 py-1 text-sm tracking-[0.2em] text-white shadow-[3px_3px_0_var(--color-bg-card)]">
        {kicker}
      </span>
      <h1 className="text-accent font-display mt-3 text-3xl leading-none tracking-[2px] [text-shadow:3px_3px_0_var(--color-villain),6px_6px_0_var(--color-bg-card)] sm:text-5xl">
        {title}
      </h1>

      <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr] sm:gap-8">
        <div className="border-border-soft bg-bg relative aspect-[5/6] overflow-hidden border-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={character.image}
            alt={character.name}
            onError={(e) => {
              e.currentTarget.src = "/silhouette.svg";
            }}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="text-ink text-sm">
          <p className="text-ink-dim">{subtitle}</p>
          <p className="text-ink-dimmer mt-3 text-xs">
            Full bio, stats, and share button land in M2.6.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void startGame().then(() => router.replace("/play"));
          }}
          className="border-accent text-accent hover:bg-accent hover:text-bg font-display border-2 px-5 py-2 tracking-[2px] transition-colors"
        >
          PLAY AGAIN
        </button>
        <button
          type="button"
          disabled
          className="border-border-soft text-ink-dimmer font-display cursor-not-allowed border-2 px-5 py-2 tracking-[2px]"
        >
          SHARE (M3.1)
        </button>
      </div>
    </section>
  );
}

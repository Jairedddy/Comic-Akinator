"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useGameStore, selectIsInGame } from "@/state/gameStore";

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relativeTimeFrom(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.round((then - Date.now()) / 1000);
  const absSec = Math.abs(seconds);
  if (absSec < 60) return RTF.format(Math.round(seconds), "second");
  if (absSec < 3600) return RTF.format(Math.round(seconds / 60), "minute");
  if (absSec < 86_400) return RTF.format(Math.round(seconds / 3600), "hour");
  return RTF.format(Math.round(seconds / 86_400), "day");
}

export function ResumeBanner() {
  const router = useRouter();
  const isInGame = useGameStore(selectIsInGame);
  const turn = useGameStore((s) => s.engineCore?.turn ?? 0);
  const startedAt = useGameStore((s) => s.startedAt);
  const reset = useGameStore((s) => s.reset);
  const ensureLoaded = useGameStore((s) => s.ensureLoaded);

  // Pre-warm the dataset fetch as soon as the banner is shown so the Resume
  // click feels instant. Safe to call even when no game is in progress.
  useEffect(() => {
    if (isInGame) void ensureLoaded();
  }, [isInGame, ensureLoaded]);

  if (!isInGame) return null;

  return (
    <section
      role="status"
      aria-label="Game in progress"
      className="border-accent bg-bg-card relative -rotate-[0.4deg] border-[3px] p-5 shadow-[6px_6px_0_var(--color-bg-detail)]"
    >
      <span
        aria-hidden
        className="border-accent/40 pointer-events-none absolute inset-1.5 border border-dashed"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-accent text-2xl tracking-[2px]">
            GAME IN PROGRESS
          </p>
          <p className="text-ink-dim mt-1 text-sm">
            On turn <span className="text-ink font-semibold">{turn}</span>
            {startedAt && (
              <>
                {" "}
                &middot; started{" "}
                <span className="text-ink">{relativeTimeFrom(startedAt)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/play"
            className="bg-accent text-bg hover:bg-victory font-display inline-flex items-center px-5 py-2 text-xl tracking-[2px] shadow-[3px_3px_0_var(--color-bg-detail)] transition-colors"
          >
            RESUME
          </Link>
          <button
            type="button"
            onClick={() => {
              reset();
              router.push("/play");
            }}
            className="text-ink-dim hover:text-villain text-sm font-medium tracking-wide uppercase underline-offset-2 hover:underline"
          >
            Start over
          </button>
        </div>
      </div>
    </section>
  );
}

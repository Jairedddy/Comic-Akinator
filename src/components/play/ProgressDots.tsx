"use client";

import { ANSWER_OPTIONS } from "./answers";
import type { Answer } from "@/lib/engine/types";

const RING_BY_ANSWER: Record<Answer, string> = ANSWER_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.value] = opt.ringClass;
    return acc;
  },
  {} as Record<Answer, string>,
);

export function ProgressDots({
  total,
  answers,
}: {
  total: number;
  answers: readonly Answer[];
}) {
  const currentTurn = answers.length;

  return (
    <ol
      aria-label={`Question ${Math.min(currentTurn + 1, total)} of ${total}`}
      className="flex flex-wrap items-center gap-1.5"
    >
      {Array.from({ length: total }).map((_, i) => {
        const past = i < currentTurn;
        const current = i === currentTurn;
        const ring = past ? RING_BY_ANSWER[answers[i]!] : "";
        return (
          <li
            key={i}
            aria-hidden={!past && !current}
            className={[
              "h-2.5 w-2.5 rounded-full transition-colors",
              past
                ? ring
                : current
                  ? "ring-accent ring-offset-bg bg-bg-card-2 ring-2 ring-offset-1"
                  : "bg-border-soft",
            ].join(" ")}
          />
        );
      })}
    </ol>
  );
}

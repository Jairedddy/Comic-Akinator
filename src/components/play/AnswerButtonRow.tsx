"use client";

import { ANSWER_OPTIONS } from "./answers";
import type { Answer } from "@/lib/engine/types";

export function AnswerButtonRow({
  onAnswer,
  disabled = false,
}: {
  onAnswer: (a: Answer) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Answer choices"
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-5 sm:gap-3"
    >
      {ANSWER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onAnswer(opt.value)}
          disabled={disabled}
          aria-label={`${opt.label} — press ${opt.shortcut}`}
          aria-keyshortcuts={opt.shortcut}
          className={[
            "group bg-bg-card relative flex items-center justify-between gap-3",
            "border-2 px-4 py-3 transition-colors duration-150",
            "focus-visible:ring-accent focus-visible:ring-offset-bg",
            "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-40",
            "sm:flex-col sm:items-stretch sm:justify-center sm:gap-2 sm:px-3 sm:py-4 sm:text-center",
            opt.toneClass,
          ].join(" ")}
        >
          <span
            aria-hidden
            className={[
              "font-display flex h-7 w-7 flex-shrink-0 items-center justify-center text-lg leading-none sm:mx-auto",
              opt.chipClass,
            ].join(" ")}
          >
            {opt.shortcut}
          </span>
          <span className="font-display text-xl tracking-[1.5px] sm:text-2xl">
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

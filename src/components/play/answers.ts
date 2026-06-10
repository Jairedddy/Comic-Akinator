// Canonical answer options for the question screen.
// Order matters — index + 1 is the keyboard shortcut (1–5).
// Real engine uses the same Answer type from "@/lib/engine/types".

import type { Answer } from "@/lib/engine/types";

export type AnswerOption = {
  value: Answer;
  label: string;
  shortcut: "1" | "2" | "3" | "4" | "5";
  // Tailwind color tokens for the per-answer accent.
  // Used by AnswerButtonRow (border/chip) and ProgressDots (past-answer color).
  toneClass: string;
  ringClass: string;
  chipClass: string;
};

export const ANSWER_OPTIONS: readonly AnswerOption[] = [
  {
    value: "yes",
    label: "Yes",
    shortcut: "1",
    toneClass: "border-victory text-victory hover:bg-victory/15",
    ringClass: "bg-victory",
    chipClass: "bg-victory text-bg",
  },
  {
    value: "probably",
    label: "Probably",
    shortcut: "2",
    toneClass: "border-accent text-accent hover:bg-accent/15",
    ringClass: "bg-accent",
    chipClass: "bg-accent text-bg",
  },
  {
    value: "dont-know",
    label: "Don’t know",
    shortcut: "3",
    toneClass: "border-ink-dim text-ink-dim hover:bg-ink-dim/10",
    ringClass: "bg-ink-dimmer",
    chipClass: "bg-ink-dim text-bg",
  },
  {
    value: "probably-not",
    label: "Probably not",
    shortcut: "4",
    toneClass: "border-hero text-hero hover:bg-hero/15",
    ringClass: "bg-hero",
    chipClass: "bg-hero text-bg",
  },
  {
    value: "no",
    label: "No",
    shortcut: "5",
    toneClass: "border-villain text-villain hover:bg-villain/15",
    ringClass: "bg-villain",
    chipClass: "bg-villain text-white",
  },
] as const;

// Reverse lookup for the keyboard handler in PlayScreen.
export const SHORTCUT_TO_ANSWER: Record<string, Answer> = ANSWER_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.shortcut] = opt.value;
    return acc;
  },
  {} as Record<string, Answer>,
);

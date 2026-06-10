"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function QuestionCard({
  questionId,
  text,
}: {
  questionId: string;
  text: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Current question"
      className="border-border-strong bg-bg-detail relative -rotate-[0.3deg] border-[3px] p-6 shadow-[6px_6px_0_var(--color-bg-card)] sm:p-10"
    >
      <span
        aria-hidden
        className="border-accent/35 pointer-events-none absolute inset-1.5 border border-dashed"
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.h1
          key={questionId}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="text-ink font-display text-3xl leading-tight tracking-[2px] [text-shadow:2px_2px_0_var(--color-villain),4px_4px_0_var(--color-bg-card)] sm:text-5xl"
        >
          {text}
        </motion.h1>
      </AnimatePresence>
    </section>
  );
}

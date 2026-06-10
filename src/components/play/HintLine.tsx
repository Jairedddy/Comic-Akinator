"use client";

export function HintLine({ count }: { count: number }) {
  return (
    <p
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="text-ink-dimmer font-mono text-xs tracking-wide uppercase sm:text-sm"
    >
      I’m thinking about{" "}
      <span className="text-accent font-semibold">{count.toLocaleString()}</span>{" "}
      character{count === 1 ? "" : "s"}
    </p>
  );
}

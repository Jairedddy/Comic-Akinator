import type { ReactNode } from "react";

export function PlaceholderHero({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-border-strong bg-bg-detail relative -rotate-[0.3deg] border-[3px] p-8 shadow-[6px_6px_0_var(--color-bg-card)] sm:p-12">
      <span
        aria-hidden
        className="border-accent/35 pointer-events-none absolute inset-1.5 border border-dashed"
      />
      {kicker && (
        <span className="bg-villain font-display inline-block -rotate-2 px-3 py-1 text-sm tracking-[0.2em] text-white shadow-[3px_3px_0_var(--color-bg-card)]">
          {kicker}
        </span>
      )}
      <h1 className="text-accent font-display mt-3 text-5xl leading-none tracking-[2px] [text-shadow:3px_3px_0_var(--color-villain),6px_6px_0_var(--color-bg-card)] sm:text-7xl">
        {title}
      </h1>
      {children && <div className="text-ink-dim mt-4 max-w-2xl text-base">{children}</div>}
    </section>
  );
}

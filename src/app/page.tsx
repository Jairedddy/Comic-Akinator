import Link from "next/link";
import { PlaceholderHero } from "@/components/layout/PlaceholderHero";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <PlaceholderHero kicker="20 Questions" title="THINK OF A HERO. OR A VILLAIN.">
        Marvel or DC. Comics, movies, shows, games — anything counts. I&apos;ll guess
        who you&apos;re thinking of in 20 questions or fewer.
      </PlaceholderHero>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/play"
          className="bg-accent text-bg hover:bg-victory font-display inline-flex items-center gap-2 px-6 py-3 text-2xl tracking-widest shadow-[4px_4px_0_var(--color-bg-card)] transition-colors"
        >
          START GAME
        </Link>
        <Link
          href="/about"
          className="text-ink-dim hover:text-accent text-sm font-medium tracking-wide uppercase"
        >
          How it works
        </Link>
      </div>
    </div>
  );
}

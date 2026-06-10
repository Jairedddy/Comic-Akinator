import Link from "next/link";
import { PlaceholderHero } from "@/components/layout/PlaceholderHero";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-8">
      <PlaceholderHero kicker="404" title="OFF-PANEL!">
        That page slipped between the gutters. Nothing here at this URL.
      </PlaceholderHero>
      <div>
        <Link
          href="/"
          className="bg-accent text-bg hover:bg-victory font-display inline-flex items-center gap-2 px-6 py-3 text-2xl tracking-widest shadow-[4px_4px_0_var(--color-bg-card)] transition-colors"
        >
          BACK TO HQ
        </Link>
      </div>
    </div>
  );
}

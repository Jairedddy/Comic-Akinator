import Link from "next/link";
import type { ReactNode } from "react";

const NAV_LINKS = [
  { href: "/play", label: "Play" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-border-soft border-b bg-bg-card/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Comic Akinator home">
          <span
            aria-hidden
            className="bg-accent text-bg flex h-9 w-9 -rotate-3 items-center justify-center font-display text-2xl shadow-[3px_3px_0_var(--color-bg)] transition-transform group-hover:rotate-0"
          >
            CA
          </span>
          <span className="font-display text-2xl tracking-widest text-ink sm:text-3xl">
            COMIC AKINATOR
          </span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-ink-dim hover:text-accent rounded px-3 py-2 text-sm font-medium tracking-wide uppercase transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-border-soft text-ink-dimmer border-t text-xs">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          Fan project. Marvel &amp; DC characters and likenesses are property of their
          respective owners. Not affiliated with either publisher.
        </p>
        <Link href="/privacy" className="hover:text-accent underline-offset-2 hover:underline">
          Privacy
        </Link>
      </div>
    </footer>
  );
}

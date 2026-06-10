import type { Metadata } from "next";
import { PlaceholderHero } from "@/components/layout/PlaceholderHero";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PlaceholderHero kicker="Origin Story" title="WHAT IS THIS?">
      Comic Akinator is a guessing game over Marvel + DC characters across every medium —
      comics, films, shows, games. Pick a character in your head, answer yes/no questions,
      see if the engine can pin them down.
    </PlaceholderHero>
  );
}

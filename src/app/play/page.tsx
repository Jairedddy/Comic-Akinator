import type { Metadata } from "next";
import { PlaceholderHero } from "@/components/layout/PlaceholderHero";

export const metadata: Metadata = { title: "Play" };

export default function PlayPage() {
  return (
    <PlaceholderHero kicker="Round 1" title="THE GAME GOES HERE">
      The question card, answer buttons, and progress dots land here in M2.2.
    </PlaceholderHero>
  );
}

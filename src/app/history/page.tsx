import type { Metadata } from "next";
import { PlaceholderHero } from "@/components/layout/PlaceholderHero";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <PlaceholderHero kicker="The Archive" title="PAST GAMES">
      Your past games (stored locally on this device) will list here.
    </PlaceholderHero>
  );
}

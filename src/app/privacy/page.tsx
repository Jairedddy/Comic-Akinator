import type { Metadata } from "next";
import { PlaceholderHero } from "@/components/layout/PlaceholderHero";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PlaceholderHero kicker="Fine Print" title="PRIVACY">
      Game state and history live in your browser&apos;s localStorage. Nothing about
      what you played is sent anywhere. No accounts, no tracking.
    </PlaceholderHero>
  );
}

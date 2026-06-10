import type { Metadata } from "next";
import { PlaceholderHero } from "@/components/layout/PlaceholderHero";

export const metadata: Metadata = { title: "Result" };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PlaceholderHero kicker="Reveal" title="GOT 'EM.">
      Result for game <code className="font-mono text-ink">{id}</code> shows up here in M2.6.
    </PlaceholderHero>
  );
}

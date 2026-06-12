import type { Metadata } from "next";
import { ResultScreen } from "@/components/result/ResultScreen";

export const metadata: Metadata = { title: "Result" };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResultScreen id={id} />;
}

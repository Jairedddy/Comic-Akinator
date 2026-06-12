import type { Metadata } from "next";
import { GiveUpScreen } from "@/components/play/GiveUpScreen";

export const metadata: Metadata = { title: "I Give Up" };

// M2.4 stub: route target for hard-cap and 3-miss exits. M2.5 fleshes this out
// into the real top-5 picker + search reveal flow.
export default function GiveUpPage() {
  return <GiveUpScreen />;
}

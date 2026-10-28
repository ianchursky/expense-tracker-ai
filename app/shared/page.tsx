import type { Metadata } from "next";
import { SharedSnapshotView } from "@/components/cloud/SharedSnapshotView";

export const metadata: Metadata = {
  title: "Shared report",
  // Snapshot links carry personal data in the fragment; keep the page out of search results.
  robots: { index: false, follow: false },
};

export default function SharedPage() {
  return <SharedSnapshotView />;
}

import type { Metadata } from "next";
import { ExportHubView } from "@/components/cloud/ExportHubView";

export const metadata: Metadata = {
  title: "Export Hub",
};

export default function ExportsPage() {
  return <ExportHubView />;
}

import type { Metadata } from "next";
import { VabView } from "@/components/vab/VabView";

export const metadata: Metadata = { title: "Taller de ensamblaje" };

export default function VabPage() {
  return <VabView />;
}

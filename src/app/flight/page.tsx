import type { Metadata } from "next";
import { FlightView } from "@/components/flight/FlightView";

export const metadata: Metadata = { title: "Simulador de vuelo" };

export default function FlightPage() {
  return <FlightView />;
}

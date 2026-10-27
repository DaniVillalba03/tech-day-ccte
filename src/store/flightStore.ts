import { create } from "zustand";
import type { FlightResult, FlightSnapshot } from "@/types/flight";

interface FlightStoreState {
  snapshot: FlightSnapshot | null;
  result: FlightResult | null;
  setResult: (r: FlightResult) => void;
  setSnapshot: (s: FlightSnapshot) => void;
  clear: () => void;
}

/** La UI lee solo este snapshot; el motor lo publica con throttling (~100 ms). */
export const useFlightStore = create<FlightStoreState>((set) => ({
  snapshot: null,
  result: null,
  setResult: (result) => set({ result }),
  setSnapshot: (snapshot) => set({ snapshot }),
  clear: () => set({ snapshot: null, result: null }),
}));

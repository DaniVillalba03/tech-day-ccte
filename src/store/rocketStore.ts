import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_TANKS } from "@/data/parts";
import type { RocketConfig } from "@/types";

export { MAX_TANKS };

interface RocketState {
  config: RocketConfig;
  setNose: (id: string) => void;
  setEngine: (id: string) => void;
  setFin: (id: string) => void;
  addTank: (id: string) => void;
  removeTank: (index: number) => void;
  setLaunchAngle: (deg: number) => void;
  setName: (name: string) => void;
}

const DEFAULT_CONFIG: RocketConfig = {
  name: "Mi Cohete",
  noseId: "nose-cone",
  tankIds: ["tank-m"],
  engineId: "eng-vector",
  finId: "fin-medium",
  launchAngleDeg: 90,
};

export const useRocketStore = create<RocketState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      setNose: (noseId) => set((s) => ({ config: { ...s.config, noseId } })),
      setEngine: (engineId) => set((s) => ({ config: { ...s.config, engineId } })),
      setFin: (finId) => set((s) => ({ config: { ...s.config, finId } })),
      addTank: (id) =>
        set((s) =>
          s.config.tankIds.length >= MAX_TANKS
            ? s
            : { config: { ...s.config, tankIds: [...s.config.tankIds, id] } },
        ),
      removeTank: (index) =>
        set((s) =>
          s.config.tankIds.length <= 1
            ? s
            : { config: { ...s.config, tankIds: s.config.tankIds.filter((_, i) => i !== index) } },
        ),
      setLaunchAngle: (deg) =>
        set((s) => ({ config: { ...s.config, launchAngleDeg: Math.min(90, Math.max(15, deg)) } })),
      setName: (name) => set((s) => ({ config: { ...s.config, name } })),
    }),
    { name: "rocket-config" },
  ),
);

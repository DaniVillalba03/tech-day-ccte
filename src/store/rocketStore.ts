import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_TANKS } from "@/data/parts";
import { insertAt, moveItem, removeAt, replaceAt } from "@/lib/listOps";
import type { RocketConfig } from "@/types";

export { MAX_TANKS };

interface RocketState {
  config: RocketConfig;
  setNose: (id: string) => void;
  setEngine: (id: string) => void;
  setFin: (id: string) => void;
  addTank: (id: string) => void;
  removeTank: (index: number) => void;
  replaceTank: (index: number, id: string) => void;
  moveTank: (from: number, to: number) => void;
  insertTank: (index: number, id: string) => void;
  setLaunchAngle: (deg: number) => void;
  setName: (name: string) => void;
}

const DEFAULT_CONFIG: RocketConfig = {
  name: "Mi Cohete",
  noseId: "nose-cone",
  tankIds: ["tank-m"],
  engineId: "eng-vector",
  finId: "fin-large",
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
          s.config.tankIds.length <= 1 ? s : { config: { ...s.config, tankIds: removeAt(s.config.tankIds, index) } },
        ),
      replaceTank: (index, id) =>
        set((s) => ({ config: { ...s.config, tankIds: replaceAt(s.config.tankIds, index, id) } })),
      moveTank: (from, to) =>
        set((s) => ({ config: { ...s.config, tankIds: moveItem(s.config.tankIds, from, to) } })),
      insertTank: (index, id) =>
        set((s) =>
          s.config.tankIds.length >= MAX_TANKS
            ? s
            : { config: { ...s.config, tankIds: insertAt(s.config.tankIds, index, id) } },
        ),
      setLaunchAngle: (deg) =>
        set((s) => ({ config: { ...s.config, launchAngleDeg: Math.min(90, Math.max(15, deg)) } })),
      setName: (name) => set((s) => ({ config: { ...s.config, name } })),
    }),
    { name: "rocket-config" },
  ),
);

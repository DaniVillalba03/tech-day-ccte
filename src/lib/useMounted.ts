import { useSyncExternalStore } from "react";

/** false en SSR/hidratación, true en cliente: evita desajustes con stores persistidos. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

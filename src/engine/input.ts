export interface InputActions {
  onChute: () => void;
  onLaunch: () => void;
  onWarp: (warp: number) => void;
}

const WARP_KEYS: Record<string, number> = { Digit1: 1, Digit2: 2, Digit3: 5 };

/** ¿El foco está en un campo donde se escribe? Ahí las teclas no deben activar atajos del juego. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

/** Teclado: Espacio (paracaídas), Enter (lanzar), 1/2/3 (time warp 1x/2x/5x). Se ignora al escribir en un campo. */
export class InputController {
  constructor(private actions: InputActions) {
    window.addEventListener("keydown", this.onDown);
  }

  destroy() {
    window.removeEventListener("keydown", this.onDown);
  }

  private onDown = (e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
    // Con un botón enfocado, Espacio y Enter ya lo activan: no duplicar la acción
    const onButton = (e.target as HTMLElement | null)?.tagName === "BUTTON";
    switch (e.code) {
      case "Space":
        if (onButton) return;
        e.preventDefault();
        this.actions.onChute();
        break;
      case "Enter":
        if (onButton) return;
        this.actions.onLaunch();
        break;
      default:
        if (e.code in WARP_KEYS) this.actions.onWarp(WARP_KEYS[e.code]);
    }
  };
}

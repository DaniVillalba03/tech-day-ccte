export interface InputActions {
  onChute: () => void;
  onLaunch: () => void;
  onWarp: (warp: number) => void;
}

const WARP_KEYS: Record<string, number> = { Digit1: 1, Digit2: 2, Digit3: 5 };

/** Teclado: Espacio (paracaídas), Enter (lanzar), 1/2/3 (time warp 1x/2x/5x). */
export class InputController {
  constructor(private actions: InputActions) {
    window.addEventListener("keydown", this.onDown);
  }

  destroy() {
    window.removeEventListener("keydown", this.onDown);
  }

  private onDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    switch (e.code) {
      case "Space":
        e.preventDefault();
        this.actions.onChute();
        break;
      case "Enter":
        this.actions.onLaunch();
        break;
      default:
        if (e.code in WARP_KEYS) this.actions.onWarp(WARP_KEYS[e.code]);
    }
  };
}

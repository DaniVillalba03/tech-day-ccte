import type { FlightInput } from "@/types/flight";

export interface InputActions {
  onChute: () => void;
  onLaunch: () => void;
  onWarp: (warp: number) => void;
}

const WARP_KEYS: Record<string, number> = { Digit1: 1, Digit2: 2, Digit3: 5 };

/** Teclado: A/D o ←/→ (pitch), Espacio (paracaídas), Enter (lanzar), 1/2/3 (time warp 1x/2x/5x). */
export class InputController {
  private left = false;
  private right = false;

  constructor(private actions: InputActions) {
    window.addEventListener("keydown", this.onDown);
    window.addEventListener("keyup", this.onUp);
    window.addEventListener("blur", this.reset);
  }

  get state(): FlightInput {
    return { pitch: this.left === this.right ? 0 : this.left ? 1 : -1 };
  }

  setPitch(dir: -1 | 0 | 1) {
    this.left = dir === 1;
    this.right = dir === -1;
  }

  destroy() {
    window.removeEventListener("keydown", this.onDown);
    window.removeEventListener("keyup", this.onUp);
    window.removeEventListener("blur", this.reset);
  }

  private reset = () => {
    this.left = this.right = false;
  };

  private onDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    switch (e.code) {
      case "KeyA":
      case "ArrowLeft":
        this.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.right = true;
        break;
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

  private onUp = (e: KeyboardEvent) => {
    if (e.code === "KeyA" || e.code === "ArrowLeft") this.left = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") this.right = false;
  };
}

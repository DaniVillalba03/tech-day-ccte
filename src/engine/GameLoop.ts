import { PHYSICS_DT } from "./physics/updatePhysics";

const MAX_FRAME_DT = 0.1;
const MAX_STEPS_PER_FRAME = 1200;

export interface GameLoopHandlers {
  /** Un paso fijo de física (dt = PHYSICS_DT) */
  step: () => void;
  /** Una vez por frame; `frameDt` es el tiempo real transcurrido (s) */
  render: (frameDt: number) => void;
}

/** Loop requestAnimationFrame con paso fijo y time warp. Sin dependencias de React. */
export class GameLoop {
  warp = 1;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;

  constructor(private handlers: GameLoopHandlers) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const frameDt = Math.min((now - this.last) / 1000, MAX_FRAME_DT);
    this.last = now;

    // El warp multiplica pasos por frame; el dt de cada paso nunca crece
    this.acc += frameDt * this.warp;
    let steps = 0;
    while (this.acc >= PHYSICS_DT && steps < MAX_STEPS_PER_FRAME) {
      this.handlers.step();
      this.acc -= PHYSICS_DT;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) this.acc = 0;

    this.handlers.render(frameDt);
    this.raf = requestAnimationFrame(this.frame);
  };
}

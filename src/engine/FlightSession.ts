import type { RocketConfig } from "@/types";
import type { FlightResult, FlightSnapshot, FlightState, PhysicsRocket } from "@/types/flight";
import { GameLoop } from "./GameLoop";
import { InputController } from "./input";
import { buildPhysicsRocket, createInitialState } from "./physics/rocketModel";
import { PHYSICS_DT, updatePhysics } from "./physics/updatePhysics";
import { ParticleSystem } from "./render/particles";
import { Renderer } from "./render/Renderer";
import { TelemetryRecorder } from "./telemetry";

const SNAPSHOT_INTERVAL_MS = 100;
export const WARPS = [1, 2, 5] as const;

/** Orquesta física, entrada, render y publicación de telemetría. TS puro, sin React. */
export class FlightSession {
  state: FlightState;
  private rocket: PhysicsRocket;
  private renderer: Renderer;
  private input: InputController;
  private loop: GameLoop;
  private particles = new ParticleSystem();
  private lastSnapshot = 0;
  private endSent = false;
  private telemetry = new TelemetryRecorder();

  constructor(
    private canvas: HTMLCanvasElement,
    private config: RocketConfig,
    private onSnapshot: (s: FlightSnapshot) => void,
    private onEnd?: (r: FlightResult) => void,
  ) {
    this.rocket = buildPhysicsRocket(config);
    this.state = createInitialState(this.rocket, config.launchAngleDeg);
    this.renderer = new Renderer(canvas, config, this.rocket);
    this.input = new InputController({
      onChute: () => this.deployChute(),
      onLaunch: () => this.launch(),
      onWarp: (w) => this.setWarp(w),
    });
    this.loop = new GameLoop({
      step: () => {
        const prev = this.state.status;
        if (prev === "landed" || prev === "crashed") return;
        updatePhysics(this.state, this.rocket, this.input.state, PHYSICS_DT);
        const st = this.state.status;
        if (st !== "prelaunch") this.telemetry.record(this.state, st === "landed" || st === "crashed");
      },
      render: (dt) => this.frame(dt),
    });
  }

  start() {
    this.loop.start();
  }

  destroy() {
    this.loop.stop();
    this.input.destroy();
  }

  resize(w: number, h: number) {
    this.renderer.resize(w, h);
  }

  launch() {
    const s = this.state;
    if (s.status !== "prelaunch") return;
    s.engineOn = true;
    s.status = "boosting";
  }

  deployChute() {
    const s = this.state;
    if (s.status === "prelaunch" || s.status === "landed" || s.status === "crashed") return;
    s.chuteDeployed = true;
  }

  setWarp(w: number) {
    this.loop.warp = w;
  }

  setPitch(dir: -1 | 0 | 1) {
    this.input.setPitch(dir);
  }

  reset() {
    this.state = createInitialState(this.rocket, this.config.launchAngleDeg);
    this.particles.clear();
    this.telemetry.reset();
    this.loop.warp = 1;
    this.lastSnapshot = 0;
    this.endSent = false;
  }

  private frame(frameDt: number) {
    const s = this.state;
    if (s.thrustNow > 0) {
      const n = this.renderer.nozzle(s);
      this.particles.emit(n.x, n.y, n.dx, n.dy, s.thrustNow / this.rocket.thrust, frameDt * this.loop.warp);
    }
    this.particles.update(frameDt * this.loop.warp);
    this.renderer.render(s, this.particles, frameDt);

    const now = performance.now();
    const ended = s.status === "landed" || s.status === "crashed";
    if (ended ? !this.endSent : now - this.lastSnapshot >= SNAPSHOT_INTERVAL_MS) {
      this.lastSnapshot = now;
      this.endSent = ended;
      this.onSnapshot(this.snapshot());
      if (ended) this.onEnd?.(this.result(s.status as "landed" | "crashed"));
    }
  }

  private result(status: "landed" | "crashed"): FlightResult {
    const s = this.state;
    return {
      status,
      apogee: s.apogee,
      distance: Math.abs(s.x),
      maxSpeed: s.maxSpeed,
      maxAccelG: s.maxAccelG,
      duration: s.t,
      samples: [...this.telemetry.samples],
    };
  }

  private snapshot(): FlightSnapshot {
    const s = this.state;
    return {
      t: s.t,
      altitude: s.y,
      apogee: s.apogee,
      distance: Math.abs(s.x),
      speed: Math.hypot(s.vx, s.vy),
      accelG: s.accelG,
      fuelPct: s.propellantMax > 0 ? (s.propellant / s.propellantMax) * 100 : 0,
      thetaDeg: (s.theta * 180) / Math.PI,
      pathDeg: (Math.atan2(s.vy, s.vx) * 180) / Math.PI,
      status: s.status,
      warp: this.loop.warp,
      chuteDeployed: s.chuteDeployed,
    };
  }
}

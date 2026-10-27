import type { RocketConfig } from "@/types";
import type { FlightResult, FlightSnapshot, FlightState, PhysicsRocket } from "@/types/flight";
import { GameLoop } from "./GameLoop";
import { InputController } from "./input";
import { buildPhysicsRocket, createInitialState } from "./physics/rocketModel";
import { windAt } from "./physics/aerodynamics";
import { atmosphere } from "./physics/atmosphere";
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
        updatePhysics(this.state, this.rocket, PHYSICS_DT);
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
    const simDt = frameDt * this.loop.warp;
    if (s.thrustNow > 0) {
      const n = this.renderer.nozzle(s);
      const frac = Math.min(1.3, s.thrustNow / this.rocket.thrust);
      this.particles.emitFlame(n.x, n.y, n.dx, n.dy, frac, simDt);
      this.particles.emitSmoke(n.x, n.y, s.vx, s.vy, n.dx, n.dy, atmosphere(s.y).density, simDt);
      if (s.y < 30) this.particles.emitDust(s.x, frac * (1 - s.y / 30), simDt);
    }
    this.particles.update(simDt, windAt);
    this.renderer.render(s, this.particles, frameDt, performance.now() / 1000);

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
      maxQ: s.maxQ,
      maxMach: s.maxMach,
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
      chuteFailed: s.chuteFailed,
      mach: s.mach,
      dynPressure: s.dynPressure,
      aoaDeg: (s.aoa * 180) / Math.PI,
      wind: windAt(s.y),
      onRail: s.onRail,
    };
  }
}

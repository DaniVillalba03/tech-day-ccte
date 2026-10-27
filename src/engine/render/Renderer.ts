import type { RocketConfig } from "@/types";
import type { FlightState, PhysicsRocket } from "@/types/flight";
import { Camera } from "./camera";
import { drawGround } from "./ground";
import type { ParticleSystem } from "./particles";
import { drawRocketSprite } from "./rocketSprite";
import { drawBackdrop, drawStructures } from "./scenery";
import { drawSky } from "./sky";

/** Tamaño mínimo (px/m) del sprite para que el cohete siga visible al alejar la cámara */
const MIN_SPRITE_SCALE = 5;

export class Renderer {
  readonly camera = new Camera();
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement, private config: RocketConfig, private rocket: PhysicsRocket) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D no disponible");
    this.ctx = ctx;
  }

  resize(width: number, height: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.camera.width = width;
    this.camera.height = height;
  }

  render(s: FlightState, particles: ParticleSystem, frameDt: number) {
    const { ctx, camera: cam } = this;
    cam.update(s.x, s.y, Math.hypot(s.vx, s.vy), frameDt);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    drawSky(ctx, cam.width, cam.height, s.y);
    drawBackdrop(ctx, cam, s.y);
    drawGround(ctx, cam);
    drawStructures(ctx, cam, s.status === "prelaunch");
    particles.draw(ctx, cam);

    // Sobre/cerca del suelo la cola apoya en el punto; en altura gira alrededor del centro
    const L = this.rocket.length;
    const ground = Math.max(0, 1 - s.y / (L * 2));
    const cx = s.x + Math.cos(s.theta) * (L / 2) * ground;
    const cy = s.y + Math.sin(s.theta) * (L / 2) * ground;

    ctx.save();
    ctx.translate(cam.toScreenX(cx), cam.toScreenY(cy));
    ctx.rotate(-s.theta);
    const k = Math.max(cam.scale, MIN_SPRITE_SCALE);
    ctx.scale(k, k);
    drawRocketSprite(ctx, this.config, s.chuteDeployed);
    ctx.restore();
  }

  /** Posición mundo del tobera y dirección de escape (para partículas) */
  nozzle(s: FlightState): { x: number; y: number; dx: number; dy: number } {
    const L = this.rocket.length;
    const dx = -Math.cos(s.theta);
    const dy = -Math.sin(s.theta);
    const ground = Math.max(0, 1 - s.y / (L * 2));
    // centro dibujado menos media longitud en la dirección de la cola
    const cx = s.x + Math.cos(s.theta) * (L / 2) * ground;
    const cy = s.y + Math.sin(s.theta) * (L / 2) * ground;
    return { x: cx + dx * (L / 2), y: cy + dy * (L / 2), dx, dy };
  }
}

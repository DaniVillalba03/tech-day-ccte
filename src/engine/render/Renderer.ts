import { atmosphere } from "@/engine/physics/atmosphere";
import { P0 } from "@/engine/physics/constants";
import { CHUTE_OPEN_TIME } from "@/engine/physics/rocketModel";
import type { RocketConfig } from "@/types";
import type { FlightState, PhysicsRocket } from "@/types/flight";
import { Camera } from "./camera";
import { drawChute, drawPlume, drawVaporCone } from "./effects";
import { drawGround } from "./ground";
import type { ParticleSystem } from "./particles";
import { drawRocketSprite } from "./rocketSprite";
import { drawBackdrop, drawStructures } from "./scenery";
import { drawSky } from "./sky";
import { type Sprites, getSprites } from "./textures";

/** Tamaño mínimo (px/m) del sprite para que el cohete siga visible al alejar la cámara */
const MIN_SPRITE_SCALE = 5;

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

export class Renderer {
  readonly camera = new Camera();
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private sprites: Sprites;
  private exitR: number;

  constructor(private canvas: HTMLCanvasElement, private config: RocketConfig, private rocket: PhysicsRocket) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D no disponible");
    this.ctx = ctx;
    this.sprites = getSprites();
    this.exitR = Math.sqrt(rocket.exitArea / Math.PI);
  }

  resize(width: number, height: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.camera.width = width;
    this.camera.height = height;
  }

  render(s: FlightState, particles: ParticleSystem, frameDt: number, time: number) {
    const { ctx, camera: cam, sprites } = this;
    cam.update(s.x, s.y, Math.hypot(s.vx, s.vy), frameDt);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const thrustFrac = Math.min(1.4, s.thrustNow / this.rocket.thrust);

    // Temblor de cámara al encender y despegar, y vibración transónica
    const lowShake = thrustFrac * Math.max(0, 1 - s.y / 140) * 2.4;
    const buffet = Math.max(0, 1 - Math.abs(s.mach - 1) / 0.2) * Math.min(1, s.dynPressure / 40000) * 1.6;
    const shake = lowShake + buffet;
    if (shake > 0.05) ctx.translate((Math.random() - 0.5) * 2 * shake, (Math.random() - 0.5) * 2 * shake);

    drawSky(ctx, cam.width, cam.height, s.y);
    const inCloud = drawBackdrop(ctx, cam, s.y, sprites);
    if (inCloud > 0.01) {
      ctx.fillStyle = `rgba(236,241,248,${inCloud * 0.7})`;
      ctx.fillRect(-20, -20, cam.width + 40, cam.height + 40);
    }
    drawGround(ctx, cam, s.y, time);
    drawStructures(ctx, cam, s.status === "prelaunch");

    // Resplandor del escape sobre la plataforma
    if (thrustFrac > 0.05 && s.y < 90) {
      const a = thrustFrac * (1 - s.y / 90);
      const r = (30 + 20 * thrustFrac) * cam.scale;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, a) * 0.8;
      ctx.drawImage(sprites.glowWarm, cam.toScreenX(0) - r, cam.toScreenY(1) - r * 0.6, r * 2, r * 1.2);
      ctx.restore();
    }

    particles.draw(ctx, cam, sprites, false);

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

    const pr = atmosphere(s.y).pressure / P0;
    drawPlume(ctx, L, thrustFrac, pr, this.exitR, time, sprites);
    drawRocketSprite(ctx, this.config);
    drawVaporCone(ctx, L, s.mach, s.y);
    if (s.chuteDeployed && s.chuteTime >= 0) {
      drawChute(ctx, L, this.rocket.chuteArea, smoothstep((s.t - s.chuteTime) / CHUTE_OPEN_TIME), s.chuteFailed, time);
    }
    ctx.restore();

    particles.draw(ctx, cam, sprites, true);
  }

  /** Posición mundo de la tobera y dirección de escape (para partículas) */
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

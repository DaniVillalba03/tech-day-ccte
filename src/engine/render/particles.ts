import type { Camera } from "./camera";
import type { Sprites } from "./textures";

type Kind = "flame" | "smoke" | "dust";

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  /** Tamaño inicial y final (m) */
  s0: number;
  s1: number;
  alpha: number;
  rot: number;
}

const MAX_PARTICLES = 3500;

/** Partículas en coordenadas de mundo (m): llama, humo persistente que deriva con el viento y polvo en la plataforma. */
export class ParticleSystem {
  private list: Particle[] = [];

  private push(p: Particle) {
    if (this.list.length < MAX_PARTICLES) this.list.push(p);
  }

  /** `count` partículas esperadas; la parte fraccionaria se resuelve al azar. */
  private count(n: number): number {
    return Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
  }

  emitFlame(x: number, y: number, dirX: number, dirY: number, intensity: number, dt: number) {
    for (let i = this.count(intensity * 70 * dt); i > 0; i--) {
      const spread = (Math.random() - 0.5) * 0.3;
      const c = Math.cos(spread);
      const s = Math.sin(spread);
      const speed = 40 + Math.random() * 40;
      this.push({
        kind: "flame",
        x,
        y,
        vx: (dirX * c - dirY * s) * speed,
        vy: (dirX * s + dirY * c) * speed,
        life: 0,
        maxLife: 0.15 + Math.random() * 0.3,
        s0: 0.5,
        s1: 1.6,
        alpha: 0.9,
        rot: 0,
      });
    }
  }

  /** Estela de humo blanco del KNSB; dura menos en aire poco denso. */
  emitSmoke(x: number, y: number, vx: number, vy: number, dirX: number, dirY: number, density: number, dt: number) {
    const life = 6 + 30 * Math.min(1, density / 0.5);
    for (let i = this.count(55 * dt); i > 0; i--) {
      this.push({
        kind: "smoke",
        x: x + (Math.random() - 0.5) * 0.5,
        y: y + (Math.random() - 0.5) * 0.5,
        vx: vx * 0.15 + dirX * (6 + Math.random() * 8) + (Math.random() - 0.5) * 3,
        vy: vy * 0.15 + dirY * (6 + Math.random() * 8) + (Math.random() - 0.5) * 3,
        life: 0,
        maxLife: life * (0.7 + Math.random() * 0.6),
        s0: 1.4 + Math.random() * 1,
        s1: 16 + Math.random() * 10,
        alpha: 0.5,
        rot: Math.random() * Math.PI * 2,
      });
    }
  }

  /** Nube de polvo y vapor al despegar, a ras de suelo. */
  emitDust(x: number, intensity: number, dt: number) {
    for (let i = this.count(intensity * 26 * dt); i > 0; i--) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.push({
        kind: "dust",
        x: x + dir * Math.random() * 3,
        y: 1 + Math.random() * 2,
        vx: dir * (8 + Math.random() * 28),
        vy: 1 + Math.random() * 5,
        life: 0,
        maxLife: 7 + Math.random() * 7,
        s0: 4 + Math.random() * 3,
        s1: 20 + Math.random() * 14,
        alpha: 0.55,
        rot: Math.random() * Math.PI * 2,
      });
    }
  }

  /** `wind(y)` devuelve el viento en x (m/s) a esa altitud. */
  update(dt: number, wind: (y: number) => number) {
    const live: Particle[] = [];
    for (const p of this.list) {
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      if (p.kind === "flame") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const d = 1 - Math.min(0.9, 4 * dt);
        p.vx *= d;
        p.vy *= d;
      } else {
        // El humo y el polvo se frenan y son arrastrados por el viento, con algo de flotabilidad
        const k = Math.min(1, 0.6 * dt);
        p.vx += (wind(p.y) - p.vx) * k;
        p.vy += ((p.kind === "smoke" ? 0.4 : 0.1) - p.vy) * k;
        p.x += p.vx * dt;
        p.y = Math.max(0.2, p.y + p.vy * dt);
      }
      live.push(p);
    }
    this.list = live;
  }

  clear() {
    this.list = [];
  }

  draw(ctx: CanvasRenderingContext2D, cam: Camera, sprites: Sprites, additive: boolean) {
    for (const p of this.list) {
      if ((p.kind === "flame") !== additive) continue;
      const k = p.life / p.maxLife;
      let size = (p.s0 + (p.s1 - p.s0) * Math.sqrt(k)) * cam.scale;
      const sx = cam.toScreenX(p.x);
      const sy = cam.toScreenY(p.y);
      if (p.kind !== "flame" && size < 2.2) size = 2.2;
      if (size < 1.5 || sx < -size || sx > cam.width + size || sy < -size || sy > cam.height + size) continue;
      const fade = p.kind === "flame" ? 1 - k : Math.min(1, k * 8) * (1 - k) ** 1.4;
      ctx.globalAlpha = p.alpha * fade;
      const img = p.kind === "flame" ? sprites.glowWarm : p.kind === "smoke" ? sprites.smoke : sprites.dust;
      if (p.kind === "flame") {
        const r = Math.max(size, 4);
        ctx.drawImage(img, sx - r, sy - r, r * 2, r * 2);
      } else {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(p.rot + k * 0.6);
        ctx.drawImage(img, -size, -size, size * 2, size * 2);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
}

import type { Camera } from "./camera";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 500;

/** Partículas de escape en coordenadas de mundo (m). */
export class ParticleSystem {
  private list: Particle[] = [];

  emit(x: number, y: number, dirX: number, dirY: number, intensity: number, dt: number) {
    const count = Math.round(intensity * 90 * dt) + (Math.random() < (intensity * 90 * dt) % 1 ? 1 : 0);
    for (let i = 0; i < count && this.list.length < MAX_PARTICLES; i++) {
      const spread = (Math.random() - 0.5) * 0.35;
      const speed = 25 + Math.random() * 20;
      const c = Math.cos(spread);
      const s = Math.sin(spread);
      this.list.push({
        x,
        y,
        vx: (dirX * c - dirY * s) * speed,
        vy: (dirX * s + dirY * c) * speed,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.5,
      });
    }
  }

  update(dt: number) {
    for (const p of this.list) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.5 * dt;
      p.vy *= 1 - 1.5 * dt;
    }
    this.list = this.list.filter((p) => p.life < p.maxLife);
  }

  clear() {
    this.list = [];
  }

  draw(ctx: CanvasRenderingContext2D, cam: Camera) {
    for (const p of this.list) {
      const k = p.life / p.maxLife;
      const r = Math.max(1.5, (0.4 + k * 1.2) * cam.scale);
      const color = k < 0.3 ? "255,235,170" : k < 0.65 ? "245,140,50" : "140,140,145";
      ctx.fillStyle = `rgba(${color},${(1 - k) * 0.85})`;
      ctx.beginPath();
      ctx.arc(cam.toScreenX(p.x), cam.toScreenY(p.y), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

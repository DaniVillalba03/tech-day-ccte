/** Cámara 2D: centrada en el cohete, con zoom (px/m) según altitud y velocidad. */
export class Camera {
  x = 0;
  y = 0;
  /** píxeles por metro */
  scale = 14;
  width = 800;
  height = 600;

  update(x: number, y: number, speed: number, frameDt: number) {
    this.x = x;
    this.y = y;
    // Más altitud/velocidad → más alejado. Interpolación en escala logarítmica.
    const target = 14 / (1 + y / 120 + speed / 60);
    const clamped = Math.max(0.004, Math.min(14, target));
    const k = 1 - Math.exp(-3 * frameDt);
    this.scale = Math.exp(Math.log(this.scale) + (Math.log(clamped) - Math.log(this.scale)) * k);
  }

  /** Mundo (m) → pantalla (px). El cohete queda ligeramente bajo el centro. */
  toScreenX(wx: number) {
    return this.width / 2 + (wx - this.x) * this.scale;
  }
  toScreenY(wy: number) {
    return this.height * 0.55 - (wy - this.y) * this.scale;
  }
}

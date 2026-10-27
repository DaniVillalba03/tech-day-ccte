/** Cámara 2D: centrada en el cohete, con zoom (px/m) según altitud y velocidad. */
export class Camera {
  x = 0;
  y = 0;
  /** píxeles por metro */
  scale = 14;
  width = 800;
  height = 600;
  /** Fracción de la altura de pantalla donde queda el cohete (más abajo cerca del suelo para ver el cielo) */
  anchor = 0.78;

  update(x: number, y: number, speed: number, frameDt: number) {
    this.x = x;
    this.y = y;
    // Más altitud/velocidad → más alejado. Interpolación en escala logarítmica.
    let target = 14 / (1 + y / 120 + speed / 60);
    // Al subir se aleja lo justo para que el suelo (y la curvatura de la Tierra) siga a la vista
    if (y > 150) target = Math.min(target, (this.height * 0.4) / y);
    const clamped = Math.max(0.0006, Math.min(14, target));
    const k = 1 - Math.exp(-3 * frameDt);
    this.anchor = 0.55 + 0.23 * Math.min(1, Math.max(0, 1 - (y * this.scale) / (this.height * 0.3)));
    this.scale = Math.exp(Math.log(this.scale) + (Math.log(clamped) - Math.log(this.scale)) * k);
  }

  /** Mundo (m) → pantalla (px). El cohete queda ligeramente bajo el centro. */
  toScreenX(wx: number) {
    return this.width / 2 + (wx - this.x) * this.scale;
  }
  toScreenY(wy: number) {
    return this.height * this.anchor - (wy - this.y) * this.scale;
  }
}

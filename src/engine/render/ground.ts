import type { Camera } from "./camera";

const STEPS = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

function fmtDist(m: number) {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

/** Suelo, plataforma y marcadores de distancia horizontal. */
export function drawGround(ctx: CanvasRenderingContext2D, cam: Camera) {
  const groundY = cam.toScreenY(0);
  if (groundY < cam.height) {
    ctx.fillStyle = "#1a1f17";
    ctx.fillRect(0, groundY, cam.width, cam.height - groundY);
    ctx.fillStyle = "#f9f9f7";
    ctx.fillRect(0, groundY, cam.width, 2);

    // Marcadores cada N metros (N elegido para que haya ≥ 90 px entre ellos)
    const step = STEPS.find((s) => s * cam.scale >= 90) ?? STEPS[STEPS.length - 1];
    const left = cam.x - cam.width / 2 / cam.scale;
    const right = cam.x + cam.width / 2 / cam.scale;
    ctx.font = "11px var(--font-plex-mono), monospace";
    ctx.textAlign = "center";
    for (let m = Math.floor(left / step) * step; m <= right; m += step) {
      const sx = cam.toScreenX(m);
      ctx.fillStyle = m === 0 ? "#d52b32" : "#f9f9f7";
      ctx.fillRect(sx - 1, groundY, 2, m === 0 ? 14 : 10);
      if (groundY + 28 < cam.height) {
        ctx.fillStyle = m === 0 ? "#d52b32" : "#a8adb5";
        ctx.fillText(m === 0 ? "PLATAFORMA" : fmtDist(m), sx, groundY + 28);
      }
    }
  }

  // Torre de lanzamiento (solo visible de cerca)
  if (cam.scale > 2) {
    const px = cam.toScreenX(0);
    ctx.fillStyle = "#31363e";
    ctx.fillRect(px - 20 * cam.scale * 0.08 - 2, groundY - 2, 4 + 40 * cam.scale * 0.08, 2);
  }
}

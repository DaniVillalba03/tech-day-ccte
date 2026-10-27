"use client";

import { useEffect, useRef } from "react";

interface Props {
  title: string;
  /** Pares [x, y] */
  points: [number, number][];
  xLabel: string;
  yLabel: string;
  color: string;
}

const W = 420;
const H = 220;
const PAD = { l: 52, r: 12, t: 12, b: 32 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Gráfica de línea simple en canvas, sin dependencias. */
export function LineChartCanvas({ title, points, xLabel, yLabel, color }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const xMax = Math.max(...points.map((p) => p[0]), 1);
    const yMax = niceMax(Math.max(...points.map((p) => p[1]), 1));
    const px = (x: number) => PAD.l + (x / xMax) * (W - PAD.l - PAD.r);
    const py = (y: number) => H - PAD.b - (y / yMax) * (H - PAD.t - PAD.b);

    ctx.font = "10px var(--font-plex-mono), monospace";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.fillStyle = "#a8adb5";
    ctx.lineWidth = 1;
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const v = (yMax / 4) * i;
      const y = py(v);
      ctx.beginPath();
      ctx.moveTo(PAD.l, y);
      ctx.lineTo(W - PAD.r, y);
      ctx.stroke();
      ctx.fillText(Math.round(v).toLocaleString("es-ES"), PAD.l - 6, y + 3);
    }
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
      const v = (xMax / 4) * i;
      ctx.fillText(Math.round(v).toString(), px(v), H - PAD.b + 14);
    }
    ctx.fillText(xLabel, (PAD.l + W - PAD.r) / 2, H - 4);
    ctx.save();
    ctx.translate(10, (PAD.t + H - PAD.b) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
    ctx.stroke();
  }, [points, xLabel, yLabel, color]);

  return (
    <figure className="min-w-0">
      <figcaption className="label mb-2">{title}</figcaption>
      <canvas
        ref={ref}
        style={{ width: "100%", aspectRatio: `${W} / ${H}` }}
        className="border border-line bg-ink"
        role="img"
        aria-label={title}
      />
    </figure>
  );
}

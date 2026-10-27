"use client";

import { useEffect, useRef } from "react";
import { getPart } from "@/data/parts";
import { ROCKET_RADIUS, drawRocketSprite, rocketLength } from "@/engine/render/rocketSprite";
import type { Engine, Fin, FuelTank, NoseCone, PartCategory, RocketConfig } from "@/types";

const W = 260;
const H = 520;

interface Props {
  config: RocketConfig;
  /** Categoría de la pieza que se está arrastrando: resalta dónde encaja */
  highlight?: PartCategory | null;
  /** El cursor está sobre la zona de soltar */
  over?: boolean;
}

function draw(ctx: CanvasRenderingContext2D, config: RocketConfig, highlight: PartCategory | null, over: boolean) {
  ctx.clearRect(0, 0, W, H);

  // Rejilla de fondo tipo plano de ingeniería
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 26) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const L = rocketLength(config);
  const s = Math.min((H - 80) / L, 90);
  const cx = W / 2;
  const top = (H - L * s) / 2;

  ctx.save();
  ctx.translate(cx, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(s, s);
  drawRocketSprite(ctx, config, false);
  ctx.restore();

  if (!highlight) return;

  // Zonas donde encaja cada categoría (la ojiva arriba, la cola abajo)
  const nose = getPart<NoseCone>(config.noseId);
  const engine = getPart<Engine>(config.engineId);
  const fin = getPart<Fin>(config.finId);
  const bodyLen = config.tankIds.reduce((a, id) => a + getPart<FuelTank>(id).length, 0);
  const half = ROCKET_RADIUS * s;
  const finSpan = ((fin.diameter - 0.6) / 2 + 0.05) * s;
  const bottom = top + L * s;

  let rect: [number, number, number, number];
  switch (highlight) {
    case "nose":
      rect = [cx - half - 6, top - 4, 2 * half + 12, nose.length * s + 8];
      break;
    case "tank":
      rect = [cx - half - 6, top + nose.length * s, 2 * half + 12, bodyLen * s];
      break;
    case "engine":
      rect = [cx - half - 6, bottom - engine.length * s - 2, 2 * half + 12, engine.length * s + 6];
      break;
    case "fin":
      rect = [cx - half - finSpan - 6, bottom - engine.length * s * 0.3 - fin.length * s - 2, 2 * (half + finSpan) + 12, fin.length * s + 8];
      break;
  }
  ctx.fillStyle = over ? "rgba(213,43,50,0.28)" : "rgba(111,155,236,0.14)";
  ctx.strokeStyle = over ? "#d52b32" : "#6f9bec";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.fillRect(...rect);
  ctx.strokeRect(...rect);
  ctx.setLineDash([]);
}

export function RocketPreview({ config, highlight = null, over = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, config, highlight, over);
  }, [config, highlight, over]);

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", maxWidth: W, aspectRatio: `${W} / ${H}` }}
      className="panel bg-gradient-to-b from-[#1b2330] to-ink"
      role="img"
      aria-label={`Vista previa del cohete ${config.name}`}
    />
  );
}

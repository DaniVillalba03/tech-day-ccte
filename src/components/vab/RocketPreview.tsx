"use client";

import { useEffect, useRef } from "react";
import { getPart } from "@/data/parts";
import type { Engine, Fin, FuelTank, NoseCone, RocketConfig } from "@/types";

const W = 240;
const H = 420;

function draw(ctx: CanvasRenderingContext2D, config: RocketConfig) {
  ctx.clearRect(0, 0, W, H);
  const nose = getPart<NoseCone>(config.noseId);
  const tanks = config.tankIds.map((id) => getPart<FuelTank>(id));
  const engine = getPart<Engine>(config.engineId);
  const fin = getPart<Fin>(config.finId);

  const totalLen = nose.length + engine.length + tanks.reduce((s, t) => s + t.length, 0);
  const scale = Math.min((H - 40) / totalLen, 90);
  const cx = W / 2;
  const bodyW = 0.6 * scale;
  let y = (H - totalLen * scale) / 2;

  // Ojiva
  const noseH = nose.length * scale;
  ctx.fillStyle = "#f9f9f7";
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.quadraticCurveTo(cx + bodyW / 2, y + noseH * (nose.cd > 0.5 ? 0.15 : 0.6), cx + bodyW / 2, y + noseH);
  ctx.lineTo(cx - bodyW / 2, y + noseH);
  ctx.quadraticCurveTo(cx - bodyW / 2, y + noseH * (nose.cd > 0.5 ? 0.15 : 0.6), cx, y);
  ctx.fill();
  y += noseH;

  // Tanques
  tanks.forEach((t, i) => {
    const h = t.length * scale;
    ctx.fillStyle = i % 2 ? "#d52b32" : "#b8242a";
    ctx.fillRect(cx - bodyW / 2, y, bodyW, h);
    ctx.strokeStyle = "#0a0a0a55";
    ctx.strokeRect(cx - bodyW / 2, y, bodyW, h);
    y += h;
  });

  // Aletas (detrás del motor)
  const engH = engine.length * scale;
  const finH = fin.length * scale;
  const finW = (fin.diameter - 0.6) * scale + bodyW / 2;
  ctx.fillStyle = "#244b8f";
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + (dir * bodyW) / 2, y + engH - finH);
    ctx.lineTo(cx + dir * (bodyW / 2 + finW * 0.8), y + engH + finH * 0.1);
    ctx.lineTo(cx + (dir * bodyW) / 2, y + engH);
    ctx.fill();
  }

  // Motor + tobera
  ctx.fillStyle = "#31363e";
  ctx.fillRect(cx - bodyW * 0.35, y, bodyW * 0.7, engH * 0.6);
  ctx.beginPath();
  ctx.moveTo(cx - bodyW * 0.25, y + engH * 0.6);
  ctx.lineTo(cx + bodyW * 0.25, y + engH * 0.6);
  ctx.lineTo(cx + bodyW * 0.4, y + engH);
  ctx.lineTo(cx - bodyW * 0.4, y + engH);
  ctx.fill();
}

export function RocketPreview({ config }: { config: RocketConfig }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) draw(ctx, config);
  }, [config]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="panel bg-gradient-to-b from-[#1b2330] to-ink"
    />
  );
}

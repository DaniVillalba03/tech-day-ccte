"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { drawRocketSprite } from "@/engine/render/rocketSprite";
import type { Part, PartCategory, RocketConfig } from "@/types";
import { PREVIEW_H, PREVIEW_W, type Selection, type Zone, hitTest, layoutRocket, sameSelection } from "./rocketLayout";

const LABEL: Record<PartCategory, string> = { nose: "Ojiva", tank: "Cuerpo", engine: "Motor", fin: "Aletas" };

interface Props {
  config: RocketConfig;
  selection: Selection | null;
  /** Pieza del catálogo que se está arrastrando */
  dragging: Part | null;
  onSelect: (zone: Selection | null) => void;
  /** Se soltó una pieza sobre el cohete; `zone` es la pieza que había debajo (o null) */
  onDropPart: (part: Part, zone: Zone | null) => void;
}

function zoneLabel(z: Zone): string {
  return z.kind === "tank" ? `${LABEL.tank} ${z.index + 1}` : LABEL[z.kind];
}

function outlineZone(ctx: CanvasRenderingContext2D, z: Zone, color: string, fill: string, dash: number[], label?: string) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dash);
  ctx.fillRect(z.x, z.y, z.w, z.h);
  ctx.strokeRect(z.x, z.y, z.w, z.h);
  ctx.setLineDash([]);
  if (label) {
    ctx.font = "600 10px var(--font-plex-sans), sans-serif";
    const tw = ctx.measureText(label).width + 10;
    const lx = Math.min(PREVIEW_W - tw - 2, z.x + z.w + 4);
    const ly = z.y + Math.min(z.h / 2, 24) - 8;
    ctx.fillStyle = "rgba(10,12,15,0.92)";
    ctx.fillRect(lx, ly, tw, 16);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, tw, 16);
    ctx.fillStyle = "#f9f9f7";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + 5, ly + 8.5);
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  config: RocketConfig,
  selection: Selection | null,
  hover: Zone | null,
  dragging: Part | null,
  dropZone: Zone | null,
) {
  ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= PREVIEW_W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PREVIEW_H);
    ctx.stroke();
  }
  for (let y = 0; y <= PREVIEW_H; y += 26) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PREVIEW_W, y);
    ctx.stroke();
  }

  const { s, cx, zones } = layoutRocket(config);
  ctx.save();
  ctx.translate(cx, PREVIEW_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(s, s);
  drawRocketSprite(ctx, config, false);
  ctx.restore();

  // Mientras se arrastra: marca dónde encaja la pieza; la zona bajo el cursor se resalta en rojo
  if (dragging) {
    for (const z of zones.filter((z) => z.kind === dragging.category)) {
      outlineZone(ctx, z, "#6f9bec", "rgba(111,155,236,0.12)", [6, 4]);
    }
    if (dropZone && dropZone.kind === dragging.category) {
      outlineZone(ctx, dropZone, "#d52b32", "rgba(213,43,50,0.28)", [6, 4], "Reemplazar");
    } else if (dragging.category === "tank") {
      const bodies = zones.filter((z) => z.kind === "tank");
      const last = bodies[bodies.length - 1];
      if (last && dropZone === null) outlineZone(ctx, { ...last, y: last.y + last.h - 3, h: 6 }, "#d52b32", "rgba(213,43,50,0.6)", [], "Añadir");
    }
    return;
  }

  if (hover && !sameSelection(hover, selection)) outlineZone(ctx, hover, "rgba(249,249,247,0.8)", "rgba(249,249,247,0.08)", [4, 3], zoneLabel(hover));
  const sel = zones.find((z) => sameSelection(z, selection));
  if (sel) outlineZone(ctx, sel, "#6f9bec", "rgba(111,155,236,0.18)", [], zoneLabel(sel));
}

/** Cohete interactivo: clic para seleccionar una pieza, soltar una pieza del catálogo para reemplazarla. */
export function RocketPreview({ config, selection, dragging, onSelect, onDropPart }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Zone | null>(null);
  const [dropZone, setDropZone] = useState<Zone | null>(null);
  const layout = useMemo(() => layoutRocket(config), [config]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = PREVIEW_W * dpr;
    canvas.height = PREVIEW_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, config, selection, hover, dragging, dropZone);
  }, [config, selection, hover, dragging, dropZone]);

  /** Posición del puntero en coordenadas del canvas (independiente del tamaño CSS) */
  const zoneAt = (e: { clientX: number; clientY: number }): Zone | null => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * PREVIEW_W;
    const py = ((e.clientY - r.top) / r.height) * PREVIEW_H;
    return hitTest(layout.zones, px, py, layout.cx, layout.half);
  };

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", maxWidth: PREVIEW_W, aspectRatio: `${PREVIEW_W} / ${PREVIEW_H}`, cursor: hover || dragging ? "pointer" : "default" }}
      className="panel bg-gradient-to-b from-[#1b2330] to-ink"
      role="img"
      aria-label={`Cohete ${config.name}. Haz clic en una pieza para seleccionarla.`}
      onMouseMove={(e) => setHover(zoneAt(e))}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => {
        const z = zoneAt(e);
        onSelect(z && !sameSelection(z, selection) ? { kind: z.kind, index: z.index } : null);
      }}
      onDragOver={(e) => {
        if (!dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        const z = zoneAt(e);
        setDropZone((prev) => (prev && z && prev.kind === z.kind && prev.index === z.index ? prev : z));
      }}
      onDragLeave={() => setDropZone(null)}
      onDrop={(e) => {
        e.preventDefault();
        const part = dragging;
        const z = zoneAt(e);
        setDropZone(null);
        if (part) onDropPart(part, z);
      }}
    />
  );
}

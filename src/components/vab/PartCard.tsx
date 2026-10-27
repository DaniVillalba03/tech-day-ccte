"use client";

import { useEffect, useRef } from "react";
import { drawPartThumb } from "@/engine/render/partArt";
import type { Part } from "@/types";

const TW = 150;
const TH = 72;

function PartThumb({ part }: { part: Part }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = TW * dpr;
    canvas.height = TH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, TW, TH);
    drawPartThumb(ctx, part, TW, TH);
  }, [part]);
  return <canvas ref={ref} style={{ width: "100%", aspectRatio: `${TW} / ${TH}` }} aria-hidden />;
}

interface Props {
  part: Part;
  selected: boolean;
  /** Texto de la acción al hacer clic (p. ej. "Seleccionar" / "Añadir") */
  stats: string;
  onClick: () => void;
  onDragStart: (part: Part) => void;
  onDragEnd: () => void;
}

/** Tarjeta de pieza: se puede arrastrar al cohete o pulsar para seleccionarla. */
export function PartCard({ part, selected, stats, onClick, onDragStart, onDragEnd }: Props) {
  return (
    <button
      type="button"
      draggable
      aria-pressed={selected}
      onClick={onClick}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-part", part.id);
        e.dataTransfer.effectAllowed = "copy";
        onDragStart(part);
      }}
      onDragEnd={onDragEnd}
      className={`cursor-grab border-l-2 p-3 text-left transition active:cursor-grabbing ${
        selected ? "border-l-signal bg-graphite" : "border-l-transparent bg-ink hover:bg-graphite"
      }`}
    >
      <div className="mb-2 border border-line bg-gradient-to-b from-[#1b2330] to-ink">
        <PartThumb part={part} />
      </div>
      <div className="text-sm font-semibold">{part.name}</div>
      <div className="mt-1 font-mono text-xs text-muted">{stats}</div>
    </button>
  );
}

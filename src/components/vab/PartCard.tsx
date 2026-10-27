"use client";

import type { Part } from "@/types";
import { PartThumb } from "./PartThumb";

interface Props {
  part: Part;
  selected: boolean;
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
      className={`cursor-grab border-b border-r border-line border-l-2 p-3 text-left transition active:cursor-grabbing ${
        selected ? "border-l-signal bg-graphite" : "border-l-transparent bg-ink hover:bg-graphite"
      }`}
    >
      <div className="mb-2 border border-line bg-gradient-to-b from-[#1b2330] to-ink">
        <PartThumb part={part} width={150} height={72} />
      </div>
      <div className="text-sm font-semibold">{part.name}</div>
      <div className="mt-1 font-mono text-xs text-muted">{stats}</div>
    </button>
  );
}

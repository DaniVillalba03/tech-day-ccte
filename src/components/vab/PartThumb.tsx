"use client";

import { useEffect, useRef } from "react";
import { drawPartThumb } from "@/engine/render/partArt";
import type { Part } from "@/types";

/** Miniatura de una pieza dibujada con el mismo arte vectorial que el cohete. */
export function PartThumb({ part, width, height }: { part: Part; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawPartThumb(ctx, part, width, height);
  }, [part, width, height]);
  return <canvas ref={ref} style={{ width: "100%", aspectRatio: `${width} / ${height}` }} aria-hidden />;
}

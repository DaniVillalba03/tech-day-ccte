"use client";

import { type ReactNode, useState } from "react";
import { MAX_TANKS, getPart } from "@/data/parts";
import type { Part, PartCategory, RocketConfig } from "@/types";
import { PartThumb } from "./PartThumb";
import { type Selection, sameSelection } from "./rocketLayout";

const BODY_INDEX = "application/x-body-index";

const icon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);
const Up = () => icon(<path d="M6 15l6-6 6 6" />);
const Down = () => icon(<path d="M6 9l6 6 6-6" />);
const Swap = () => icon(<><path d="M7 4L3 8l4 4" /><path d="M3 8h14" /><path d="M17 20l4-4-4-4" /><path d="M21 16H7" /></>);
const Trash = () => icon(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /><path d="M10 10v6M14 10v6" /></>);
const Grip = () => icon(<><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></>);

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-grid size-8 place-items-center border border-line text-muted transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? "hover:border-signal hover:bg-signal/15 hover:text-signal" : "hover:border-bone hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

interface RowProps {
  part: Part;
  tag: string;
  selected: boolean;
  onSelect: () => void;
  actions: ReactNode;
  draggable?: boolean;
  dropActive?: boolean;
  handlers?: React.HTMLAttributes<HTMLLIElement>;
}

function Row({ part, tag, selected, onSelect, actions, draggable, dropActive, handlers }: RowProps) {
  return (
    <li
      {...handlers}
      draggable={draggable}
      onClick={onSelect}
      className={`flex cursor-pointer items-center gap-2 border-l-2 px-2 py-2 transition ${
        dropActive
          ? "border-l-signal bg-signal/15"
          : selected
            ? "border-l-cobalt bg-[#18202c]"
            : "border-l-transparent bg-ink hover:bg-graphite"
      }`}
    >
      {draggable && (
        <span className="cursor-grab text-muted" title="Arrastra para reordenar">
          <Grip />
        </span>
      )}
      <div className="w-14 shrink-0 border border-line bg-gradient-to-b from-[#1b2330] to-ink">
        <PartThumb part={part} width={56} height={28} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="label !text-[0.6rem]">{tag}</p>
        <p className="truncate text-sm font-semibold" title={part.name}>
          {part.name.replace("Cuerpo KNSB ", "KNSB ")}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">{actions}</div>
    </li>
  );
}

interface Props {
  config: RocketConfig;
  selection: Selection | null;
  /** Pieza del catálogo que se arrastra */
  dragging: Part | null;
  onSelect: (s: Selection | null) => void;
  /** Cambiar una pieza: selecciona su categoría en el catálogo */
  onChange: (kind: PartCategory, index: number) => void;
  onRemoveTank: (index: number) => void;
  onMoveTank: (from: number, to: number) => void;
  onReplaceTank: (index: number, id: string) => void;
  onAddTank: (id: string) => void;
  onAddBody: () => void;
}

/** Esquema del cohete de la ojiva a la cola, con acciones grandes para quitar, mover y cambiar piezas. */
export function AssemblyList(p: Props) {
  const { config, selection } = p;
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [overEnd, setOverEnd] = useState(false);
  const canRemove = config.tankIds.length > 1;
  const full = config.tankIds.length >= MAX_TANKS;
  const draggingTank = p.dragging?.category === "tank";

  const changeBtn = (kind: PartCategory, index: number) => (
    <IconButton label="Cambiar pieza" onClick={() => p.onChange(kind, index)}>
      <Swap />
    </IconButton>
  );

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="label">Estructura</p>
        <p className="text-[0.65rem] text-muted">
          Cuerpos {config.tankIds.length}/{MAX_TANKS}
        </p>
      </div>
      <ul className="divide-y divide-line border border-line">
        <Row
          part={getPart(config.noseId)}
          tag="Ojiva"
          selected={sameSelection(selection, { kind: "nose", index: 0 })}
          onSelect={() => p.onSelect(sameSelection(selection, { kind: "nose", index: 0 }) ? null : { kind: "nose", index: 0 })}
          actions={changeBtn("nose", 0)}
        />

        {config.tankIds.map((id, i) => {
          const sel = { kind: "tank" as const, index: i };
          return (
            <Row
              key={`${id}-${i}`}
              part={getPart(id)}
              tag={`Cuerpo ${i + 1}`}
              selected={sameSelection(selection, sel)}
              onSelect={() => p.onSelect(sameSelection(selection, sel) ? null : sel)}
              draggable
              dropActive={overIndex === i}
              handlers={{
                onDragStart: (e) => {
                  e.dataTransfer.setData(BODY_INDEX, String(i));
                  e.dataTransfer.effectAllowed = "move";
                },
                onDragOver: (e) => {
                  if (!draggingTank && !e.dataTransfer.types.includes(BODY_INDEX)) return;
                  e.preventDefault();
                  setOverIndex(i);
                },
                onDragLeave: () => setOverIndex((v) => (v === i ? null : v)),
                onDrop: (e) => {
                  e.preventDefault();
                  setOverIndex(null);
                  const from = e.dataTransfer.getData(BODY_INDEX);
                  if (from !== "") p.onMoveTank(Number(from), i);
                  else if (p.dragging?.category === "tank") p.onReplaceTank(i, p.dragging.id);
                },
              }}
              actions={
                <>
                  <IconButton label="Subir (hacia la ojiva)" disabled={i === 0} onClick={() => p.onMoveTank(i, i - 1)}>
                    <Up />
                  </IconButton>
                  <IconButton label="Bajar (hacia el motor)" disabled={i === config.tankIds.length - 1} onClick={() => p.onMoveTank(i, i + 1)}>
                    <Down />
                  </IconButton>
                  {changeBtn("tank", i)}
                  <IconButton
                    label={canRemove ? "Quitar cuerpo" : "Debe haber al menos un cuerpo"}
                    danger
                    disabled={!canRemove}
                    onClick={() => p.onRemoveTank(i)}
                  >
                    <Trash />
                  </IconButton>
                </>
              }
            />
          );
        })}

        <li
          onDragOver={(e) => {
            if (!draggingTank || full) return;
            e.preventDefault();
            setOverEnd(true);
          }}
          onDragLeave={() => setOverEnd(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOverEnd(false);
            if (p.dragging?.category === "tank" && !full) p.onAddTank(p.dragging.id);
          }}
        >
          <button
            type="button"
            disabled={full}
            onClick={p.onAddBody}
            className={`w-full border-l-2 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
              overEnd ? "border-l-signal bg-signal/15 text-bone" : "border-l-transparent bg-ink text-muted hover:bg-graphite hover:text-bone"
            }`}
          >
            {full ? `Máximo de ${MAX_TANKS} cuerpos` : "+ Añadir cuerpo (o suelta uno aquí)"}
          </button>
        </li>

        <Row
          part={getPart(config.engineId)}
          tag="Motor"
          selected={sameSelection(selection, { kind: "engine", index: 0 })}
          onSelect={() => p.onSelect(sameSelection(selection, { kind: "engine", index: 0 }) ? null : { kind: "engine", index: 0 })}
          actions={changeBtn("engine", 0)}
        />
        <Row
          part={getPart(config.finId)}
          tag="Aletas"
          selected={sameSelection(selection, { kind: "fin", index: 0 })}
          onSelect={() => p.onSelect(sameSelection(selection, { kind: "fin", index: 0 }) ? null : { kind: "fin", index: 0 })}
          actions={changeBtn("fin", 0)}
        />
      </ul>
      <p className="mt-2 text-[0.7rem] leading-relaxed text-muted">
        Haz clic en una pieza (aquí o en el cohete) para seleccionarla. Arrastra los cuerpos para reordenarlos o suelta
        una pieza del catálogo sobre otra para reemplazarla.
      </p>
    </div>
  );
}

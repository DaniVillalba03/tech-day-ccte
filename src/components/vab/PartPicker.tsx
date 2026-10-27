import type { Part } from "@/types";

interface Props {
  title: string;
  parts: Part[];
  selectedId?: string;
  onSelect: (id: string) => void;
  describe: (p: Part) => string;
}

export function PartPicker({ title, parts, selectedId, onSelect, describe }: Props) {
  return (
    <section>
      <h3 className="eyebrow mb-3">{title}</h3>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        {parts.map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(p.id)}
              className={`border-l-2 p-4 text-left transition ${
                active
                  ? "border-l-signal bg-graphite"
                  : "border-l-transparent bg-ink hover:bg-graphite"
              }`}
            >
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="mt-1 font-mono text-xs text-muted">{describe(p)}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

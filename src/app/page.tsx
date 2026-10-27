import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-[radial-gradient(ellipse_at_80%_20%,#1b2330_0%,var(--color-ink)_60%)]">
      <section className="shell flex flex-1 flex-col justify-center gap-8 py-20">
        <p className="eyebrow">Simulador de cohetería · Experimental</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
          Diseña el cohete.
          <br />
          <span className="text-muted">Valídalo en vuelo.</span>
        </h1>
        <p className="max-w-xl text-lg text-bone/80">
          Ensambla propulsión, tanques, ojiva y aletas; lanza en 2D con física real y compite por el mayor apogeo y la mayor
          distancia.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/vab" className="btn btn-light min-w-56">
            Ir al taller <span aria-hidden>→</span>
          </Link>
          <Link href="/leaderboard" className="btn btn-outline min-w-56">
            Ver ranking <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
      <footer className="border-t border-line">
        <div className="shell flex h-14 items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
          <span>25.2854° S · 57.5940° W</span>
          <span className="hidden sm:inline">Facultad de Ingeniería · Universidad Nacional de Asunción</span>
        </div>
      </footer>
    </main>
  );
}

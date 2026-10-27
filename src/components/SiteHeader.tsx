import Link from "next/link";

const LINKS = [
  { href: "/vab", label: "Taller" },
  { href: "/flight", label: "Vuelo" },
  { href: "/leaderboard", label: "Ranking" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      {/* Franja tricolor (rojo / blanco / azul) */}
      <div className="flex h-[3px]">
        <span className="flex-1 bg-signal" />
        <span className="flex-1 bg-bone" />
        <span className="flex-1 bg-cobalt" />
      </div>
      <div className="shell flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-bone/60 text-sm font-bold">
            ▲
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-[0.12em]">CCTE</span>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Rocket Lab
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-[0.7rem] font-semibold uppercase tracking-[0.14em]">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-bone/80 transition hover:text-bone">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

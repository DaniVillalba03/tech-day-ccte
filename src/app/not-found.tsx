import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell flex flex-1 flex-col items-start justify-center gap-5 py-20">
      <p className="eyebrow">Error 404</p>
      <h1 className="text-5xl font-semibold tracking-tight">Fuera de trayectoria.</h1>
      <p className="max-w-md text-muted">La página que buscas no existe o fue movida.</p>
      <Link href="/" className="btn btn-light">
        Volver al inicio <span aria-hidden>→</span>
      </Link>
    </main>
  );
}

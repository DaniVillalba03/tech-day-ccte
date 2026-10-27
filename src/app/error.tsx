"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell flex flex-1 flex-col items-start justify-center gap-5 py-20">
      <p className="eyebrow">Error inesperado</p>
      <h1 className="text-5xl font-semibold tracking-tight">Algo salió mal.</h1>
      <p className="max-w-md text-muted">Ocurrió un problema al cargar esta página. Puedes intentarlo de nuevo.</p>
      <button type="button" onClick={reset} className="btn btn-light">
        Reintentar <span aria-hidden>→</span>
      </button>
    </main>
  );
}

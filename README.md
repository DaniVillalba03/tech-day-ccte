# Rocket Lab (CCTE)

Simulador y taller de cohetes 2D: ensambla un cohete, lánzalo con física real y compite en el ranking.
Next.js (App Router) · TypeScript · Tailwind CSS · Zustand.

## Scripts

```bash
npm install --legacy-peer-deps
npm run dev      # http://localhost:3000
npm run test     # Vitest
npm run lint
npm run build
```

## Rutas

- `/vab` Taller de ensamblaje · `/flight` Simulador · `/leaderboard` Ranking
- `GET /api/leaderboard?type=apogee|distance&limit=10|50`
- `POST /api/leaderboard` (valida nombres, piezas, rangos y ángulo 15–90)

## Arquitectura

- `src/engine`: física y render en TS puro (sin React). Paso fijo de 1/120 s, Euler semi-implícito, SI.
- React solo lee un snapshot throttled (~100 ms) desde Zustand (`src/store/flightStore.ts`).
- `src/lib/leaderboard`: repositorio intercambiable (`LeaderboardRepository`).

## Persistencia del ranking

Por defecto se usa un archivo JSON local (`.data/leaderboard.json`, ignorado por git). Es solo para
desarrollo: en hosting de solo lectura (p. ej. Vercel) no puede escribir.

Para usar **Supabase**:

1. Ejecuta `supabase/schema.sql` en el SQL Editor de tu proyecto.
2. Copia `.env.example` a `.env.local` y completa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Reinicia el servidor. La service role key solo se usa en el servidor (Route Handlers); nunca la expongas al cliente.

Si la API falla al guardar, el cliente conserva la marca en `localStorage` (`leaderboard-local`).

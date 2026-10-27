# Rocket Lab · CCTE Tech Day

Simulador y taller de cohetes 2D, inspirado en OpenRocket y Kerbal Space Program (versión accesible y arcade).
Diseña un cohete, lánzalo con física real y compite en el ranking de **mayor apogeo** y **mayor distancia horizontal**.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Zustand · Vitest · Supabase (opcional).

## Cómo se juega

1. **Taller (`/vab`)**: elige ojiva, tanques (hasta 4), motor y aletas, y el ángulo inicial (15°–90°). El panel muestra masa, TWR (con alerta si es < 1), tiempo de quemado y Δv.
2. **Vuelo (`/flight`)**: `Enter` lanza · `A`/`D` o `←`/`→` inclinan · `Espacio` abre el paracaídas · `1`/`2`/`3` time warp 1x/2x/5x.
3. **Fin de misión**: resumen con gráficas de altitud y velocidad, y guardado de la marca.
4. **Ranking (`/leaderboard`)**: pestañas por apogeo y por distancia, Top 10 / Top 50.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest
npm run lint
npm run build
```

## Arquitectura

- `src/engine`: física y render en TypeScript puro, sin React. Paso fijo de 1/120 s, Euler semi-implícito, unidades SI (`y = 0` es el suelo).
- La UI solo lee un snapshot de telemetría publicado a ~10 Hz en Zustand (`src/store/flightStore.ts`), por lo que React no re-renderiza a 60 FPS.
- `src/lib/leaderboard`: repositorio intercambiable (`LeaderboardRepository`) con implementación JSON local y Supabase.
- `src/app/api/leaderboard`: `GET ?type=apogee|distance&limit=10|50` y `POST` con validación de nombres, piezas, rangos y ángulo.

### Física

- Gravedad constante 9,81 m/s², densidad `ρ = 1,225·e^(−h/8500)` y arrastre `Fd = ½ρv²·Cd·A`.
- Masa decreciente: `ṁ = T / (Isp·g₀)`; Δv estático `Isp·g₀·ln(m₀/m_f)`.
- Las aletas alinean el cohete con el viento relativo (giro gravitacional) y fijan la velocidad de pitch.

## Persistencia del ranking

Sin configuración, el ranking se guarda en `.data/leaderboard.json` (solo desarrollo; ignorado por git).
En producción usa **Supabase**:

1. Ejecuta `supabase/schema.sql` en el SQL Editor del proyecto (crea la tabla, índices y activa RLS).
2. Define las variables de entorno (ver `.env.example`):

   | Variable | Descripción |
   | --- | --- |
   | `SUPABASE_URL` | URL del proyecto |
   | `SUPABASE_SERVICE_ROLE_KEY` | Clave `service_role` (solo servidor, nunca `NEXT_PUBLIC_`) |

El acceso se hace únicamente desde el servidor; la clave anónima no puede leer ni escribir.

## Despliegue en Vercel

1. Importa el repositorio (framework: Next.js, comandos por defecto).
2. Usa `main` como rama de producción.
3. Añade `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Production y Preview, y redespliega.

## Licencia

Ver [LICENSE](LICENSE).

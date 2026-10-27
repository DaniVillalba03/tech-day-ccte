# Rocket Lab · CCTE Tech Day

Simulador y taller de cohetes 2D, inspirado en OpenRocket y Kerbal Space Program (versión accesible y arcade).
Diseña un cohete, lánzalo con física real y compite en el ranking de **mayor apogeo** y **mayor distancia horizontal**.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Zustand · Vitest · Supabase (opcional).

## Cómo se juega

1. **Taller (`/vab`)**: cohete de una sola etapa. Arrastra las piezas al cohete (o haz clic para seleccionarlas): ojiva, hasta 4 cuerpos de propelente, motor y aletas; y elige el ángulo inicial (15°–90°). El panel muestra masa, TWR (con alerta si es < 1), tiempo de quemado y Δv. Todos los cohetes usan el mismo propelente: **KNSB** (nitrato de potasio + sorbitol, Isp 120 s).
2. **Vuelo (`/flight`)**: `Enter` lanza · `Espacio` abre el paracaídas · `1`/`2`/`3` time warp 1x/2x/5x.
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
- `src/app/api/leaderboard`: `GET ?type=apogee|distance&limit=10|50`, `POST` con validación de nombres, piezas, rangos y ángulo, y `DELETE ?id=<uuid>` (icono de papelera en el ranking; sin autenticación).

### Física

Modelo 2D en SI, integrado con Euler semi-implícito a paso fijo (1/120 s):

- **Atmósfera estándar ISA** (densidad, presión, temperatura y velocidad del sonido hasta 86 km).
- **Gravedad variable** con la altitud, `g = g₀·(R/(R+h))²`.
- **Empuje real**: rampa de encendido, cola de combustión y empuje dependiente de la presión ambiente (`T = T₀ + (p₀ − p)·Aₑ`). Todos los motores usan KNSB (Isp 120 s), `ṁ = T / (Isp·g₀)`.
- **Arrastre** `Fd = ½ρv²·Cd·A` con aumento transónico según el **número de Mach**, y arrastre de flujo cruzado si el cohete se cruza.
- **Viento** con cizalladura (igual para todos los lanzamientos).
- **Estabilidad** con el modelo de Barrowman: centro de presión (ojiva + aletas) y centro de gravedad que cambia al quemar propelente. Dinámica de rotación con momento aerodinámico y amortiguamiento. El taller muestra el **margen estático** (calibres) al lanzamiento y con el propelente agotado: un cohete inestable pierde el control.
- **Riel de lanzamiento** de 6 m (orientación fija), **paracaídas** con apertura gradual que se destruye si se abre con demasiada presión dinámica.

Sin control manual de orientación: el vuelo depende del diseño y del ángulo inicial.

### Gráficos

Todo vectorial y procedimental en canvas: cielo de amanecer con sol y destellos, nubes volumétricas (con niebla al atravesarlas), estrellas y Vía Láctea, terreno con vegetación, playa y océano animado, **curvatura de la Tierra** con halo atmosférico, pluma de escape que cambia con la altitud (discos de choque a baja altura), humo persistente que deriva con el viento, polvo en el despegue, cono de vapor transónico y temblor de cámara.

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

-- Tabla del ranking. Ejecutar en el SQL Editor de Supabase.
create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  pilot_name text not null check (char_length(pilot_name) between 1 and 30),
  rocket_name text not null check (char_length(rocket_name) between 1 and 30),
  apogee double precision not null check (apogee >= 0),
  distance double precision not null check (distance >= 0),
  parts jsonb not null,
  launch_angle_deg double precision not null check (launch_angle_deg between 15 and 90),
  created_at timestamptz not null default now()
);

create index if not exists leaderboard_apogee_idx on public.leaderboard_entries (apogee desc);
create index if not exists leaderboard_distance_idx on public.leaderboard_entries (distance desc);

-- El acceso se hace solo desde el servidor con la service role key (que omite RLS).
-- Activamos RLS sin políticas para que la clave anónima no pueda leer ni escribir.
alter table public.leaderboard_entries enable row level security;

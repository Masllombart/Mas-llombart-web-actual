-- Web pública de Mas Llombart: precios, calendario y presupuestos recibidos.
-- Ejecutar en el SQL Editor de Supabase (mismo proyecto que la intranet) o como migración.
-- Quién puede qué:
--   visitantes (anon)          → leen calendario/precios/catálogo y SOLO insertan presupuestos
--   novios con login (authenticated sin rol) → igual que anon: no ven presupuestos ajenos ni tocan precios
--   personal (app_metadata.rol = 'personal', solo asignable con service_role) → todo

create or replace function public.es_personal() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'rol') = 'personal', false)
$$;

create table if not exists public.web_calendario (
  fecha date primary key,
  tarifa smallint not null check (tarifa between 1 and 4),
  nivel_minimo smallint not null check (nivel_minimo between 0 and 6)
);
create table if not exists public.web_minimos (
  anio int not null, nivel smallint not null check (nivel between 0 and 6),
  importe numeric(10,2) not null check (importe >= 0),
  primary key (anio, nivel)
);
create table if not exists public.web_precios (
  anio int primary key,
  datos jsonb not null,               -- menús por tarifa, infantil, profesional, extras, tasa SGAE
  actualizado timestamptz not null default now()
);
create table if not exists public.web_catalogo (
  id int primary key default 1 check (id = 1),
  datos jsonb not null,               -- menús, platos, extras, canjes, packs, qué incluye
  actualizado timestamptz not null default now()
);
create table if not exists public.presupuestos_web (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  canal text not null check (canal in ('whatsapp','email')),
  nombre text check (char_length(nombre) <= 120),
  telefono text check (char_length(telefono) <= 30),
  email text check (char_length(email) <= 160),
  mensaje text check (char_length(mensaje) <= 2000),
  fecha_boda date,
  adultos int check (adultos between 0 and 400),
  ninos int check (ninos between 0 and 200),
  profesionales int check (profesionales between 0 and 20),
  menu text check (char_length(menu) <= 10),
  total numeric(10,2) check (total between 0 and 500000),
  desglose jsonb check (pg_column_size(desglose) < 20000),
  enlace text check (char_length(enlace) <= 2000),
  estado text not null default 'nuevo' check (estado in ('nuevo','contactado','visita','reservado','descartado')),
  asignado_a text
);
create index if not exists presupuestos_web_creado_idx on public.presupuestos_web (creado desc);

alter table public.web_calendario   enable row level security;
alter table public.web_minimos      enable row level security;
alter table public.web_precios      enable row level security;
alter table public.web_catalogo     enable row level security;
alter table public.presupuestos_web enable row level security;

-- Lectura pública de la configuración
create policy "lectura publica" on public.web_calendario for select to anon, authenticated using (true);
create policy "lectura publica" on public.web_minimos    for select to anon, authenticated using (true);
create policy "lectura publica" on public.web_precios    for select to anon, authenticated using (true);
create policy "lectura publica" on public.web_catalogo   for select to anon, authenticated using (true);
-- Solo el personal edita la configuración
create policy "personal edita" on public.web_calendario for all to authenticated using (public.es_personal()) with check (public.es_personal());
create policy "personal edita" on public.web_minimos    for all to authenticated using (public.es_personal()) with check (public.es_personal());
create policy "personal edita" on public.web_precios    for all to authenticated using (public.es_personal()) with check (public.es_personal());
create policy "personal edita" on public.web_catalogo   for all to authenticated using (public.es_personal()) with check (public.es_personal());
-- Presupuestos: cualquiera inserta (sin poder leer nada), solo el personal lee y gestiona
create policy "insertar presupuesto" on public.presupuestos_web for insert to anon, authenticated
  with check (estado = 'nuevo' and asignado_a is null);
create policy "personal lee"     on public.presupuestos_web for select to authenticated using (public.es_personal());
create policy "personal gestiona" on public.presupuestos_web for update to authenticated using (public.es_personal()) with check (public.es_personal());
create policy "personal borra"   on public.presupuestos_web for delete to authenticated using (public.es_personal());

-- Freno básico contra spam: máx. 20 presupuestos por minuto en total
create or replace function public.limitar_presupuestos() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.presupuestos_web where creado > now() - interval '1 minute') >= 20 then
    raise exception 'Demasiadas solicitudes, inténtalo en un minuto';
  end if;
  return new;
end $$;
drop trigger if exists limitar_presupuestos on public.presupuestos_web;
create trigger limitar_presupuestos before insert on public.presupuestos_web for each row execute function public.limitar_presupuestos();

-- Para dar rol de personal a alguien (desde SQL Editor, con permisos de servicio):
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol":"personal"}' where email = 'javimma39@gmail.com';

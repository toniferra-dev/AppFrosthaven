-- ============================================================================
-- Frosthaven — esquema de la base de datos
-- Autor: Toni Ferrà — https://toniferra.com
--
-- Ejecutar una sola vez en el editor SQL del proyecto de Supabase.
--
-- Aviso: la campaña no tiene cuentas ni login. Las políticas permiten leer y
-- escribir a cualquiera que llegue con la clave anónima, que es pública porque
-- viaja en el código de la página. Lo único que protege la campaña es que la
-- URL no se publique. Es una decisión consciente para un grupo de tres.
-- ============================================================================

-- ---------- Estado global de la campaña (una única fila) ----------
create table if not exists campana (
  id                    smallint primary key default 1,
  estacion              text    not null default 'verano',
  semana                smallint,
  oro                   integer not null default 0,
  inspiracion           integer not null default 0,
  defensa_total         integer not null default 0,
  moral                 smallint not null default 5,
  prosperidad_nivel     smallint not null default 1,
  prosperidad_casillas  integer not null default 0,
  madera                integer not null default 0,
  metal                 integer not null default 0,
  piel                  integer not null default 0,
  plantas               jsonb   not null default '{}'::jsonb,
  soldados              jsonb   not null default '[]'::jsonb,
  soldados_maximo       smallint not null default 0,
  futuros_fichajes      jsonb   not null default '[]'::jsonb,
  pegatinas             jsonb   not null default '[]'::jsonb,
  notas                 text    not null default '',
  actualizado_en        timestamptz not null default now(),
  constraint campana_fila_unica check (id = 1),
  constraint campana_estacion check (estacion in ('verano', 'invierno')),
  constraint campana_moral check (moral between 0 and 20)
);

-- ---------- Personajes ----------
create table if not exists personajes (
  id               uuid primary key default gen_random_uuid(),
  nombre           text    not null default '',
  clase            text    not null,             -- clave del catálogo datos/clases.json
  nivel            smallint not null default 1,
  pv_max           integer not null default 0,
  xp               integer not null default 0,
  retirado         boolean not null default false,
  oro              integer not null default 0,
  madera           integer not null default 0,
  metal            integer not null default 0,
  piel             integer not null default 0,
  plantas          jsonb   not null default '{}'::jsonb,
  marcas           smallint not null default 0,
  mision_personal  jsonb,                        -- { nombre, descripcion, progreso, total }
  objetos          jsonb   not null default '[]'::jsonb,
  pericias         jsonb   not null default '[]'::jsonb,  -- casillas marcadas por pericia del catálogo
  maestrias        jsonb   not null default '[]'::jsonb,
  notas            text    not null default '',
  orden            smallint not null default 0,
  actualizado_en   timestamptz not null default now(),
  constraint personajes_nivel check (nivel between 1 and 9),
  constraint personajes_marcas check (marcas between 0 and 18)
);

-- ---------- Escenarios ----------
create table if not exists escenarios (
  numero      smallint primary key,
  nombre      text    not null,
  estado      text    not null default 'bloqueado',
  fallidos    smallint not null default 0,
  requiere    jsonb   not null default '[]'::jsonb,   -- barco, trineo, escalada
  mision      text,
  notas       text    not null default '',
  constraint escenarios_estado check (estado in ('superado', 'disponible', 'bloqueado'))
);

-- ---------- Edificios ----------
create table if not exists edificios (
  id       uuid primary key default gen_random_uuid(),
  nombre   text    not null,
  nivel    smallint not null default 1,
  estado   text    not null default 'normal',
  detalle  text    not null default '',
  orden    smallint not null default 0,
  constraint edificios_estado check (estado in ('normal', 'danado', 'arrasado'))
);

-- ---------- Calendario ----------
create table if not exists calendario (
  id         uuid primary key default gen_random_uuid(),
  estacion   text     not null,
  semana     smallint not null,
  tachada    boolean  not null default false,
  secciones  jsonb    not null default '[]'::jsonb,
  constraint calendario_estacion check (estacion in ('verano', 'invierno'))
);

-- ---------- Bitácora ----------
-- Registro de lo que va pasando, para poder ver qué cambió tras cada partida.
create table if not exists bitacora (
  id          uuid primary key default gen_random_uuid(),
  creado_en   timestamptz not null default now(),
  tipo        text not null,          -- escenario, evento, construccion, retirada, ajuste
  texto       text not null default '',
  datos       jsonb not null default '{}'::jsonb
);

create index if not exists bitacora_creado_en_idx on bitacora (creado_en desc);

-- ---------- Acceso ----------
-- RLS activo pero con políticas abiertas al rol anónimo: sin cuentas, el
-- control de acceso es que la URL no se comparte fuera del grupo.
alter table campana    enable row level security;
alter table personajes enable row level security;
alter table escenarios enable row level security;
alter table edificios  enable row level security;
alter table calendario enable row level security;
alter table bitacora   enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['campana', 'personajes', 'escenarios', 'edificios', 'calendario', 'bitacora']
  loop
    execute format('drop policy if exists %I on %I', 'acceso_grupo_' || t, t);
    execute format(
      'create policy %I on %I for all to anon, authenticated using (true) with check (true)',
      'acceso_grupo_' || t, t
    );
  end loop;
end $$;

-- ---------- Marca de tiempo automática ----------
create or replace function tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end $$;

drop trigger if exists campana_actualizado_en on campana;
create trigger campana_actualizado_en
  before update on campana
  for each row execute function tocar_actualizado_en();

drop trigger if exists personajes_actualizado_en on personajes;
create trigger personajes_actualizado_en
  before update on personajes
  for each row execute function tocar_actualizado_en();

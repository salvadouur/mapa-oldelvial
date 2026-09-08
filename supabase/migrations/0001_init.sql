-- Duplicar Norte — esquema inicial
--
-- Modelo: `contents` guarda los dos tipos de contenido del sitio —los
-- especiales, georreferenciados sobre la traza (type = 'especial'), y los
-- simples, los videos de ~1 minuto de la serie (type = 'simple').
-- Los bloques de un especial viven en `content_blocks`, con el contenido
-- variable de cada tipo en un jsonb; así se agregan tipos de bloque nuevos sin
-- migrar la base. `rails` y `rail_items` arman las filas del carrusel.
--
-- Lectura pública: solo lo publicado.
-- Escritura: solo los usuarios listados en `backoffice_admins`.

create extension if not exists "pgcrypto";

create type content_type as enum ('especial', 'simple');
create type content_status as enum ('draft', 'published');

/* ------------------------------------------------------------------ */
/* Contenidos                                                          */
/* ------------------------------------------------------------------ */

create table contents (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  type             content_type not null default 'especial',
  status           content_status not null default 'draft',

  title            text not null,
  subtitle         text,
  summary          text,
  cover_url        text,

  -- ID de Vimeo. Admite "123456789" o "123456789/hash" para no listados.
  vimeo_id         text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),

  location_name    text,
  kp               text,
  lat              double precision check (lat is null or lat between -90 and 90),
  lng              double precision check (lng is null or lng between -180 and 180),

  tags             text[] not null default '{}',
  order_index      integer not null default 0,

  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Un especial sin coordenadas no se puede dibujar: se exige el par completo,
  -- o ninguno.
  constraint coordenadas_completas check (num_nulls(lat, lng) <> 1)
);

create index contents_publicados_idx
  on contents (status, order_index)
  where status = 'published';

create index contents_tipo_idx on contents (type);

/* ------------------------------------------------------------------ */
/* Bloques de un especial                                              */
/* ------------------------------------------------------------------ */

create table content_blocks (
  id         uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents (id) on delete cascade,
  type       text not null check (
               type in ('text', 'video', 'gallery', 'sketchfab', 'infographic', 'stats', 'steps')
             ),
  position   integer not null default 0,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index content_blocks_orden_idx on content_blocks (content_id, position);

/* ------------------------------------------------------------------ */
/* Filas del carrusel                                                  */
/* ------------------------------------------------------------------ */

create table rails (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  order_index integer not null default 0,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

create table rail_items (
  rail_id    uuid not null references rails (id) on delete cascade,
  content_id uuid not null references contents (id) on delete cascade,
  position   integer not null default 0,
  primary key (rail_id, content_id)
);

create index rail_items_orden_idx on rail_items (rail_id, position);

/* ------------------------------------------------------------------ */
/* updated_at automático                                               */
/* ------------------------------------------------------------------ */

-- `search_path` vacío a propósito: sin esto la función queda con un search_path
-- mutable y cualquiera que pueda crear objetos en un esquema del path podría
-- secuestrar lo que resuelve. `now()` sigue funcionando porque `pg_catalog`
-- siempre se busca de forma implícita.
create or replace function tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger contents_updated_at
  before update on contents
  for each row execute function tocar_updated_at();

/* ------------------------------------------------------------------ */
/* Quién puede administrar                                             */
/* ------------------------------------------------------------------ */

-- Estar autenticado NO alcanza para escribir: Supabase Auth acepta altas con la
-- clave pública, así que cualquiera podría registrarse. La habilitación es
-- explícita y se carga a mano (ver supabase/INSTALAR.md).
create table backoffice_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table backoffice_admins enable row level security;

-- Cada usuario ve si él está habilitado, y nada más: la lista de quién
-- administra el sitio no tiene por qué ser legible.
create policy "cada uno ve su propia habilitación"
  on backoffice_admins for select
  to authenticated
  using (user_id = (select auth.uid()));

-- En un esquema privado, que PostgREST no publica: una función SECURITY
-- DEFINER no tiene por qué ser parte de la API. SECURITY DEFINER para poder
-- consultar la tabla desde las políticas de las demás sin recursión de RLS.
create schema if not exists private;
revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.backoffice_admins a where a.user_id = (select auth.uid())
  );
$$;

grant execute on function private.es_admin() to authenticated;

/* ------------------------------------------------------------------ */
/* RLS                                                                 */
/* ------------------------------------------------------------------ */

alter table contents       enable row level security;
alter table content_blocks enable row level security;
alter table rails          enable row level security;
alter table rail_items     enable row level security;

-- Lectura pública: únicamente lo publicado. Los borradores no salen del
-- backoffice ni aunque alguien adivine el slug.
create policy "lectura pública de contenidos publicados"
  on contents for select
  to anon, authenticated
  using (status = 'published');

create policy "lectura pública de bloques publicados"
  on content_blocks for select
  to anon, authenticated
  using (
    exists (
      select 1 from contents c
      where c.id = content_blocks.content_id and c.status = 'published'
    )
  );

create policy "lectura pública de filas visibles"
  on rails for select
  to anon, authenticated
  using (visible);

create policy "lectura pública de ítems de fila"
  on rail_items for select
  to anon, authenticated
  using (
    exists (select 1 from rails r where r.id = rail_items.rail_id and r.visible)
  );

create policy "habilitados administran contenidos"
  on contents for all
  to authenticated
  using (private.es_admin()) with check (private.es_admin());

create policy "habilitados administran bloques"
  on content_blocks for all
  to authenticated
  using (private.es_admin()) with check (private.es_admin());

create policy "habilitados administran filas"
  on rails for all
  to authenticated
  using (private.es_admin()) with check (private.es_admin());

create policy "habilitados administran ítems de fila"
  on rail_items for all
  to authenticated
  using (private.es_admin()) with check (private.es_admin());

/* ------------------------------------------------------------------ */
/* Storage: portadas, fotos de galería e infografías                   */
/* ------------------------------------------------------------------ */

-- Dentro de un DO con captura de excepciones a propósito: según el proyecto, el
-- rol del editor SQL puede no ser dueño de `storage.objects`, y un error acá
-- abortaría la migración entera cuando el esquema principal ya se creó bien.
--
-- No se crea política de SELECT: el bucket es público, así que las URLs de los
-- objetos funcionan igual, y una política de lectura amplia además permitiría
-- listar todo el contenido del bucket.
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;

  create policy "habilitados suben media"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'media' and private.es_admin());

  create policy "habilitados reemplazan media"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'media' and private.es_admin());

  create policy "habilitados borran media"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'media' and private.es_admin());

exception
  when duplicate_object then
    raise notice 'Las políticas de storage ya existían: se dejan como estaban.';
  when insufficient_privilege then
    raise warning 'Sin permisos para configurar storage por SQL. Crear a mano el bucket público "media" desde Storage → New bucket.';
end $$;

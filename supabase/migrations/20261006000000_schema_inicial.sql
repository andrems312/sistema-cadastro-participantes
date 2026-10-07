-- =====================================================================
--  Sistema de Cadastro de Participantes — estrutura inicial do banco
--  PostgreSQL / Supabase
--
--  Contém: tipos, tabelas, índices, funções, triggers, políticas RLS
--  e buckets do Supabase Storage. Idempotente onde possível.
--  NÃO contém dados de exemplo (ver supabase/seed.sql — apenas dev).
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_acesso' and typnamespace = 'public'::regnamespace) then
    create type public.tipo_acesso as enum ('admin', 'usuario');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Tabela: usuarios (perfil 1:1 com auth.users)
-- As senhas ficam no Supabase Auth (hash bcrypt) — nunca nesta tabela.
-- ---------------------------------------------------------------------
create table if not exists public.usuarios (
  id               uuid primary key references auth.users (id) on delete cascade,
  nome             text not null check (char_length(btrim(nome)) between 1 and 120),
  email            text not null unique,
  tipo_acesso      public.tipo_acesso not null default 'usuario',
  -- tipo pedido no formulário "Criar acesso"; só vira efetivo após aprovação de um admin
  tipo_solicitado  public.tipo_acesso not null default 'usuario',
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

comment on table public.usuarios is 'Perfil e nível de acesso de cada usuário autenticado.';

-- ---------------------------------------------------------------------
-- Tabela: participantes
-- ---------------------------------------------------------------------
create table if not exists public.participantes (
  id              uuid primary key default gen_random_uuid(),
  -- documento sempre só com dígitos: 11 (CPF) ou 14 (CNPJ)
  cpf_cnpj        text not null unique check (cpf_cnpj ~ '^([0-9]{11}|[0-9]{14})$'),
  tipo_pessoa     text generated always as (case when char_length(cpf_cnpj) = 14 then 'PJ' else 'PF' end) stored,
  nome            text not null check (char_length(btrim(nome)) between 2 and 200),
  razao_social    text check (razao_social is null or char_length(razao_social) <= 200),
  nome_fantasia   text check (nome_fantasia is null or char_length(nome_fantasia) <= 200),
  email           text check (email is null or (char_length(email) <= 200 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  telefone        text check (telefone is null or telefone ~ '^[0-9]{10,11}$'),
  cep             text check (cep is null or cep ~ '^[0-9]{8}$'),
  endereco        text check (endereco is null or char_length(endereco) <= 200),
  numero          text check (numero is null or char_length(numero) <= 20),
  complemento     text check (complemento is null or char_length(complemento) <= 100),
  bairro          text check (bairro is null or char_length(bairro) <= 100),
  cidade          text check (cidade is null or char_length(cidade) <= 100),
  estado          text check (estado is null or estado in (
                    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
                    'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
  categoria       text not null default 'Outro' check (char_length(categoria) between 2 and 60),
  latitude        double precision check (latitude is null or latitude between -90 and 90),
  longitude       double precision check (longitude is null or longitude between -180 and 180),
  imagem_url      text check (imagem_url is null or char_length(imagem_url) <= 1000),
  imagem_path     text check (imagem_path is null or char_length(imagem_path) <= 500),
  observacoes     text check (observacoes is null or char_length(observacoes) <= 2000),
  criado_por      uuid references public.usuarios (id) on delete set null,
  atualizado_por  uuid references public.usuarios (id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  constraint participantes_lat_lng_juntos check ((latitude is null) = (longitude is null))
);

comment on table public.participantes is 'Participantes / empresas cadastrados.';

create index if not exists participantes_criado_em_idx on public.participantes (criado_em desc);
create index if not exists participantes_categoria_idx on public.participantes (categoria);
create index if not exists participantes_estado_idx on public.participantes (estado);
create index if not exists participantes_tipo_pessoa_idx on public.participantes (tipo_pessoa);
create index if not exists participantes_criado_por_idx on public.participantes (criado_por);
-- índices trigram para busca parcial (ILIKE '%termo%') rápida
create index if not exists participantes_nome_trgm_idx on public.participantes using gin (nome extensions.gin_trgm_ops);
create index if not exists participantes_razao_trgm_idx on public.participantes using gin (razao_social extensions.gin_trgm_ops);
create index if not exists participantes_fantasia_trgm_idx on public.participantes using gin (nome_fantasia extensions.gin_trgm_ops);
create index if not exists participantes_cidade_trgm_idx on public.participantes using gin (cidade extensions.gin_trgm_ops);
create index if not exists participantes_doc_trgm_idx on public.participantes using gin (cpf_cnpj extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Tabela: configuracoes (linha única, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.configuracoes (
  id                smallint primary key default 1 check (id = 1),
  nome_organizacao  text not null default 'Cadastro de Participantes' check (char_length(nome_organizacao) between 2 and 80),
  logo_url          text,
  logo_path         text,
  atualizado_por    uuid references public.usuarios (id) on delete set null,
  atualizado_em     timestamptz not null default now()
);

insert into public.configuracoes (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and tipo_acesso = 'admin'
  );
$$;

comment on function public.is_admin is 'true se o usuário autenticado for administrador.';

-- Resumo para o dashboard (contagens agregadas; não expõe dados de usuários)
create or replace function public.resumo_dashboard()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select case when auth.uid() is null then null else json_build_object(
    'total_participantes', (select count(*) from public.participantes),
    'total_empresas',      (select count(*) from public.participantes where tipo_pessoa = 'PJ'),
    'total_pessoas',       (select count(*) from public.participantes where tipo_pessoa = 'PF'),
    'total_usuarios',      (select count(*) from public.usuarios),
    'com_localizacao',     (select count(*) from public.participantes where latitude is not null),
    'ultimos_30_dias',     (select count(*) from public.participantes where criado_em >= now() - interval '30 days'),
    'por_categoria',       (select coalesce(json_agg(c), '[]'::json) from (
                              select categoria, count(*) as total
                              from public.participantes
                              group by categoria
                              order by total desc, categoria
                              limit 6
                            ) c)
  ) end;
$$;

revoke all on function public.resumo_dashboard() from public, anon;
grant execute on function public.resumo_dashboard() to authenticated;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

-- Cria o perfil em public.usuarios quando alguém se cadastra no Auth.
-- Regras de nível de acesso (segurança):
--   * raw_app_meta_data.tipo_acesso só pode ser definido com a service_role
--     (painel do administrador) → é respeitado;
--   * o primeiro usuário do sistema vira administrador;
--   * os demais entram como "usuario". O tipo pedido no formulário público
--     (raw_user_meta_data, controlado pelo cliente) fica em tipo_solicitado
--     e precisa ser aprovado por um administrador.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome       text;
  v_tipo       public.tipo_acesso;
  v_solicitado public.tipo_acesso;
begin
  perform pg_advisory_xact_lock(hashtext('public.usuarios.primeiro_admin'));

  v_nome := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1));
  v_solicitado := case when new.raw_user_meta_data ->> 'tipo_solicitado' = 'admin'
                       then 'admin'::public.tipo_acesso else 'usuario'::public.tipo_acesso end;

  if new.raw_app_meta_data ->> 'tipo_acesso' in ('admin', 'usuario') then
    v_tipo := (new.raw_app_meta_data ->> 'tipo_acesso')::public.tipo_acesso;
  elsif not exists (select 1 from public.usuarios) then
    v_tipo := 'admin';
  else
    v_tipo := 'usuario';
  end if;

  insert into public.usuarios (id, nome, email, tipo_acesso, tipo_solicitado)
  values (new.id, left(v_nome, 120), new.email, v_tipo, v_solicitado);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém o e-mail do perfil sincronizado com o Auth
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.usuarios set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- Protege campos sensíveis do perfil e garante ao menos 1 administrador
create or replace function public.proteger_usuarios()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    -- usuário comum só pode alterar o próprio nome
    if auth.uid() is not null and not public.is_admin() then
      if new.tipo_acesso is distinct from old.tipo_acesso
         or new.tipo_solicitado is distinct from old.tipo_solicitado
         or new.email is distinct from old.email
         or new.id is distinct from old.id then
        raise exception 'Você não tem permissão para alterar estes dados.' using errcode = '42501';
      end if;
    end if;

    if old.tipo_acesso = 'admin' and new.tipo_acesso <> 'admin'
       and not exists (select 1 from public.usuarios where tipo_acesso = 'admin' and id <> old.id) then
      raise exception 'O sistema precisa ter pelo menos um administrador.' using errcode = 'P0001';
    end if;

    new.atualizado_em := now();
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.tipo_acesso = 'admin'
       and not exists (select 1 from public.usuarios where tipo_acesso = 'admin' and id <> old.id) then
      raise exception 'Não é possível excluir o último administrador.' using errcode = 'P0001';
    end if;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists usuarios_proteger on public.usuarios;
create trigger usuarios_proteger
  before update or delete on public.usuarios
  for each row execute function public.proteger_usuarios();

-- Auditoria automática de participantes (quem criou / alterou / quando)
create or replace function public.participantes_auditoria()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.criado_por := auth.uid();
    end if;
    new.atualizado_por := new.criado_por;
    new.criado_em := now();
    new.atualizado_em := now();
  else
    new.criado_por := old.criado_por;
    new.criado_em := old.criado_em;
    new.atualizado_por := coalesce(auth.uid(), new.atualizado_por);
    new.atualizado_em := now();
  end if;
  return new;
end;
$$;

drop trigger if exists participantes_auditoria on public.participantes;
create trigger participantes_auditoria
  before insert or update on public.participantes
  for each row execute function public.participantes_auditoria();

create or replace function public.configuracoes_auditoria()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  new.atualizado_por := coalesce(auth.uid(), new.atualizado_por);
  return new;
end;
$$;

drop trigger if exists configuracoes_auditoria on public.configuracoes;
create trigger configuracoes_auditoria
  before update on public.configuracoes
  for each row execute function public.configuracoes_auditoria();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.usuarios      enable row level security;
alter table public.participantes enable row level security;
alter table public.configuracoes enable row level security;

-- usuarios ---------------------------------------------------------------
drop policy if exists "usuarios: ver o próprio perfil ou admin vê todos" on public.usuarios;
create policy "usuarios: ver o próprio perfil ou admin vê todos"
  on public.usuarios for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "usuarios: atualizar o próprio perfil ou admin" on public.usuarios;
create policy "usuarios: atualizar o próprio perfil ou admin"
  on public.usuarios for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));
-- INSERT: somente via trigger handle_new_user. DELETE: somente via service_role (exclusão no Auth).

-- participantes -----------------------------------------------------------
drop policy if exists "participantes: autenticados visualizam" on public.participantes;
create policy "participantes: autenticados visualizam"
  on public.participantes for select to authenticated
  using (true);

drop policy if exists "participantes: autenticados cadastram" on public.participantes;
create policy "participantes: autenticados cadastram"
  on public.participantes for insert to authenticated
  with check (criado_por = (select auth.uid()));

drop policy if exists "participantes: autenticados editam" on public.participantes;
create policy "participantes: autenticados editam"
  on public.participantes for update to authenticated
  using (true)
  with check (true);

drop policy if exists "participantes: somente admin exclui" on public.participantes;
create policy "participantes: somente admin exclui"
  on public.participantes for delete to authenticated
  using ((select public.is_admin()));

-- configuracoes (leitura pública: a logo aparece na tela de login) ---------
drop policy if exists "configuracoes: leitura pública" on public.configuracoes;
create policy "configuracoes: leitura pública"
  on public.configuracoes for select to anon, authenticated
  using (true);

drop policy if exists "configuracoes: somente admin altera" on public.configuracoes;
create policy "configuracoes: somente admin altera"
  on public.configuracoes for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Privilégios de tabela (o RLS filtra as linhas)
grant select on public.configuracoes to anon;
grant select, update on public.configuracoes to authenticated;
grant select, update on public.usuarios to authenticated;
grant select, insert, update, delete on public.participantes to authenticated;

-- ---------------------------------------------------------------------
-- Supabase Storage: buckets e políticas
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('participantes', 'participantes', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('branding',      'branding',      true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Imagens de participantes: caminho "<uid>/<arquivo>"
drop policy if exists "participantes img: autenticados leem" on storage.objects;
create policy "participantes img: autenticados leem"
  on storage.objects for select to authenticated
  using (bucket_id = 'participantes');

drop policy if exists "participantes img: envio na própria pasta" on storage.objects;
create policy "participantes img: envio na própria pasta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'participantes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Pode excluir: o dono do arquivo, um admin, ou arquivos que não estão mais
-- vinculados a nenhum participante (imagem substituída/removida por outro usuário).
drop policy if exists "participantes img: exclusão controlada" on storage.objects;
create policy "participantes img: exclusão controlada"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'participantes'
    and (
      owner_id = (select auth.uid())::text
      or (select public.is_admin())
      or not exists (select 1 from public.participantes p where p.imagem_path = storage.objects.name)
    )
  );

-- Logo do sistema: somente administradores escrevem
drop policy if exists "branding: autenticados leem" on storage.objects;
create policy "branding: autenticados leem"
  on storage.objects for select to authenticated
  using (bucket_id = 'branding');

drop policy if exists "branding: admin envia" on storage.objects;
create policy "branding: admin envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and (select public.is_admin()));

drop policy if exists "branding: admin atualiza" on storage.objects;
create policy "branding: admin atualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'branding' and (select public.is_admin()))
  with check (bucket_id = 'branding' and (select public.is_admin()));

drop policy if exists "branding: admin exclui" on storage.objects;
create policy "branding: admin exclui"
  on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Permissões explícitas das funções (projetos novos podem não conceder por padrão)
-- ---------------------------------------------------------------------
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Perfis de quem se cadastrou ANTES desta migração
-- (o trigger on_auth_user_created só vale para novos cadastros).
-- Se ainda não houver administrador, o cadastro mais antigo vira administrador.
-- ---------------------------------------------------------------------
insert into public.usuarios (id, nome, email, tipo_acesso, tipo_solicitado)
select
  u.id,
  left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'nome'), ''), split_part(u.email, '@', 1)), 120),
  u.email,
  case
    when u.raw_app_meta_data ->> 'tipo_acesso' in ('admin', 'usuario')
      then (u.raw_app_meta_data ->> 'tipo_acesso')::public.tipo_acesso
    when not exists (select 1 from public.usuarios where tipo_acesso = 'admin')
         and u.id = (select id from auth.users where email is not null order by created_at limit 1)
      then 'admin'::public.tipo_acesso
    else 'usuario'::public.tipo_acesso
  end,
  case when u.raw_user_meta_data ->> 'tipo_solicitado' = 'admin'
       then 'admin'::public.tipo_acesso else 'usuario'::public.tipo_acesso end
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- =====================================================================
--  Teste manual das permissões (RLS, triggers e Storage)
--  Use SOMENTE no banco LOCAL de desenvolvimento (supabase start):
--    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/permissoes.sql
--  Tudo roda dentro de uma transação desfeita no final (ROLLBACK).
--  Compare cada resultado com o "esperado" impresso antes do comando.
-- =====================================================================
\set ON_ERROR_STOP 0
\set ON_ERROR_ROLLBACK on
begin;
\pset footer off
-- Users
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values ('aaaaaaaa-0000-0000-0000-000000000001','a@x.com','{"tipo_acesso":"admin"}','{"nome":"Admin A"}');
insert into auth.users (id, email, raw_user_meta_data) values ('bbbbbbbb-0000-0000-0000-000000000002','b@x.com','{"nome":"User B","tipo_solicitado":"admin"}');
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values ('cccccccc-0000-0000-0000-000000000003','c@x.com','{"tipo_acesso":"admin"}','{"nome":"Admin C"}');
\echo '== perfis criados (A=admin via app_metadata, B=usuario que solicitou admin, C=admin via app_metadata)'
select email, tipo_acesso, tipo_solicitado from public.usuarios where email like '_@x.com' order by email;

insert into public.participantes (cpf_cnpj, nome, cidade, estado, categoria) values ('90000001000129','Teste (Exemplo)','São Paulo','SP','Empresa') on conflict (cpf_cnpj) do nothing;

-- ===== Usuário comum B =====
set role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-0000-0000-000000000002', false);
\echo '== B vê apenas o próprio perfil (esperado 1)'
select count(*) from public.usuarios;
\echo '== B tenta virar admin (esperado ERRO)'
update public.usuarios set tipo_acesso='admin' where id='bbbbbbbb-0000-0000-0000-000000000002';
\echo '== B altera o próprio nome (esperado UPDATE 1)'
\set QUIET 0
update public.usuarios set nome='User B2' where id='bbbbbbbb-0000-0000-0000-000000000002';
\echo '== B tenta alterar perfil de A (esperado UPDATE 0)'
update public.usuarios set nome='hack' where id='aaaaaaaa-0000-0000-0000-000000000001';
\echo '== B cadastra participante tentando forjar criado_por=A (esperado criado_por=B)'
insert into public.participantes (cpf_cnpj, nome, categoria, criado_por) values ('52998224725','Teste B','Outro','aaaaaaaa-0000-0000-0000-000000000001') returning criado_por, tipo_pessoa;
\echo '== B edita participante (esperado UPDATE 1)'
update public.participantes set observacoes='editado por B' where cpf_cnpj='90000001000129';
\echo '== B tenta excluir participante (esperado DELETE 0)'
delete from public.participantes where cpf_cnpj='90000001000129';
\echo '== B tenta alterar configuracoes (esperado UPDATE 0)'
update public.configuracoes set nome_organizacao='Hack';
\echo '== B lê resumo do dashboard'
select public.resumo_dashboard();
\echo '== B envia imagem na própria pasta (esperado INSERT 1)'
insert into storage.objects (bucket_id, name) values ('participantes','bbbbbbbb-0000-0000-0000-000000000002/foto.jpg');
\echo '== B envia imagem na pasta de A (esperado ERRO RLS)'
insert into storage.objects (bucket_id, name) values ('participantes','aaaaaaaa-0000-0000-0000-000000000001/foto.jpg');
\echo '== B envia logo (esperado ERRO RLS)'
insert into storage.objects (bucket_id, name) values ('branding','logo.png');
\echo '== B dado inválido: CPF com letras (esperado ERRO check)'
insert into public.participantes (cpf_cnpj, nome) values ('abc','X');
\echo '== B CPF duplicado (esperado ERRO unique)'
insert into public.participantes (cpf_cnpj, nome) values ('90000001000129','Dup');
reset role;

-- ===== Admin A =====
set role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001', false);
\echo '== A vê todos os usuários (esperado >= 3)'
select count(*) from public.usuarios;
\echo '== A promove B (esperado UPDATE 1)'
update public.usuarios set tipo_acesso='admin' where id='bbbbbbbb-0000-0000-0000-000000000002';
update public.usuarios set tipo_acesso='usuario' where id='bbbbbbbb-0000-0000-0000-000000000002';
\echo '== A exclui participante (esperado DELETE 1)'
delete from public.participantes where cpf_cnpj='52998224725';
\echo '== A altera configuracoes (esperado UPDATE 1)'
update public.configuracoes set nome_organizacao='Minha Org';
\echo '== A envia logo (esperado INSERT 1)'
insert into storage.objects (bucket_id, name) values ('branding','logo.png');
\echo '== A rebaixa C (ok) e tenta rebaixar a si mesmo (ERRO apenas se A for o último admin)'
update public.usuarios set tipo_acesso='usuario' where id='cccccccc-0000-0000-0000-000000000003';
update public.usuarios set tipo_acesso='usuario' where id='aaaaaaaa-0000-0000-0000-000000000001';
reset role;

\echo '== Exclusão do admin A pelo Auth (ERRO apenas se A for o último admin)'
delete from auth.users where id='aaaaaaaa-0000-0000-0000-000000000001';
\echo '== Exclusão de usuário comum C pelo Auth (esperado DELETE 1, participantes mantidos)'
delete from auth.users where id='cccccccc-0000-0000-0000-000000000003';

-- ===== Anônimo =====
set role anon;
select set_config('request.jwt.claim.sub','', false);
\echo '== anon lê configuracoes (esperado Minha Org)'
select nome_organizacao from public.configuracoes;
\echo '== anon lê participantes (esperado ERRO de permissão ou 0 linhas)'
select count(*) from public.participantes;
\echo '== anon resumo_dashboard (esperado ERRO permissão)'
select public.resumo_dashboard();
reset role;
\echo '== atualizado_por/atualizado_em preenchidos'
select cpf_cnpj, atualizado_por is not null as tem_atualizado_por from public.participantes where cpf_cnpj='90000001000129';

rollback;

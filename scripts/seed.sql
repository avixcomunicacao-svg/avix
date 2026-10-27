-- ============================================================================
-- Avix · dados de exemplo (fase 1) — pode rodar mais de uma vez
-- Cria mentor + 3 membros direto no Auth (senhas abaixo), trilhas, módulos e 2 aulas em rascunho
-- ============================================================================
create extension if not exists pgcrypto;

create or replace function public._avix_seed_user(p_email text, p_password text, p_name text, p_role text)
returns uuid language plpgsql security definer as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(p_email);
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, is_sso_user)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', lower(p_email),
      crypt(p_password, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name, 'role', p_role), now(), now(), '', '', '', '', false);
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', lower(p_email), 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), raw_user_meta_data = jsonb_build_object('name', p_name, 'role', p_role) where id = v_id;
  end if;
  insert into public.users (id, email, name, role) values (v_id, lower(p_email), p_name, p_role::public.user_role)
    on conflict (id) do update set name = excluded.name, role = excluded.role;
  return v_id;
end $$;

do $$
declare
  v_admin uuid; v_carla uuid; v_rafael uuid; v_juliana uuid;
  t_mkt uuid; t_vendas uuid; t_tec uuid; m1 uuid;
begin
  -- Mentor
  v_admin := public._avix_seed_user('mentor@avix.local', 'avix-mentor-2026', 'Mentor Avix', 'admin');

  -- Trilhas
  insert into public.tracks (name, slug, description, "order") values
    ('Marketing','marketing','Posicionamento, oferta, conteúdo e tráfego para atrair as pessoas certas.',0),
    ('Vendas','vendas','Do primeiro contato ao fechamento: roteiro, objeções e acompanhamento.',1),
    ('Tecnologia','tecnologia','Ferramentas que fazem marketing e vendas rodarem sem depender de você.',2)
  on conflict (slug) do update set description = excluded.description;
  select id into t_mkt from public.tracks where slug='marketing';
  select id into t_vendas from public.tracks where slug='vendas';
  select id into t_tec from public.tracks where slug='tecnologia';

  -- Módulos (só se a trilha ainda não tiver)
  if not exists (select 1 from public.modules where track_id = t_mkt) then
    insert into public.modules (track_id, title, "order") values (t_mkt,'Fundamentos',0),(t_mkt,'Oferta e posicionamento',1),(t_mkt,'Conteúdo e tráfego',2);
  end if;
  if not exists (select 1 from public.modules where track_id = t_vendas) then
    insert into public.modules (track_id, title, "order") values (t_vendas,'Fundamentos',0),(t_vendas,'Roteiro e objeções',1),(t_vendas,'Follow-up e fechamento',2);
  end if;
  if not exists (select 1 from public.modules where track_id = t_tec) then
    insert into public.modules (track_id, title, "order") values (t_tec,'Fundamentos',0),(t_tec,'CRM e automação',1),(t_tec,'Dados e integrações',2);
  end if;

  -- Aulas de exemplo (rascunho, sem vídeo)
  select id into m1 from public.modules where track_id = t_mkt order by "order" limit 1;
  if not exists (select 1 from public.lessons where module_id = m1) then
    insert into public.lessons (module_id, title, description, "order", status) values
      (m1,'Boas-vindas à trilha de Marketing','Como esta trilha funciona e o que você deve fazer depois de cada aula.',0,'rascunho'),
      (m1,'Oferta irresistível','Como transformar o que você vende numa oferta que o cliente entende em 10 segundos: promessa, prova e condição.',1,'rascunho');
  end if;

  -- Membros
  v_carla   := public._avix_seed_user('carla@exemplo.com.br',   'avix-aluno-2026', 'Carla Mendes',    'membro');
  v_rafael  := public._avix_seed_user('rafael@exemplo.com.br',  'avix-aluno-2026', 'Rafael Teixeira', 'membro');
  v_juliana := public._avix_seed_user('juliana@exemplo.com.br', 'avix-aluno-2026', 'Juliana Prado',   'membro');

  insert into public.member_profiles (user_id, whatsapp_e164, goals, access_start, access_end, status, onboarding_done, consent_accepted_at, invite_sent_at, last_seen_at) values
    (v_carla,  '+5527999990001','Dobrar os agendamentos da clínica até março com tráfego pago e uma oferta clara.', current_date-30, current_date+150, 'ativo', true,  now(), now(), now()-interval '1 day'),
    (v_rafael, '+5527999990002','Estruturar o roteiro de vendas e parar de depender de indicação.',                  current_date-10, current_date+170, 'ativo', false, null,  now(), null),
    (v_juliana,'+5527999990003', null,                                                                                 current_date-200,current_date-20,  'expirado', true, now(), now(), now()-interval '25 days')
  on conflict (user_id) do update set status = excluded.status, access_start = excluded.access_start, access_end = excluded.access_end, onboarding_done = excluded.onboarding_done;

  insert into public.member_availability (member_id, weekdays, hours_per_week) values
    (v_carla,'[1,2,3,5]',6),(v_rafael,'[1,2,3,4,5]',4),(v_juliana,'[2,4]',3) on conflict do nothing;

  delete from public.member_tracks where member_id in (v_carla, v_rafael, v_juliana);
  insert into public.member_tracks (member_id, track_id) values (v_carla,t_mkt),(v_carla,t_vendas),(v_rafael,t_vendas),(v_juliana,t_mkt),(v_juliana,t_tec);

  if not exists (select 1 from public.announcements) then
    insert into public.announcements (title, body, created_by) values ('Bem-vindos','A plataforma está no ar. As aulas serão publicadas a partir das mentorias em grupo. Qualquer dúvida, me chame no WhatsApp.', v_admin);
  end if;
end $$;

drop function public._avix_seed_user(text, text, text, text);

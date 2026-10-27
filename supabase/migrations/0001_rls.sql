-- ============================================================================
-- Avix · Segurança em nível de linha (RLS) e funções auxiliares
-- Regra: o membro só enxerga (a) conteúdo das trilhas dele, liberado;
--        (b) os próprios registros. O admin enxerga tudo.
-- O service role (usado só em server actions do admin) ignora RLS.
-- ============================================================================

-- ---------- Funções auxiliares ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin');
$$;

create or replace function public.member_is_active(p_member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.member_profiles mp
    where mp.user_id = p_member
      and mp.status = 'ativo'
      and current_date between mp.access_start and mp.access_end
  );
$$;

create or replace function public.member_has_track(p_member uuid, p_track uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.member_tracks mt where mt.member_id = p_member and mt.track_id = p_track);
$$;

-- Aula liberada para o membro: publicada + (sem regra | data passou | dias desde entrada passaram)
create or replace function public.lesson_released_for(p_member uuid, p_lesson uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.member_profiles mp on mp.user_id = p_member
    where l.id = p_lesson
      and l.status = 'publicada'
      and public.member_has_track(p_member, m.track_id)
      and (l.release_at is null or l.release_at <= now())
      and (l.release_after_days is null or mp.access_start + l.release_after_days <= current_date)
  );
$$;

-- ---------- Espelho de auth.users → public.users ----------
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'membro')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------- updated_at automático ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- Linha única de settings ----------
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.users enable row level security;
alter table public.member_profiles enable row level security;
alter table public.member_availability enable row level security;
alter table public.external_ids enable row level security;
alter table public.tracks enable row level security;
alter table public.member_tracks enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_materials enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.ratings enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_session_participants enable row level security;
alter table public.recordings enable row level security;
alter table public.transcripts enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.meeting_minutes enable row level security;
alter table public.action_plans enable row level security;
alter table public.action_items enable row level security;
alter table public.action_item_events enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.announcements enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.outbox_events enable row level security;
alter table public.oauth_tokens enable row level security;

-- Admin: tudo, em todas as tabelas
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format('create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ---------- users ----------
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users for select to authenticated using (id = auth.uid());
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = 'membro');

-- ---------- member_profiles (notes_private nunca sai pela view de membro) ----------
drop policy if exists profile_self_read on public.member_profiles;
create policy profile_self_read on public.member_profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists profile_self_update on public.member_profiles;
create policy profile_self_update on public.member_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Colunas que o membro não pode alterar ficam protegidas por trigger:
create or replace function public.guard_member_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.notes_private := old.notes_private;
    new.access_start := old.access_start;
    new.access_end := old.access_end;
    new.status := old.status;
    new.whatsapp_e164 := old.whatsapp_e164;
    new.is_made_client := old.is_made_client;
    new.invite_sent_at := old.invite_sent_at;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_member_profile_update on public.member_profiles;
create trigger guard_member_profile_update before update on public.member_profiles
  for each row execute function public.guard_member_profile_update();

-- View segura para o membro (sem notes_private)
create or replace view public.member_profile_me with (security_invoker = true) as
  select user_id, whatsapp_e164, goals, access_start, access_end, status, onboarding_done,
         consent_accepted_at, agenda_time, agenda_channels, timezone, last_seen_at
  from public.member_profiles;

drop policy if exists availability_self on public.member_availability;
create policy availability_self on public.member_availability for all to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

-- ---------- Conteúdo ----------
drop policy if exists tracks_member_read on public.tracks;
create policy tracks_member_read on public.tracks for select to authenticated
  using (public.member_is_active(auth.uid()) and public.member_has_track(auth.uid(), id));

drop policy if exists member_tracks_self_read on public.member_tracks;
create policy member_tracks_self_read on public.member_tracks for select to authenticated
  using (member_id = auth.uid());

drop policy if exists modules_member_read on public.modules;
create policy modules_member_read on public.modules for select to authenticated
  using (public.member_is_active(auth.uid()) and public.member_has_track(auth.uid(), track_id));

drop policy if exists lessons_member_read on public.lessons;
create policy lessons_member_read on public.lessons for select to authenticated
  using (public.member_is_active(auth.uid()) and public.lesson_released_for(auth.uid(), id));

drop policy if exists materials_member_read on public.lesson_materials;
create policy materials_member_read on public.lesson_materials for select to authenticated
  using (public.member_is_active(auth.uid()) and public.lesson_released_for(auth.uid(), lesson_id));

drop policy if exists progress_self on public.lesson_progress;
create policy progress_self on public.lesson_progress for all to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid() and public.lesson_released_for(auth.uid(), lesson_id));

drop policy if exists ratings_self on public.ratings;
create policy ratings_self on public.ratings for all to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

-- ---------- Mentorias ao vivo ----------
-- Membro vê sessões em grupo da trilha dele e individuais em que participa
drop policy if exists live_sessions_member_read on public.live_sessions;
create policy live_sessions_member_read on public.live_sessions for select to authenticated
  using (
    public.member_is_active(auth.uid()) and (
      (type = 'grupo' and track_id is not null and public.member_has_track(auth.uid(), track_id))
      or exists (select 1 from public.live_session_participants p where p.session_id = id and p.member_id = auth.uid())
    )
  );
drop policy if exists participants_self_read on public.live_session_participants;
create policy participants_self_read on public.live_session_participants for select to authenticated
  using (member_id = auth.uid());
drop policy if exists recordings_member_read on public.recordings;
create policy recordings_member_read on public.recordings for select to authenticated
  using (
    public.member_is_active(auth.uid()) and exists (
      select 1 from public.live_sessions s
      where s.id = session_id and (
        (s.type = 'grupo' and visibility = 'grupo' and s.track_id is not null and public.member_has_track(auth.uid(), s.track_id))
        or exists (select 1 from public.live_session_participants p where p.session_id = s.id and p.member_id = auth.uid())
      )
    )
  );
drop policy if exists transcripts_member_read on public.transcripts;
create policy transcripts_member_read on public.transcripts for select to authenticated
  using (
    public.member_is_active(auth.uid()) and (
      (source_type = 'live_session' and exists (
        select 1 from public.live_sessions s where s.id = source_id and (
          (s.type = 'grupo' and s.track_id is not null and public.member_has_track(auth.uid(), s.track_id))
          or exists (select 1 from public.live_session_participants p where p.session_id = s.id and p.member_id = auth.uid())
        )))
      or (source_type = 'whatsapp_audio' and exists (
        select 1 from public.whatsapp_messages w where w.transcript_id = id and w.member_id = auth.uid()))
    )
  );
drop policy if exists segments_member_read on public.transcript_segments;
create policy segments_member_read on public.transcript_segments for select to authenticated
  using (exists (select 1 from public.transcripts t where t.id = transcript_id));

-- ---------- WhatsApp, atas e plano: só o próprio ----------
drop policy if exists wa_self_read on public.whatsapp_messages;
create policy wa_self_read on public.whatsapp_messages for select to authenticated using (member_id = auth.uid());
drop policy if exists conv_self_read on public.conversation_sessions;
create policy conv_self_read on public.conversation_sessions for select to authenticated using (member_id = auth.uid());
drop policy if exists minutes_self_read on public.meeting_minutes;
create policy minutes_self_read on public.meeting_minutes for select to authenticated
  using (publish_status = 'publicada' and (
    member_id = auth.uid()
    or (member_id is null and source_type = 'live_session' and exists (
      select 1 from public.live_sessions s where s.id = source_id and s.type = 'grupo' and s.track_id is not null and public.member_has_track(auth.uid(), s.track_id)))
  ));
drop policy if exists plans_self_read on public.action_plans;
create policy plans_self_read on public.action_plans for select to authenticated
  using (member_id = auth.uid() and publish_status = 'publicada');
drop policy if exists items_self_read on public.action_items;
create policy items_self_read on public.action_items for select to authenticated using (member_id = auth.uid());
drop policy if exists items_self_update on public.action_items;
create policy items_self_update on public.action_items for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());
drop policy if exists items_self_insert on public.action_items;
create policy items_self_insert on public.action_items for insert to authenticated
  with check (member_id = auth.uid() and is_suggested = false);
drop policy if exists item_events_self on public.action_item_events;
create policy item_events_self on public.action_item_events for all to authenticated
  using (exists (select 1 from public.action_items i where i.id = item_id and i.member_id = auth.uid()))
  with check (exists (select 1 from public.action_items i where i.id = item_id and i.member_id = auth.uid()));

-- ---------- Notificações e avisos ----------
drop policy if exists notif_self on public.notifications;
create policy notif_self on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notif_pref_self on public.notification_preferences;
create policy notif_pref_self on public.notification_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists announcements_member_read on public.announcements;
create policy announcements_member_read on public.announcements for select to authenticated
  using (public.member_is_active(auth.uid()) and (expires_at is null or expires_at > now())
    and (track_id is null or public.member_has_track(auth.uid(), track_id)));

-- Settings: membro lê só o que é público (marca e número do mentor) via view
create or replace view public.settings_public with (security_invoker = false) as
  select brand, mentor_whatsapp_e164 from public.settings where id = 1;
grant select on public.settings_public to authenticated;
grant select on public.member_profile_me to authenticated;

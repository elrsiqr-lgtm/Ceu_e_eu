-- Entre o Céu e Eu — schema inicial
-- Rode no SQL Editor do Supabase (ou `supabase db push`).

-- ============ memórias ============
create table public.memories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date        date not null,
  photo_path  text not null,
  thumb_path  text not null,
  source      text not null check (source in ('camera', 'galeria')),
  question    text not null check (char_length(question) <= 300),
  answer      text not null default '' check (char_length(answer) <= 10000),
  question2   text check (char_length(question2) <= 300),
  answer2     text check (char_length(answer2) <= 10000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date),                                  -- uma memória por usuário e data
  check (photo_path like user_id::text || '/%'),           -- arquivos só na pasta do dono
  check (thumb_path like user_id::text || '/%')
);

alter table public.memories enable row level security;
create policy memories_select on public.memories for select to authenticated using (user_id = auth.uid());
create policy memories_insert on public.memories for insert to authenticated with check (user_id = auth.uid());
create policy memories_update on public.memories for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy memories_delete on public.memories for delete to authenticated using (user_id = auth.uid());

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger memories_touch before update on public.memories
  for each row execute function public.touch_updated_at();

-- ============ configurações / lembrete ============
create table public.user_settings (
  user_id        uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  remind         boolean not null default false,
  remind_time    time not null default '18:00',
  timezone       text not null default 'America/Sao_Paulo',
  last_reminded  date
);

-- impede um fuso inválido de quebrar o envio de lembretes de todos
create function public.check_timezone() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'Fuso horário inválido: %', new.timezone;
  end if;
  return new;
end $$;
create trigger user_settings_tz before insert or update of timezone on public.user_settings
  for each row execute function public.check_timezone();

alter table public.user_settings enable row level security;
create policy settings_select on public.user_settings for select to authenticated using (user_id = auth.uid());
create policy settings_insert on public.user_settings for insert to authenticated with check (user_id = auth.uid());
create policy settings_update on public.user_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ inscrições Web Push (uma por aparelho) ============
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
create index on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy push_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_update on public.push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());

-- ============ quem deve receber lembrete agora ============
-- Chamada só pela Edge Function (service_role). Janela de 3 h a partir do horário escolhido,
-- para não disparar um lembrete tardio e fora de hora. Não avisa se o dia já foi registrado.
create function public.due_reminders()
returns table (user_id uuid, local_date date)
language sql stable security definer set search_path = public as $$
  select s.user_id, t.l::date
  from public.user_settings s
  cross join lateral (select now() at time zone s.timezone as l) t
  where s.remind
    and t.l >= t.l::date + s.remind_time
    and t.l <  t.l::date + s.remind_time + interval '3 hours'
    and s.last_reminded is distinct from t.l::date
    and not exists (select 1 from public.memories m where m.user_id = s.user_id and m.date = t.l::date)
    and exists (select 1 from public.push_subscriptions p where p.user_id = s.user_id);
$$;
revoke all on function public.due_reminders() from public, anon, authenticated;
grant execute on function public.due_reminders() to service_role;

-- ============ Storage: bucket privado, só JPEG, até 1 MB ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('skies', 'skies', false, 1048576, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg'];

create policy skies_select on storage.objects for select to authenticated
  using (bucket_id = 'skies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy skies_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'skies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy skies_update on storage.objects for update to authenticated
  using (bucket_id = 'skies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy skies_delete on storage.objects for delete to authenticated
  using (bucket_id = 'skies' and (storage.foldername(name))[1] = auth.uid()::text);

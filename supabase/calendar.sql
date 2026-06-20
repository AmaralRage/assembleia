create extension if not exists pgcrypto;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  event_date date not null check (event_date >= current_date),
  event_time time,
  location text not null default '',
  description text not null default ''
    check (char_length(description) <= 180),
  category text not null default 'especial'
    check (category in ('especial', 'culto', 'jovens', 'reuniao')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_event_date_idx
  on public.calendar_events (event_date);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calendar_events_description_length_check'
      and conrelid = 'public.calendar_events'::regclass
  ) then
    alter table public.calendar_events
      add constraint calendar_events_description_length_check
      check (char_length(description) <= 180) not valid;
  end if;
end;
$$;

create or replace function public.is_calendar_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = 'amaralaragao31@gmail.com';
$$;

revoke all on function public.is_calendar_admin() from public;
grant execute on function public.is_calendar_admin() to anon, authenticated;

create or replace function public.set_calendar_event_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_calendar_event_updated_at on public.calendar_events;
create trigger set_calendar_event_updated_at
before update on public.calendar_events
for each row execute function public.set_calendar_event_updated_at();

alter table public.calendar_events enable row level security;

revoke all on public.calendar_events from anon, authenticated;
grant select on public.calendar_events to anon, authenticated;
grant insert, update, delete on public.calendar_events to authenticated;

drop policy if exists "Eventos são públicos" on public.calendar_events;
create policy "Eventos são públicos"
on public.calendar_events
for select
to anon, authenticated
using (true);

drop policy if exists "Somente admin cria eventos" on public.calendar_events;
create policy "Somente admin cria eventos"
on public.calendar_events
for insert
to authenticated
with check (
  public.is_calendar_admin()
  and created_by = auth.uid()
  and event_date >= current_date
);

drop policy if exists "Somente admin atualiza eventos" on public.calendar_events;
create policy "Somente admin atualiza eventos"
on public.calendar_events
for update
to authenticated
using (public.is_calendar_admin())
with check (
  public.is_calendar_admin()
  and created_by = auth.uid()
  and event_date >= current_date
);

drop policy if exists "Somente admin exclui eventos" on public.calendar_events;
create policy "Somente admin exclui eventos"
on public.calendar_events
for delete
to authenticated
using (public.is_calendar_admin());

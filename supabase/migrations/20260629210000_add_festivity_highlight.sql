alter table public.calendar_events
  add column if not exists highlight_home boolean not null default false,
  add column if not exists highlight_until date,
  add column if not exists highlight_image_url text not null default '',
  add column if not exists highlight_summary text not null default '';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'calendar_events_category_check'
      and conrelid = 'public.calendar_events'::regclass
  ) then
    alter table public.calendar_events
      drop constraint calendar_events_category_check;
  end if;

  alter table public.calendar_events
    add constraint calendar_events_category_check
    check (category in ('especial', 'culto', 'jovens', 'reuniao', 'festividade'));
end;
$$;

create index if not exists calendar_events_highlight_idx
  on public.calendar_events (highlight_home, highlight_until, event_date)
  where category = 'festividade';

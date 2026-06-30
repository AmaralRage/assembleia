drop index if exists public.calendar_events_highlight_idx;

create index if not exists calendar_events_highlight_idx
  on public.calendar_events (highlight_home, highlight_until, event_date)
  where category in ('especial', 'festividade');

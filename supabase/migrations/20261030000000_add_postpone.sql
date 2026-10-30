-- Posticipo attività: contatore e data originale
alter table public.tasks
  add column if not exists postponed_count integer not null default 0,
  add column if not exists original_date date;

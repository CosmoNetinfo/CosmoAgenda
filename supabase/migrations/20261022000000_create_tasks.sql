-- Migrazione Orbita Agent (Agenda Cosmonet)
-- Tabella principale per le attivita

create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  notes text,
  date date not null,
  time time,
  kind text not null default 'altro',
  project text,
  priority text not null default 'normale' check (priority in ('bassa', 'normale', 'alta')),
  repeat_rule text,
  subtasks jsonb not null default '[]'::jsonb,
  status text not null default 'todo' check (status in ('todo', 'done', 'skipped')),
  done_at timestamptz,
  created_by text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indici per prestazioni ottimali su query per data e utente
create index if not exists tasks_user_date_idx on public.tasks(user_id, date);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);

-- Trigger per aggiornare updated_at e sincronizzare done_at
create or replace function public.handle_task_timestamps()
returns trigger as $$
begin
  new.updated_at = now();
  if new.status = 'done' and old.status <> 'done' and new.done_at is null then
    new.done_at = now();
  elsif new.status <> 'done' and old.status = 'done' then
    new.done_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_timestamps_trigger on public.tasks;
create trigger tasks_timestamps_trigger
  before update on public.tasks
  for each row execute function public.handle_task_timestamps();

-- Abilitazione Row Level Security (RLS)
alter table public.tasks enable row level security;

-- Policy di lettura: l'utente vede solo le proprie attivita
create policy "Gli utenti possono visualizzare i propri task"
  on public.tasks for select
  using (auth.uid() = user_id);

-- Policy di inserimento: l'utente puo inserire solo con il proprio user_id
create policy "Gli utenti possono inserire i propri task"
  on public.tasks for insert
  with check (auth.uid() = user_id);

-- Policy di aggiornamento: l'utente puo modificare solo i propri task
create policy "Gli utenti possono modificare i propri task"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy di eliminazione: l'utente puo eliminare solo i propri task
create policy "Gli utenti possono eliminare i propri task"
  on public.tasks for delete
  using (auth.uid() = user_id);

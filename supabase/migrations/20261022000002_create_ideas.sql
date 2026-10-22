-- Migrazione per la sezione "Idee e link"
-- Tabella: ideas

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  url text not null,
  title text,
  note text,
  project text not null default 'articolo-cosmonet' check (project in ('articolo-cosmonet', 'vignetta', 'lo-sapevi-che', 'altro')),
  status text not null default 'nuova' check (status in ('nuova', 'in_lavorazione', 'pronta', 'scartata')),
  task_id uuid references public.tasks(id) on delete set null,
  created_by text not null default 'user' check (created_by in ('user', 'claude')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indici per prestazioni ottimali
create index if not exists ideas_user_id_idx on public.ideas(user_id);
create index if not exists ideas_user_status_idx on public.ideas(user_id, status);
create index if not exists ideas_user_url_idx on public.ideas(user_id, url);

-- Trigger per aggiornamento updated_at
create or replace function public.handle_ideas_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ideas_updated_at_trigger on public.ideas;
create trigger ideas_updated_at_trigger
  before update on public.ideas
  for each row execute function public.handle_ideas_updated_at();

-- Abilitazione Row Level Security (RLS)
alter table public.ideas enable row level security;

-- Policy di lettura: l'utente vede solo le proprie idee
create policy "Gli utenti possono visualizzare le proprie idee"
  on public.ideas for select
  using (auth.uid() = user_id);

-- Policy di inserimento: l'utente inserisce solo con il proprio user_id
create policy "Gli utenti possono inserire le proprie idee"
  on public.ideas for insert
  with check (auth.uid() = user_id);

-- Policy di modifica: l'utente modifica solo le proprie idee
create policy "Gli utenti possono modificare le proprie idee"
  on public.ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy di eliminazione: l'utente elimina solo le proprie idee
create policy "Gli utenti possono eliminare le proprie idee"
  on public.ideas for delete
  using (auth.uid() = user_id);

-- Migrazione per la gestione dei file Markdown (.md) allegati alle attività
-- Tabella: task_files

create table if not exists public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  name text not null check (name like '%.md'),
  content_md text not null check (octet_length(content_md) <= 204800), -- Limite di 200 KB per file, solo testo
  created_by text not null default 'user' check (created_by in ('user', 'claude')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indice per ricerca rapida file per attività
create index if not exists task_files_task_id_idx on public.task_files(task_id);

-- Trigger per updated_at
create or replace function public.handle_task_files_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists task_files_updated_at_trigger on public.task_files;
create trigger task_files_updated_at_trigger
  before update on public.task_files
  for each row execute function public.handle_task_files_updated_at();

-- Abilitazione Row Level Security (RLS)
alter table public.task_files enable row level security;

-- Policy di lettura: l'utente autenticato legge solo i file dei propri task
create policy "Gli utenti possono visualizzare i file dei propri task"
  on public.task_files for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Policy di inserimento: l'utente puo allegare file solo ai propri task
create policy "Gli utenti possono inserire file nei propri task"
  on public.task_files for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Policy di modifica: l'utente puo modificare i file dei propri task
create policy "Gli utenti possono modificare i file dei propri task"
  on public.task_files for update
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id
      and tasks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Policy di eliminazione: l'utente puo eliminare i file dei propri task
create policy "Gli utenti possono eliminare i file dei propri task"
  on public.task_files for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id
      and tasks.user_id = auth.uid()
    )
  );

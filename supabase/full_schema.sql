-- ============================================================
-- SCHEMA COMPLETO ORBITA AGENT (AGENDA COSMONET)
-- Esegui questo script nel SQL Editor del tuo progetto Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. TABELLA: tasks (Attività dell'agenda)
-- ------------------------------------------------------------
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

create index if not exists tasks_user_date_idx on public.tasks(user_id, date);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);

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

alter table public.tasks enable row level security;

drop policy if exists "Gli utenti possono visualizzare i propri task" on public.tasks;
create policy "Gli utenti possono visualizzare i propri task"
  on public.tasks for select using (auth.uid() = user_id);

drop policy if exists "Gli utenti possono inserire i propri task" on public.tasks;
create policy "Gli utenti possono inserire i propri task"
  on public.tasks for insert with check (auth.uid() = user_id);

drop policy if exists "Gli utenti possono modificare i propri task" on public.tasks;
create policy "Gli utenti possono modificare i propri task"
  on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Gli utenti possono eliminare i propri task" on public.tasks;
create policy "Gli utenti possono eliminare i propri task"
  on public.tasks for delete using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 2. TABELLA: task_files (Allegati Markdown .md)
-- ------------------------------------------------------------
create table if not exists public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  name text not null check (name like '%.md'),
  content_md text not null check (octet_length(content_md) <= 204800), -- Limite 200 KB
  created_by text not null default 'user' check (created_by in ('user', 'claude')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_files_task_id_idx on public.task_files(task_id);

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

alter table public.task_files enable row level security;

drop policy if exists "Gli utenti possono visualizzare i file dei propri task" on public.task_files;
create policy "Gli utenti possono visualizzare i file dei propri task"
  on public.task_files for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Gli utenti possono inserire file nei propri task" on public.task_files;
create policy "Gli utenti possono inserire file nei propri task"
  on public.task_files for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Gli utenti possono modificare i file dei propri task" on public.task_files;
create policy "Gli utenti possono modificare i file dei propri task"
  on public.task_files for update
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id and tasks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Gli utenti possono eliminare i file dei propri task" on public.task_files;
create policy "Gli utenti possono eliminare i file dei propri task"
  on public.task_files for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_files.task_id and tasks.user_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- 3. TABELLA: ideas (Idee e Link)
-- ------------------------------------------------------------
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

create index if not exists ideas_user_id_idx on public.ideas(user_id);
create index if not exists ideas_user_status_idx on public.ideas(user_id, status);
create index if not exists ideas_user_url_idx on public.ideas(user_id, url);

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

alter table public.ideas enable row level security;

drop policy if exists "Gli utenti possono visualizzare le proprie idee" on public.ideas;
create policy "Gli utenti possono visualizzare le proprie idee"
  on public.ideas for select using (auth.uid() = user_id);

drop policy if exists "Gli utenti possono inserire le proprie idee" on public.ideas;
create policy "Gli utenti possono inserire le proprie idee"
  on public.ideas for insert with check (auth.uid() = user_id);

drop policy if exists "Gli utenti possono modificare le proprie idee" on public.ideas;
create policy "Gli utenti possono modificare le proprie idee"
  on public.ideas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Gli utenti possono eliminare le proprie idee" on public.ideas;
create policy "Gli utenti possono eliminare le proprie idee"
  on public.ideas for delete using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 4. TABELLA: push_subscriptions (Sottoscrizioni Web Push)
-- ------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subs_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Gli utenti possono gestire le proprie sottoscrizioni push" on public.push_subscriptions;
create policy "Gli utenti possono gestire le proprie sottoscrizioni push"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

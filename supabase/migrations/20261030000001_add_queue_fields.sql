-- Coda di pubblicazione: stato, link dell'articolo e testo per i social
alter table public.tasks
  add column if not exists pub_status text check (pub_status in ('da_preparare', 'pronto', 'pubblicato')),
  add column if not exists link text,
  add column if not exists social_text text;

create index if not exists tasks_user_pub_status_idx on public.tasks(user_id, pub_status);

-- DevSpace keeps each person's projects and ideas as one document: the app already works on the
-- whole list at once, and the newest copy wins when phone and PC both changed it.
create table if not exists public.devspace_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  -- When the app last changed it, in milliseconds, as the app counts time (not when it was saved).
  updated_at bigint not null default 0,
  saved_at timestamptz not null default now()
);

alter table public.devspace_state enable row level security;

-- Only you can see or change your own row. auth.uid() is wrapped in a select so it runs once.
create policy "read own devspace" on public.devspace_state
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "add own devspace" on public.devspace_state
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "change own devspace" on public.devspace_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- No delete policy: deleting your account removes the row (on delete cascade).

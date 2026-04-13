create extension if not exists "pgcrypto";

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  email text not null check (char_length(trim(email)) > 0),
  company text not null check (char_length(trim(company)) > 0),
  stage text not null default 'lead' check (stage in ('lead', 'contacted', 'qualified', 'trial_demo', 'closed')),
  notes text,
  stage_changed_at timestamptz not null default timezone('utc'::text, now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_customers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_customers_updated_at();

alter table public.customers enable row level security;

drop policy if exists "Users can read their own customers" on public.customers;
drop policy if exists "Users can insert their own customers" on public.customers;
drop policy if exists "Users can update their own customers" on public.customers;
drop policy if exists "Users can delete their own customers" on public.customers;

create policy "Users can read their own customers"
on public.customers
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own customers"
on public.customers
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own customers"
on public.customers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own customers"
on public.customers
for delete
to authenticated
using (auth.uid() = user_id);

-- full history of stage moves — stage_changed_at only tracks the latest one
create table if not exists public.stage_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_stage text check (from_stage in ('lead', 'contacted', 'qualified', 'trial_demo', 'closed')),
  to_stage text not null check (to_stage in ('lead', 'contacted', 'qualified', 'trial_demo', 'closed')),
  changed_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.stage_history enable row level security;

drop policy if exists "Users can read their own stage history" on public.stage_history;
drop policy if exists "Users can insert their own stage history" on public.stage_history;

create policy "Users can read their own stage history"
on public.stage_history for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own stage history"
on public.stage_history for insert
to authenticated
with check (auth.uid() = user_id);

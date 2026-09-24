create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 160),
  business_type text not null check (char_length(business_type) between 2 and 100),
  need text not null check (char_length(need) between 20 and 1200),
  budget text not null,
  urgency text not null,
  status text not null default 'processing'
    check (status in ('processing', 'qualified', 'review', 'nurture', 'archived')),
  score integer check (score between 0 and 100),
  category text,
  summary text,
  recommended_service text,
  next_action text,
  draft_reply text,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_email_idx on public.leads (lower(email));

alter table public.leads enable row level security;

-- The browser never talks directly to this table. All access goes through
-- Next.js server routes using the service role key, which must remain secret.
revoke all on public.leads from anon, authenticated;

-- Create bids table
create table if not exists public.bids (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete cascade not null,
  bidder_id uuid references auth.users(id) on delete cascade not null,
  amount decimal(10,2) not null check (amount > 0),
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz default now() not null,
  expires_at timestamptz not null,
  updated_at timestamptz default now() not null
);

-- Add column to locations table to track if location accepts bids
alter table public.locations add column if not exists accepts_bids boolean default false;

-- Create indexes for efficient queries
create index if not exists idx_bids_location on public.bids(location_id);
create index if not exists idx_bids_bidder on public.bids(bidder_id);
create index if not exists idx_bids_expires on public.bids(expires_at);
create index if not exists idx_bids_status on public.bids(status);
create index if not exists idx_locations_accepts_bids on public.locations(accepts_bids) where accepts_bids = true;

-- Enable RLS
alter table public.bids enable row level security;

-- RLS Policy: Bidders can see their own bids
create policy "Users can view their own bids"
  on public.bids for select
  using (auth.uid() = bidder_id);

-- RLS Policy: Location owners can see all bids on their locations
create policy "Location owners can view bids on their locations"
  on public.bids for select
  using (
    exists (
      select 1 from public.locations
      where locations.id = bids.location_id
      and locations.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create bids on public locations that accept bids
create policy "Users can create bids on public locations"
  on public.bids for insert
  with check (
    exists (
      select 1 from public.locations
      where locations.id = location_id
      and locations.visibility = 'public'
      and locations.accepts_bids = true
      and locations.user_id != auth.uid() -- Can't bid on own location
      and locations.expires_at > now() -- Location must not be expired
    )
  );

-- RLS Policy: Users can update their own pending bids (amount and message only)
create policy "Users can update their own pending bids"
  on public.bids for update
  using (auth.uid() = bidder_id and status = 'pending')
  with check (auth.uid() = bidder_id and status = 'pending');

-- RLS Policy: Location owners can update bid status
create policy "Location owners can update bid status"
  on public.bids for update
  using (
    exists (
      select 1 from public.locations
      where locations.id = bids.location_id
      and locations.user_id = auth.uid()
    )
  );

-- Function to automatically set expires_at to 24 hours from creation
create or replace function public.set_bid_expiration()
returns trigger as $$
begin
  -- Set expires_at to 24 hours from now if not provided
  if new.expires_at is null then
    new.expires_at := now() + interval '24 hours';
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to set expires_at before insert
create trigger set_bid_expiration_trigger
  before insert on public.bids
  for each row
  execute function public.set_bid_expiration();

-- Function to update updated_at timestamp
create or replace function public.update_bid_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update updated_at on update
create trigger update_bid_updated_at_trigger
  before update on public.bids
  for each row
  execute function public.update_bid_updated_at();

-- Function to automatically expire bids after 24 hours
create or replace function public.expire_old_bids()
returns void as $$
begin
  update public.bids
  set status = 'expired'
  where status = 'pending'
  and expires_at < now();
end;
$$ language plpgsql security definer;

-- Note: You may want to set up a cron job or scheduled task to call expire_old_bids()
-- For example, using pg_cron extension:
-- SELECT cron.schedule('expire-bids', '*/5 * * * *', 'SELECT public.expire_old_bids()');

-- Grant permissions
grant select, insert, update on public.bids to authenticated;
grant select on public.bids to anon;

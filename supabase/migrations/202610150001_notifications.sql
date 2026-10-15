-- Device subscriptions are private; only the authenticated owner can manage them.
create table public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  delivery_token uuid not null default gen_random_uuid(),
  time_zone text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_devices enable row level security;
create policy "read own notification devices" on public.notification_devices for select to authenticated using (auth.uid() = user_id);
create policy "insert own notification devices" on public.notification_devices for insert to authenticated with check (auth.uid() = user_id);
create policy "update own notification devices" on public.notification_devices for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own notification devices" on public.notification_devices for delete to authenticated using (auth.uid() = user_id);

create table public.notification_deliveries (
  device_id uuid not null references public.notification_devices(id) on delete cascade,
  notification_id text not null,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key(device_id, notification_id)
);
alter table public.notification_deliveries enable row level security;
-- Only server jobs may claim deliveries. A lease allows a failed push to retry.
create function public.claim_notification(device uuid, notification text) returns boolean
language plpgsql security definer set search_path = public as $$
declare claimed uuid;
begin
  insert into notification_deliveries(device_id, notification_id) values(device, notification)
  on conflict(device_id, notification_id) do update set claimed_at = now()
  where notification_deliveries.sent_at is null and notification_deliveries.claimed_at < now() - interval '30 seconds'
  returning device_id into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_notification(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_notification(uuid,text) to service_role;

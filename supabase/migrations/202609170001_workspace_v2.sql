-- Versioned workspace document. Ownership is checked both by RLS and the write RPC.
create table public.life_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint workspace_object check (jsonb_typeof(data) = 'object')
);
alter table public.life_workspaces enable row level security;
create policy "read own workspace" on public.life_workspaces for select to authenticated using (auth.uid() = user_id);

create or replace function public.save_life_workspace(payload jsonb, expected_revision bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare result_revision bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 5000000 then raise exception 'Invalid workspace'; end if;
  insert into public.life_workspaces(user_id, data, revision)
    values (auth.uid(), payload, 1)
    on conflict (user_id) do update set data = excluded.data,
      revision = life_workspaces.revision + 1, updated_at = now()
      where life_workspaces.revision = expected_revision
    returning revision into result_revision;
  if result_revision is null then raise exception 'Workspace changed in another session'; end if;
  update public.profiles set onboarding_completed = coalesce((payload->>'onboarded')::boolean, false),
    display_name = payload->>'name', theme = lower(payload->>'theme'), updated_at = now() where id = auth.uid();
  return result_revision;
end;
$$;
revoke all on function public.save_life_workspace(jsonb, bigint) from public;
grant execute on function public.save_life_workspace(jsonb, bigint) to authenticated;

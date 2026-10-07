insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

create table if not exists public.journal_entry_photos (
  id uuid primary key default uuid_generate_v4(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (journal_entry_id, storage_path)
);

alter table public.journal_entry_photos enable row level security;

drop policy if exists "journal photo owner access" on public.journal_entry_photos;
create policy "journal photo owner access"
on public.journal_entry_photos
for all
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.journal_entries
    where journal_entries.id = journal_entry_photos.journal_entry_id
    and journal_entries.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.journal_entries
    where journal_entries.id = journal_entry_photos.journal_entry_id
    and journal_entries.user_id = auth.uid()
  )
);

drop policy if exists "journal photos are private" on storage.objects;
create policy "journal photos are private"
on storage.objects for all
using (
  bucket_id = 'journal-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'journal-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

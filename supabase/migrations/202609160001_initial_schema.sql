create extension if not exists "uuid-ossp";

create type public.life_pillar as enum (
  'financial',
  'physical',
  'mental_emotional',
  'social',
  'spiritual',
  'personal_growth'
);

create type public.task_status as enum ('pending', 'in_progress', 'completed');
create type public.priority_level as enum ('low', 'medium', 'high');
create type public.habit_direction as enum ('build', 'quit');
create type public.journal_type as enum ('morning', 'evening', 'gratitude', 'prayer', 'reflection', 'monthly_review', 'brain_dump');
create type public.finance_entry_type as enum ('income', 'expense', 'savings', 'investment', 'giving');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  primary_currency text not null default 'ZAR',
  theme text not null default 'ocean',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.onboarding_responses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  assessment jsonb not null default '{}',
  priority_pillars life_pillar[] not null default '{}',
  build_habits text[] not null default '{}',
  quit_habits text[] not null default '{}',
  future_identity text,
  vision_statement text,
  long_term_goals jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  due_time time,
  priority priority_level not null default 'medium',
  pillar life_pillar not null,
  status task_status not null default 'pending',
  notes text,
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_blocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  pillar life_pillar,
  task_id uuid references public.tasks(id) on delete set null,
  reminder_minutes integer,
  created_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  direction habit_direction not null default 'build',
  pillar life_pillar,
  target_per_week integer not null default 7,
  quit_date date,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  logged_on date not null default current_date,
  completed boolean not null default true,
  relapse_notes text,
  unique (habit_id, logged_on)
);

create table public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  horizon text not null check (horizon in ('annual', 'quarterly', 'monthly')),
  pillars life_pillar[] not null,
  progress integer not null default 0 check (progress between 0 and 100),
  target_date date,
  created_at timestamptz not null default now()
);

create table public.focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_type text not null,
  focus_minutes integer not null,
  break_minutes integer not null,
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_type journal_type not null,
  prompts jsonb not null default '{}',
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_type finance_entry_type not null,
  category text not null,
  amount numeric(12,2) not null,
  currency text not null default 'ZAR',
  occurred_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  duration_minutes integer,
  warmup_notes text,
  notes text,
  performed_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  sets integer,
  reps integer,
  weight_target numeric(8,2),
  rest_seconds integer,
  notes text
);

create table public.spiritual_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_type text not null check (note_type in ('bible_study', 'reading_plan', 'prayer_list', 'prayer_journal', 'scripture_note')),
  title text not null,
  body text,
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  birthday date,
  notes text,
  connection_goal text,
  follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.pillar_ratings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pillar life_pillar not null,
  rating integer not null check (rating between 1 and 10),
  rated_month date not null,
  notes text,
  unique (user_id, pillar, rated_month)
);

alter table public.profiles enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_blocks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.goals enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.finance_entries enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.spiritual_notes enable row level security;
alter table public.relationships enable row level security;
alter table public.pillar_ratings enable row level security;

create policy "profiles are private" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "onboarding owner access" on public.onboarding_responses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks owner access" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar owner access" on public.calendar_blocks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits owner access" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit logs owner access" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals owner access" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "focus owner access" on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal owner access" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance owner access" on public.finance_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts owner access" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "spiritual owner access" on public.spiritual_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "relationships owner access" on public.relationships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pillar ratings owner access" on public.pillar_ratings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercise rows follow workout ownership"
on public.workout_exercises
for all
using (
  exists (
    select 1 from public.workouts
    where workouts.id = workout_exercises.workout_id
    and workouts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workouts
    where workouts.id = workout_exercises.workout_id
    and workouts.user_id = auth.uid()
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('vision-board', 'vision-board', false)
on conflict (id) do nothing;

create policy "vision board files are private"
on storage.objects for all
using (
  bucket_id = 'vision-board'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'vision-board'
  and auth.uid()::text = (storage.foldername(name))[1]
);

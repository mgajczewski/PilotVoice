-- migration: initial_schema
-- description: sets up the initial database schema for pilotvoice, including tables, roles, functions, triggers, and rls policies.
-- tables_affected: profiles, competitions, surveys, survey_responses
-- remarks: this is the foundational schema for the application.

-- step 1: define custom types
-- create a user_role enum type to distinguish between different user access levels.
create type public.user_role as enum ('user', 'moderator', 'super_admin');

-- step 2: create application tables
-- these tables form the core structure of the pilotvoice application.

-- profiles table
-- stores user-specific data, extending the supabase auth.users table.
-- a trigger will automatically create a profile for each new user.
create table public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role user_role not null default 'user',
    civl_id integer,
    registration_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- add comments to the columns of the profiles table for clarity.
comment on table public.profiles is 'user profiles extending auth.users.';
comment on column public.profiles.user_id is 'foreign key to the supabase auth user.';
comment on column public.profiles.role is 'the role of the user in the system.';
comment on column public.profiles.civl_id is 'user''s optional civl id.';
comment on column public.profiles.registration_reason is 'user''s optional reason for registration.';

-- competitions table
-- stores information about paragliding competitions.
create table public.competitions (
    id integer primary key generated always as identity,
    name text not null,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    city text not null,
    country_code char(3) not null,
    tasks_count integer check (tasks_count >= 0),
    participant_count integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (ends_at > starts_at)
);
-- add comments to the columns of the competitions table for clarity.
comment on table public.competitions is 'paragliding competition events.';
comment on column public.competitions.name is 'name of the competition.';
comment on column public.competitions.starts_at is 'start date and time of the competition.';
comment on column public.competitions.ends_at is 'end date and time of the competition.';
comment on column public.competitions.country_code is 'country code (iso 3166-1 alpha-3).';

-- surveys table
-- defines the surveys associated with competitions. for mvp, each competition will have one survey.
create table public.surveys (
    id integer primary key generated always as identity,
    competition_id integer not null references competitions(id) on delete cascade,
    opens_at timestamptz,
    closes_at timestamptz,
    slug text unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (closes_at is null or opens_at is null or closes_at > opens_at)
);
-- add comments to the columns of the surveys table for clarity.
comment on table public.surveys is 'surveys associated with competitions.';
comment on column public.surveys.competition_id is 'foreign key to the associated competition.';
comment on column public.surveys.opens_at is 'date and time when the survey becomes active.';
comment on column public.surveys.closes_at is 'date and time when the survey closes.';
comment on column public.surveys.slug is 'optional user-friendly url slug.';

-- survey_responses table
-- stores responses submitted by pilots for each survey.
create table public.survey_responses (
    id bigint primary key generated always as identity,
    survey_id integer not null references surveys(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    overall_rating integer check (overall_rating >= 1 and overall_rating <= 10),
    open_feedback text,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (survey_id, user_id)
);
-- add comments to the columns of the survey_responses table for clarity.
comment on table public.survey_responses is 'pilot responses to surveys.';
comment on column public.survey_responses.overall_rating is 'overall rating (1-10).';
comment on column public.survey_responses.open_feedback is 'anonymized open-ended feedback from the user.';
comment on column public.survey_responses.completed_at is 'timestamp when mandatory fields were completed.';

-- step 3: create indexes
-- create indexes to improve query performance on frequently accessed columns.=
-- add indexes on foreign keys for performance
create index surveys_competition_id_idx on public.surveys (competition_id);
create index survey_responses_survey_id_idx on public.survey_responses (survey_id);
create index survey_responses_user_id_idx on public.survey_responses (user_id);

-- step 4: create functions and triggers
-- these functions and triggers automate tasks like updating timestamps and creating user profiles.

-- function to update the updated_at column
create or replace function public.moddatetime()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- triggers to automatically update the updated_at column on row modification.
create trigger handle_updated_at before update on public.profiles 
  for each row execute function public.moddatetime();
create trigger handle_updated_at before update on public.competitions 
  for each row execute function public.moddatetime();
create trigger handle_updated_at before update on public.surveys 
  for each row execute function public.moddatetime();
create trigger handle_updated_at before update on public.survey_responses 
  for each row execute function public.moddatetime();

-- function to create a new profile for a new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- trigger to call the function after a new user is inserted into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- step 5: create views
-- views provide a way to encapsulate complex queries and simplify data access.

-- survey_responses_status view
-- this view dynamically calculates the status of each survey response.
create or replace view public.survey_responses_status as
select
    id,
    survey_id,
    user_id,
    case
        when completed_at is not null then 'completed'
        when completed_at is null and (now() - created_at > interval '1 hour') then 'abandoned'
        else 'started'
    end as status
from
    public.survey_responses;

-- step 6: setup row-level security (rls)
-- enable rls on all tables and define policies to control data access.

-- helper function to get the role of the currently authenticated user.
create or replace function public.get_user_role()
returns user_role as $$
declare
  user_role_result user_role;
begin
  select role into user_role_result from public.profiles where user_id = auth.uid();
  return user_role_result;
end;
$$ language plpgsql;

-- rls for profiles table
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
-- policy: authenticated users can view their own profile.
create policy "allow authenticated users to select own profile" on public.profiles for select to authenticated using (auth.uid() = user_id);
-- policy: authenticated users can update their own profile.
create policy "allow authenticated users to update own profile" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- policy: super admins can view any profile.
create policy "allow super admins to select any profile" on public.profiles for select to authenticated using (get_user_role() = 'super_admin');
-- policy: super admins can create any profile.
create policy "allow super admins to insert any profile" on public.profiles for insert to authenticated with check (get_user_role() = 'super_admin');
-- policy: super admins can update any profile.
create policy "allow super admins to update any profile" on public.profiles for update to authenticated using (get_user_role() = 'super_admin') with check (get_user_role() = 'super_admin');
-- policy: super admins can delete any profile.
create policy "allow super admins to delete any profile" on public.profiles for delete to authenticated using (get_user_role() = 'super_admin');

-- rls for competitions table
alter table public.competitions enable row level security;
alter table public.competitions force row level security;
-- policy: all authenticated users can view competitions.
create policy "allow authenticated users to select competitions" on public.competitions for select to authenticated using (true);
-- policy: moderators and super admins can create competitions.
create policy "allow moderators and super admins to insert competitions" on public.competitions for insert to authenticated with check (get_user_role() in ('moderator', 'super_admin'));
-- policy: moderators and super admins can update competitions.
create policy "allow moderators and super admins to update competitions" on public.competitions for update to authenticated using (get_user_role() in ('moderator', 'super_admin')) with check (get_user_role() in ('moderator', 'super_admin'));
-- policy: moderators and super admins can delete competitions.
create policy "allow moderators and super admins to delete competitions" on public.competitions for delete to authenticated using (get_user_role() in ('moderator', 'super_admin'));

-- rls for surveys table
alter table public.surveys enable row level security;
alter table public.surveys force row level security;
-- policy: all authenticated users can view surveys.
create policy "allow authenticated users to select surveys" on public.surveys for select to authenticated using (true);
-- policy: moderators and super admins can create surveys.
create policy "allow moderators and super admins to insert surveys" on public.surveys for insert to authenticated with check (get_user_role() in ('moderator', 'super_admin'));
-- policy: moderators and super admins can update surveys.
create policy "allow moderators and super admins to update surveys" on public.surveys for update to authenticated using (get_user_role() in ('moderator', 'super_admin')) with check (get_user_role() in ('moderator', 'super_admin'));
-- policy: moderators and super admins can delete surveys.
create policy "allow moderators and super admins to delete surveys" on public.surveys for delete to authenticated using (get_user_role() in ('moderator', 'super_admin'));

-- rls for survey_responses table
alter table public.survey_responses enable row level security;
alter table public.survey_responses force row level security;
-- policy: users can select their own responses.
create policy "allow users to select own responses" on public.survey_responses for select to authenticated using (auth.uid() = user_id);
-- policy: users can create their own responses.
create policy "allow users to insert own responses" on public.survey_responses for insert to authenticated with check (auth.uid() = user_id);
-- policy: users can update their own responses.
create policy "allow users to update own responses" on public.survey_responses for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- policy: users can delete their own responses.
create policy "allow users to delete own responses" on public.survey_responses for delete to authenticated using (auth.uid() = user_id);
-- policy: moderators and super admins can view all responses.
create policy "allow moderators and super admins to select all responses" on public.survey_responses for select to authenticated using (get_user_role() in ('moderator', 'super_admin'));

# Database Schema for PilotVoice

This document outlines the PostgreSQL database schema for the PilotVoice application, designed for use with Supabase.

## 1. Tables

### `user_role` ENUM Type

A custom ENUM type to define user roles within the application.

```sql
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'super_admin');
```

### `profiles` Table

Stores user-specific data that extends the `auth.users` table from Supabase. A trigger will automatically create a profile for each new user.

| Column | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `user_id` | `uuid` | `PRIMARY KEY`, `REFERENCES auth.users(id)` | Foreign key to the Supabase auth user. |
| `role` | `user_role` | `NOT NULL`, `DEFAULT 'user'` | The role of the user in the system. |
| `civl_id` | `integer` | | User's optional CIVL ID. |
| `registration_reason` | `text` | | User's optional reason for registration. |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Timestamp of profile creation. |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Timestamp of the last profile update. |

### `competitions` Table

Stores information about paragliding competitions.

| Column | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `integer` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Unique identifier for the competition. |
| `name` | `text` | `NOT NULL` | Name of the competition. |
| `starts_at` | `timestamptz` | `NOT NULL` | Start date and time of the competition. |
| `ends_at` | `timestamptz` | `NOT NULL` | End date and time of the competition. |
| `city` | `text` | `NOT NULL` | City where the competition takes place. |
| `country_code` | `char(3)` | `NOT NULL` | Country code (ISO 3166-1 alpha-3). |
| `tasks_count` | `integer` | `CHECK (tasks_count >= 0)` | Number of tasks in the competition. |
| `participant_count` | `integer` | | Total number of participants. |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Timestamp of record creation. |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Timestamp of the last record update. |
| | | `CHECK (ends_at > starts_at)` | Ensures end date is after start date. |

### `surveys` Table

Defines the surveys associated with competitions. For MVP, each competition will have one survey.

| Column | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `integer` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Unique identifier for the survey. |
| `competition_id` | `integer` | `NOT NULL`, `REFERENCES competitions(id)` | Foreign key to the associated competition. |
| `opens_at` | `timestamptz` | | Date and time when the survey becomes active. |
| `closes_at` | `timestamptz` | | Date and time when the survey closes. |
| `slug` | `text` | `UNIQUE` | Optional user-friendly URL slug. |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Timestamp of record creation. |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Timestamp of the last record update. |
| | | `CHECK (closes_at IS NULL OR opens_at IS NULL OR closes_at > opens_at)` | Ensures close date is after open date. |

### `survey_responses` Table

Stores responses submitted by pilots for each survey.

| Column | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `bigint` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Unique identifier for the response. |
| `survey_id` | `integer` | `NOT NULL`, `REFERENCES surveys(id)` | Foreign key to the associated survey. |
| `user_id` | `uuid` | `NOT NULL`, `REFERENCES auth.users(id)` | Foreign key to the user who submitted. |
| `overall_rating` | `integer` | `CHECK (overall_rating >= 1 AND overall_rating <= 10)` | Overall rating (1-10). |
| `open_feedback` | `text` | | Anonymized open-ended feedback from the user. |
| `completed_at` | `timestamptz` | | Timestamp when mandatory fields were completed. |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Timestamp of response creation. |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | Timestamp of the last response update. |
| | | `UNIQUE (survey_id, user_id)` | Prevents duplicate responses per user/survey. |

## 2. Relationships

- **`auth.users` <-> `profiles`**: One-to-One. Each user has one profile.
- **`competitions` <-> `surveys`**: One-to-Many. Each competition can have multiple surveys (though only one for MVP).
- **`surveys` <-> `survey_responses`**: One-to-Many. Each survey can have many responses.
- **`profiles` <-> `survey_responses`**: One-to-Many. Each user (profile) can submit many responses.

**Entity Relationship Diagram (Textual Representation):**

- `profiles.user_id` -> `auth.users.id`
- `surveys.competition_id` -> `competitions.id`
- `survey_responses.survey_id` -> `surveys.id`
- `survey_responses.user_id` -> `auth.users.id`

## 3. Indexes

- **`surveys`**:
  - An index is explicitly created on `competition_id` to optimize joins.
  - The `slug` column has a `UNIQUE` constraint to ensure all slugs are distinct.
    ```sql
    CREATE INDEX surveys_competition_id_idx ON public.surveys (competition_id);
    ```
- **`survey_responses`**:
  - Indexes are explicitly created on `survey_id` and `user_id` to improve query performance on these foreign keys.
  - The `UNIQUE (survey_id, user_id)` constraint also creates an optimal composite index for lookups.
    ```sql
    CREATE INDEX survey_responses_survey_id_idx ON public.survey_responses (survey_id);
    CREATE INDEX survey_responses_user_id_idx ON public.survey_responses (user_id);
    ```

## 4. PostgreSQL Functions & Triggers

### `handle_new_user` Function & Trigger

This function and trigger automatically create a new record in the `profiles` table whenever a new user signs up via Supabase Auth.

```sql
-- Function to create a new profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### `moddatetime` Function & Trigger for `updated_at`

This standard function and a corresponding trigger on each table will automatically update the `updated_at` column on any row modification.

```sql
-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for each table
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON competitions 
  FOR EACH ROW EXECUTE FUNCTION moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON surveys 
  FOR EACH ROW EXECUTE FUNCTION moddatetime();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON survey_responses 
  FOR EACH ROW EXECUTE FUNCTION moddatetime();
```

## 5. Views

### `survey_responses_status` View

This view dynamically calculates the status of each survey response (`completed` or `abandoned`) based on timestamps, avoiding the need to store the status in a column.

```sql
CREATE OR REPLACE VIEW public.survey_responses_status AS
SELECT
    id,
    survey_id,
    user_id,
    CASE
        WHEN completed_at IS NOT NULL THEN 'completed'
        WHEN completed_at IS NULL AND (now() - created_at > interval '1 hour') THEN 'abandoned'
        ELSE 'started'
    END AS status
FROM
    public.survey_responses;
```

## 6. Row-Level Security (RLS) Policies

RLS is enabled on all tables to ensure users can only access data they are permitted to see.

### Helper Function: `get_user_role`

This function retrieves the role of the currently authenticated user.

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result FROM public.profiles WHERE user_id = auth.uid();
  RETURN user_role_result;
END;
$$ LANGUAGE plpgsql;
```

### `profiles` Policies

- Users can view and edit their own profile.
- Super Admins can manage all profiles.

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super Admins can view any profile" ON public.profiles
  FOR SELECT USING (get_user_role() = 'super_admin');

CREATE POLICY "Super Admins can create any profile" ON public.profiles
  FOR INSERT WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "Super Admins can update any profile" ON public.profiles
  FOR UPDATE USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "Super Admins can delete any profile" ON public.profiles
  FOR DELETE USING (get_user_role() = 'super_admin');
```

### `competitions` & `surveys` Policies

- All authenticated users can view competitions and surveys.
- Only Moderators and Super Admins can create, update, or delete them.

```sql
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys FORCE ROW LEVEL SECURITY;

-- Competitions Policies
CREATE POLICY "Allow read access to all authenticated users" ON public.competitions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for moderators and super admins" ON public.competitions
  FOR INSERT WITH CHECK (get_user_role() IN ('moderator', 'super_admin'));
CREATE POLICY "Allow update for moderators and super admins" ON public.competitions
  FOR UPDATE USING (get_user_role() IN ('moderator', 'super_admin'))
  WITH CHECK (get_user_role() IN ('moderator', 'super_admin'));
CREATE POLICY "Allow delete for moderators and super admins" ON public.competitions
  FOR DELETE USING (get_user_role() IN ('moderator', 'super_admin'));

-- Surveys Policies
CREATE POLICY "Allow read access to all authenticated users" ON public.surveys
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for moderators and super admins" ON public.surveys
  FOR INSERT WITH CHECK (get_user_role() IN ('moderator', 'super_admin'));
CREATE POLICY "Allow update for moderators and super admins" ON public.surveys
  FOR UPDATE USING (get_user_role() IN ('moderator', 'super_admin'))
  WITH CHECK (get_user_role() IN ('moderator', 'super_admin'));
CREATE POLICY "Allow delete for moderators and super admins" ON public.surveys
  FOR DELETE USING (get_user_role() IN ('moderator', 'super_admin'));
```

### `survey_responses` Policies

- Users can manage their own responses.
- Moderators and Super Admins have read-only access to all responses.

```sql
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own responses" ON public.survey_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses" ON public.survey_responses
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses" ON public.survey_responses
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Moderators and Super Admins can view all responses" ON public.survey_responses
  FOR SELECT USING (get_user_role() IN ('moderator', 'super_admin'));
```

## 7. Additional Notes

- **Separation of Concerns**: `competitions` and `surveys` are separate tables to allow for future flexibility, such as having multiple surveys for a single competition or surveys not tied to a competition.
- **Anonymization**: The `open_feedback` column in `survey_responses` is expected to store text that has been pre-processed and anonymized by the application backend before being inserted into the database, in compliance with GDPR.
- **Scalability**: The schema uses `integer` primary keys for entities with moderate growth expectations (like `competitions` and `surveys`) for efficiency. For high-volume data, such as `survey_responses`, a `bigint` primary key is used to ensure it can scale to a very large number of records.

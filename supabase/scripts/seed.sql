-- supabase/seed.sql
INSERT INTO public.competitions (name, starts_at, ends_at, city, country_code, tasks_count, participant_count)
VALUES 
  ('Polish Open 2024', '2024-08-01 10:00:00+00', '2024-08-07 18:00:00+00', 'Żar', 'POL', 7, 120),
  ('European Championship', '2024-09-15 08:00:00+00', '2024-09-22 20:00:00+00', 'Fiesch', 'CHE', 8, 180);
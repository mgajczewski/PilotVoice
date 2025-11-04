-- ============================================================================
-- Automatyczny skrypt SQL z CTE - poprawiona wersja
-- ============================================================================

-- WAŻNE: Zamień 'your-user-id-here' na rzeczywisty UUID użytkownika

WITH new_competition AS (
  INSERT INTO competitions (
    name, 
    starts_at, 
    ends_at, 
    city, 
    country_code, 
    tasks_count, 
    participant_count
  )
  VALUES (
    'Test Competition 2024',
    '2024-07-01 10:00:00+00',
    '2024-07-07 18:00:00+00',
    'Annecy',
    'FRA',
    5,
    100
  )
  RETURNING id
),
survey_1 AS (
  INSERT INTO surveys (
    competition_id,
    opens_at,
    closes_at,
    slug
  )
  SELECT 
    id,
    '2024-07-01 09:00:00+00',
    '2024-07-14 23:59:59+00',
    'test-competition-2024-feedback'
  FROM new_competition
  RETURNING id
),
survey_2 AS (
  INSERT INTO surveys (
    competition_id,
    opens_at,
    closes_at,
    slug
  )
  SELECT 
    id,
    '2024-07-08 09:00:00+00',
    '2024-07-21 23:59:59+00',
    'test-competition-2024-post-event'
  FROM new_competition
  RETURNING id
)
INSERT INTO survey_responses (
  survey_id,
  user_id,
  overall_rating,
  open_feedback,
  completed_at
)
SELECT 
  id,
  'your-user-id-here',
  8,
  'Great competition, well organized!',
  NOW()
FROM survey_1
ON CONFLICT (survey_id, user_id) DO NOTHING
RETURNING id, survey_id;
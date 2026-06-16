-- Backfill missing discussion activity records into family_activity.
-- Covers DISCUSS_START, DISCUSS_REPLY, and DISCUSS_REACT.
-- Safe to run multiple times.

BEGIN;

WITH discussion_targets AS (
  SELECT
    dt.id AS discuss_thread_id,
    dt.fk_family_id,
    dt.fk_post_member_id,
    dt.target_type,
    dt.fk_target_id,
    dt.title AS discuss_topic,
    dt.created_at,
    CASE dt.target_type
      WHEN 'show' THEN 'TV Junkies'
      WHEN 'movie' THEN 'Movie Maniacs'
      WHEN 'book' THEN 'Reading Room'
      WHEN 'poem' THEN 'Poetry Cafe'
      WHEN 'recipe' THEN 'Family Foodies'
      WHEN 'music' THEN 'Music Lovers'
      ELSE 'Family Discussions'
    END AS feature_name,
    COALESCE(
      CASE dt.target_type WHEN 'show' THEN s.show_title END,
      CASE dt.target_type WHEN 'movie' THEN mv.movie_title END,
      CASE dt.target_type WHEN 'book' THEN b.book_title END,
      CASE dt.target_type WHEN 'poem' THEN p.poem_title END,
      CASE dt.target_type WHEN 'recipe' THEN r.recipe_title END,
      CASE dt.target_type WHEN 'music' THEN mu.music_title END,
      dt.title
    ) AS post_name
  FROM discuss_thread dt
  LEFT JOIN show s
    ON dt.target_type = 'show'
   AND s.id = dt.fk_target_id
   AND s.fk_family_id = dt.fk_family_id
  LEFT JOIN movie mv
    ON dt.target_type = 'movie'
   AND mv.id = dt.fk_target_id
   AND mv.fk_family_id = dt.fk_family_id
  LEFT JOIN book b
    ON dt.target_type = 'book'
   AND b.id = dt.fk_target_id
   AND b.fk_family_id = dt.fk_family_id
  LEFT JOIN poem p
    ON dt.target_type = 'poem'
   AND p.id = dt.fk_target_id
   AND p.fk_family_id = dt.fk_family_id
  LEFT JOIN recipe r
    ON dt.target_type = 'recipe'
   AND r.id = dt.fk_target_id
   AND r.fk_family_id = dt.fk_family_id
  LEFT JOIN music mu
    ON dt.target_type = 'music'
   AND mu.id = dt.fk_target_id
   AND mu.fk_family_id = dt.fk_family_id
),
insert_discuss_start AS (
  INSERT INTO family_activity (
    action_type,
    feature_name,
    post_name,
    status,
    created_at,
    fk_family_id,
    fk_member_id
  )
  SELECT
    'DISCUSS_START' AS action_type,
    t.feature_name,
    t.post_name,
    'active' AS status,
    t.created_at,
    t.fk_family_id,
    t.fk_post_member_id
  FROM discussion_targets t
  WHERE t.fk_post_member_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM family_activity fa
      WHERE fa.action_type = 'DISCUSS_START'
        AND fa.feature_name = t.feature_name
        AND fa.post_name = t.post_name
        AND fa.fk_family_id = t.fk_family_id
        AND fa.fk_member_id = t.fk_post_member_id
        AND fa.created_at = t.created_at
    )
  RETURNING 1
),
insert_discuss_reply AS (
  INSERT INTO family_activity (
    action_type,
    feature_name,
    post_name,
    status,
    created_at,
    fk_family_id,
    fk_member_id
  )
  SELECT
    'DISCUSS_REPLY' AS action_type,
    t.feature_name,
    t.post_name,
    'active' AS status,
    dpr.created_at,
    t.fk_family_id,
    dpr.fk_author_member_id
  FROM discuss_post_reply dpr
  INNER JOIN discussion_targets t
    ON t.discuss_thread_id = dpr.fk_discuss_thread_id
  WHERE lower(dpr.post_reply_type) = 'reply'
    AND dpr.fk_author_member_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM family_activity fa
      WHERE fa.action_type = 'DISCUSS_REPLY'
        AND fa.feature_name = t.feature_name
        AND fa.post_name = t.post_name
        AND fa.fk_family_id = t.fk_family_id
        AND fa.fk_member_id = dpr.fk_author_member_id
        AND fa.created_at = dpr.created_at
    )
  RETURNING 1
)
INSERT INTO family_activity (
  action_type,
  feature_name,
  post_name,
  status,
  created_at,
  fk_family_id,
  fk_member_id
)
SELECT
  'DISCUSS_REACT' AS action_type,
  t.feature_name,
  t.post_name,
  'active' AS status,
  dl.created_at,
  t.fk_family_id,
  dl.fk_member_id
FROM discuss_like dl
INNER JOIN discuss_post_reply dpr
  ON dpr.id = dl.fk_discuss_post_id
INNER JOIN discussion_targets t
  ON t.discuss_thread_id = dpr.fk_discuss_thread_id
WHERE dl.fk_member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'DISCUSS_REACT'
      AND fa.feature_name = t.feature_name
      AND fa.post_name = t.post_name
      AND fa.fk_family_id = t.fk_family_id
      AND fa.fk_member_id = dl.fk_member_id
      AND fa.created_at = dl.created_at
  );

COMMIT;

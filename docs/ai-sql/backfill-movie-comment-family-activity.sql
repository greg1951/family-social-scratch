-- Backfill missing Movie Maniacs COMMENT_CREATED records into family_activity.
-- Safe to run multiple times.

BEGIN;

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
  'COMMENT_CREATED' AS action_type,
  'Movie Maniacs' AS feature_name,
  m.movie_title AS post_name,
  'active' AS status,
  COALESCE(mc.created_at, NOW()) AS created_at,
  m.fk_family_id AS fk_family_id,
  mc.fk_member_id AS fk_member_id
FROM movie_comment mc
INNER JOIN movie m ON m.id = mc.fk_movie_id
WHERE mc.is_movie_reviewer = false
  AND mc.comment_json IS NOT NULL
  AND btrim(mc.comment_json) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'COMMENT_CREATED'
      AND fa.feature_name = 'Movie Maniacs'
      AND fa.post_name = m.movie_title
      AND fa.fk_family_id = m.fk_family_id
      AND fa.fk_member_id = mc.fk_member_id
      AND fa.created_at = mc.created_at
  );

COMMIT;

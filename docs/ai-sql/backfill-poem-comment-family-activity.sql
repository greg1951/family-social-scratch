-- Backfill missing Poetry Cafe COMMENT_CREATED records into family_activity.
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
  'Poetry Cafe' AS feature_name,
  p.poem_title AS post_name,
  'active' AS status,
  pc.created_at AS created_at,
  p.fk_family_id AS fk_family_id,
  pc.fk_member_id AS fk_member_id
FROM poem_comment pc
INNER JOIN poem_verse pv ON pv.id = pc.fk_poem_verse_id
INNER JOIN poem p ON p.id = pv.fk_poem_id
WHERE pc.is_poem_analysis = false
  AND pc.comment_json IS NOT NULL
  AND btrim(pc.comment_json) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'COMMENT_CREATED'
      AND fa.feature_name = 'Poetry Cafe'
      AND fa.post_name = p.poem_title
      AND fa.fk_family_id = p.fk_family_id
      AND fa.fk_member_id = pc.fk_member_id
      AND fa.created_at = pc.created_at
  );

COMMIT;

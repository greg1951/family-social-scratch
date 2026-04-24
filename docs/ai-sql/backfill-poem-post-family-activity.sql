-- Backfill missing Poetry Cafe POST_CREATED records into family_activity.
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
  'POST_CREATED' AS action_type,
  'Poetry Cafe' AS feature_name,
  p.poem_title AS post_name,
  'active' AS status,
  p.created_at AS created_at,
  p.fk_family_id AS fk_family_id,
  p.fk_member_id AS fk_member_id
FROM poem p
WHERE NOT EXISTS (
  SELECT 1
  FROM family_activity fa
  WHERE fa.action_type = 'POST_CREATED'
    AND fa.feature_name = 'Poetry Cafe'
    AND fa.post_name = p.poem_title
    AND fa.fk_family_id = p.fk_family_id
    AND fa.fk_member_id = p.fk_member_id
    AND fa.created_at = p.created_at
);

COMMIT;

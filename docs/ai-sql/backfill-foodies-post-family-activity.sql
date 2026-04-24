-- Backfill missing Family Foodies POST_CREATED records into family_activity.
-- Safe to run multiple times.

BEGIN;

INSERT INTO family_activity (
  action_type,
  feature_name,
  post_name,
  status,
  fk_family_id,
  fk_member_id
)
SELECT
  'POST_CREATED' AS action_type,
  'Family Foodies' AS feature_name,
  r.recipe_title AS post_name,
  'active' AS status,
  r.fk_family_id AS fk_family_id,
  r.fk_member_id AS fk_member_id
FROM recipe r
WHERE NOT EXISTS (
  SELECT 1
  FROM family_activity fa
  WHERE fa.action_type = 'POST_CREATED'
    AND fa.feature_name = 'Family Foodies'
    AND fa.post_name = r.recipe_title
    AND fa.fk_family_id = r.fk_family_id
    AND fa.fk_member_id = r.fk_member_id
);

COMMIT;

-- Backfill missing Family Foodies COMMENT_CREATED records into family_activity.
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
  'Family Foodies' AS feature_name,
  r.recipe_title AS post_name,
  'active' AS status,
  rc.created_at AS created_at,
  r.fk_family_id AS fk_family_id,
  rc.fk_member_id AS fk_member_id
FROM recipe_comment rc
INNER JOIN recipe r ON r.id = rc.fk_recipe_id
WHERE rc.is_recipe_pro_tip = false
  AND rc.comment_json IS NOT NULL
  AND btrim(rc.comment_json) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'COMMENT_CREATED'
      AND fa.feature_name = 'Family Foodies'
      AND fa.post_name = r.recipe_title
      AND fa.fk_family_id = r.fk_family_id
      AND fa.fk_member_id = rc.fk_member_id
      AND fa.created_at = rc.created_at
  );

COMMIT;

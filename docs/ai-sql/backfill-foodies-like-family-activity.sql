-- Backfill missing Family Foodies LIKE_ADDED / LOVE_ADDED records into family_activity.
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
  CASE
    WHEN rl.likeness_degree = 2 THEN 'LOVE_ADDED'
    ELSE 'LIKE_ADDED'
  END AS action_type,
  'Family Foodies' AS feature_name,
  r.recipe_title AS post_name,
  'active' AS status,
  rl.updated_at AS created_at,
  r.fk_family_id AS fk_family_id,
  rl.fk_member_id AS fk_member_id
FROM recipe_like rl
INNER JOIN recipe r ON r.id = rl.fk_recipe_id
WHERE rl.likeness_degree IN (1, 2)
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = CASE WHEN rl.likeness_degree = 2 THEN 'LOVE_ADDED' ELSE 'LIKE_ADDED' END
      AND fa.feature_name = 'Family Foodies'
      AND fa.post_name = r.recipe_title
      AND fa.fk_family_id = r.fk_family_id
      AND fa.fk_member_id = rl.fk_member_id
      AND fa.created_at = rl.updated_at
  );

COMMIT;

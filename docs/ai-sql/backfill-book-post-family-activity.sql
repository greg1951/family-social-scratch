-- Backfill missing Book Besties POST_CREATED records into family_activity.
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
  'Book Besties' AS feature_name,
  b.book_title AS post_name,
  'active' AS status,
  b.created_at AS created_at,
  b.fk_family_id AS fk_family_id,
  b.fk_member_id AS fk_member_id
FROM book b
WHERE NOT EXISTS (
  SELECT 1
  FROM family_activity fa
  WHERE fa.action_type = 'POST_CREATED'
    AND fa.feature_name = 'Book Besties'
    AND fa.post_name = b.book_title
    AND fa.fk_family_id = b.fk_family_id
    AND fa.fk_member_id = b.fk_member_id
    AND fa.created_at = b.created_at
);

COMMIT;

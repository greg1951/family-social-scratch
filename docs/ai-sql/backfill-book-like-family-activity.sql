-- Backfill missing Book Besties LIKE_ADDED records into family_activity.
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
  'LIKE_ADDED' AS action_type,
  'Book Besties' AS feature_name,
  b.book_title AS post_name,
  'active' AS status,
  bl.created_at AS created_at,
  b.fk_family_id AS fk_family_id,
  bl.fk_member_id AS fk_member_id
FROM book_like bl
INNER JOIN book b ON b.id = bl.fk_book_id
WHERE NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'LIKE_ADDED'
      AND fa.feature_name = 'Book Besties'
      AND fa.post_name = b.book_title
      AND fa.fk_family_id = b.fk_family_id
      AND fa.fk_member_id = bl.fk_member_id
      AND fa.created_at = bl.created_at
  );

COMMIT;

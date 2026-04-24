-- Backfill missing Book Besties COMMENT_CREATED records into family_activity.
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
  'Book Besties' AS feature_name,
  b.book_title AS post_name,
  'active' AS status,
  bc.created_at AS created_at,
  b.fk_family_id AS fk_family_id,
  bc.fk_member_id AS fk_member_id
FROM book_comment bc
INNER JOIN book b ON b.id = bc.fk_book_id
WHERE bc.is_book_analysis = false
  AND bc.comment_json IS NOT NULL
  AND btrim(bc.comment_json) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'COMMENT_CREATED'
      AND fa.feature_name = 'Book Besties'
      AND fa.post_name = b.book_title
      AND fa.fk_family_id = b.fk_family_id
      AND fa.fk_member_id = bc.fk_member_id
      AND fa.created_at = bc.created_at
  );

COMMIT;

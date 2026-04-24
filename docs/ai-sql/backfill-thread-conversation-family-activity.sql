-- Backfill missing Family Threads THREAD_CREATED records into family_activity.
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
  'THREAD_CREATED' AS action_type,
  'Family Threads' AS feature_name,
  COALESCE(m.first_name || ' ' || m.last_name, 'Unknown Member') AS post_name,
  'active' AS status,
  tc.created_at AS created_at,
  tc.fk_family_id AS fk_family_id,
  tc.fk_sender_member_id AS fk_member_id
FROM thread_conversation tc
LEFT JOIN member m ON m.id = tc.fk_sender_member_id
WHERE tc.status = 'active'
  AND tc.fk_sender_member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'THREAD_CREATED'
      AND fa.feature_name = 'Family Threads'
      AND fa.fk_family_id = tc.fk_family_id
      AND fa.fk_member_id = tc.fk_sender_member_id
      AND fa.created_at = tc.created_at
  );

COMMIT;

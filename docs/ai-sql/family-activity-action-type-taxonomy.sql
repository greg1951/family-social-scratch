-- Normalize and enforce canonical action_type values for family_activity.
-- Safe to run multiple times.

BEGIN;

-- Backfill legacy/dynamic values into canonical taxonomy.
UPDATE family_activity
SET action_type = 'GAME_STARTED'
WHERE feature_name = 'Game Scoreboards'
  AND activity_name = 'post'
  AND action_type NOT IN ('POST_CREATED', 'COMMENT_CREATED', 'THREAD_CREATED', 'GAME_STARTED');

UPDATE family_activity
SET action_type = 'THREAD_CREATED'
WHERE activity_name = 'thread'
  AND action_type NOT IN ('POST_CREATED', 'COMMENT_CREATED', 'THREAD_CREATED', 'GAME_STARTED');

UPDATE family_activity
SET action_type = 'COMMENT_CREATED'
WHERE activity_name = 'comment'
  AND action_type NOT IN ('POST_CREATED', 'COMMENT_CREATED', 'THREAD_CREATED', 'GAME_STARTED');

UPDATE family_activity
SET action_type = 'POST_CREATED'
WHERE activity_name = 'post'
  AND action_type NOT IN ('POST_CREATED', 'COMMENT_CREATED', 'THREAD_CREATED', 'GAME_STARTED');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'family_activity_action_type_ck'
  ) THEN
    ALTER TABLE family_activity
      ADD CONSTRAINT family_activity_action_type_ck
      CHECK (
        action_type IN (
          'POST_CREATED',
          'COMMENT_CREATED',
          'THREAD_CREATED',
          'GAME_STARTED'
        )
      );
  END IF;
END $$;

COMMIT;

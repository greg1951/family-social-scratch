-- Normalize and enforce canonical action_type values for family_activity.
-- Safe to run multiple times.

BEGIN;

ALTER TABLE family_activity
DROP CONSTRAINT IF EXISTS family_activity_action_type_ck;

-- Backfill legacy/dynamic values into canonical taxonomy.
UPDATE family_activity
SET action_type = 'GAME_STARTED'
WHERE feature_name = 'Game Scoreboards'
  AND action_type NOT IN ('POST_CREATED', 'COMMENT_CREATED', 'THREAD_CREATED', 'GAME_STARTED', 'LIKE_ADDED', 'LOVE_ADDED');

UPDATE family_activity
SET action_type = 'THREAD_CREATED'
WHERE feature_name = 'Family Threads'
  AND action_type NOT IN ('POST_CREATED', 'COMMENT_CREATED', 'THREAD_CREATED', 'GAME_STARTED', 'LIKE_ADDED', 'LOVE_ADDED');

UPDATE family_activity
SET action_type = 'COMMENT_CREATED'
WHERE lower(action_type) IN ('comment', 'comment_created')
  AND action_type <> 'COMMENT_CREATED';

UPDATE family_activity
SET action_type = 'POST_CREATED'
WHERE lower(action_type) IN ('post', 'post_created')
  AND action_type <> 'POST_CREATED';

UPDATE family_activity
SET action_type = 'LIKE_ADDED'
WHERE lower(action_type) IN ('like', 'liked', 'like_added')
  AND action_type <> 'LIKE_ADDED';

UPDATE family_activity
SET action_type = 'LOVE_ADDED'
WHERE lower(action_type) IN ('love', 'loved', 'love_added')
  AND action_type <> 'LOVE_ADDED';

DO $$
BEGIN
  ALTER TABLE family_activity
    ADD CONSTRAINT family_activity_action_type_ck
    CHECK (
      action_type IN (
        'POST_CREATED',
        'COMMENT_CREATED',
        'THREAD_CREATED',
        'GAME_STARTED',
        'LIKE_ADDED',
        'LOVE_ADDED'
      )
    );
END $$;

COMMIT;

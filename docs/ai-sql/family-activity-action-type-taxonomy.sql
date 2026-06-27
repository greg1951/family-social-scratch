-- Normalize and enforce canonical action_type values for family_activity.
-- Safe to run multiple times.

BEGIN;

ALTER TABLE family_activity
DROP CONSTRAINT IF EXISTS family_activity_action_type_ck;

-- Backfill legacy/dynamic values into canonical taxonomy.
UPDATE family_activity
SET action_type = 'GAME_STARTED'
WHERE feature_name = 'Game Room'
  AND action_type NOT IN ('POST_CREATED', 'COMMENT_CREATED', 'THREAD_CREATED', 'GAME_STARTED', 'LIKE_ADDED', 'LOVE_ADDED');

UPDATE family_activity
SET action_type = 'THREAD_CREATED'
WHERE feature_name = 'Mail Box'
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
SET action_type = 'ALBUM_SHARED'
WHERE lower(action_type) IN ('album_shared', 'album', 'shared_album')
  AND action_type <> 'ALBUM_SHARED';

UPDATE family_activity
SET action_type = 'LIKE_ADDED'
WHERE lower(action_type) IN ('like', 'liked', 'like_added')
  AND action_type <> 'LIKE_ADDED';

UPDATE family_activity
SET action_type = 'LOVE_ADDED'
WHERE lower(action_type) IN ('love', 'loved', 'love_added')
  AND action_type <> 'LOVE_ADDED';

UPDATE family_activity
SET action_type = 'INVITE_SENT'
WHERE lower(action_type) IN ('invite', 'invited', 'invite_sent')
  AND action_type <> 'INVITE_SENT';

UPDATE family_activity
SET action_type = 'MEMBER_JOINED'
WHERE lower(action_type) IN ('join', 'joined', 'member_joined')
  AND action_type <> 'MEMBER_JOINED';

UPDATE family_activity
SET action_type = 'DISCUSS_START'
WHERE lower(action_type) IN ('discuss_start', 'discussion_start', 'discussion_started')
  AND action_type <> 'DISCUSS_START';

UPDATE family_activity
SET action_type = 'DISCUSS_REPLY'
WHERE lower(action_type) IN ('discuss_reply', 'discussion_reply', 'discussion_replied')
  AND action_type <> 'DISCUSS_REPLY';

UPDATE family_activity
SET action_type = 'DISCUSS_REACT'
WHERE lower(action_type) IN ('discuss_react', 'discussion_react', 'discussion_reacted')
  AND action_type <> 'DISCUSS_REACT';

DO $$
BEGIN
  ALTER TABLE family_activity
    ADD CONSTRAINT family_activity_action_type_ck
    CHECK (
      action_type IN (
        'POST_CREATED',
        'COMMENT_CREATED',
        'ALBUM_SHARED',
        'THREAD_CREATED',
        'GAME_STARTED',
        'LIKE_ADDED',
        'LOVE_ADDED',
        'INVITE_SENT',
        'MEMBER_JOINED',
        'DISCUSS_START',
        'DISCUSS_REPLY',
        'DISCUSS_REACT'
      )
    );
END $$;

COMMIT;

-- Backfill missing Blogs activity records into family_activity.
-- Includes posts, comments, and reactions (likes/loves).
-- Safe to run multiple times.

BEGIN;

SET LOCAL search_path TO family_schema, public;

-- Normalize legacy feature label so historical activity is included in current charts.
UPDATE family_activity
SET feature_name = 'Blogs'
WHERE feature_name = 'Family Blog';

-- 1) Blog post creation activity
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
  'Blogs' AS feature_name,
  bp.title AS post_name,
  'active' AS status,
  bp.created_at AS created_at,
  bp.fk_family_id AS fk_family_id,
  bp.fk_author_member_id AS fk_member_id
FROM blog_post bp
WHERE NOT EXISTS (
  SELECT 1
  FROM family_activity fa
  WHERE fa.action_type = 'POST_CREATED'
    AND fa.feature_name = 'Blogs'
    AND fa.post_name = bp.title
    AND fa.fk_family_id = bp.fk_family_id
    AND fa.fk_member_id = bp.fk_author_member_id
    AND fa.created_at = bp.created_at
);

-- 2) Blog comments activity
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
  'Blogs' AS feature_name,
  bp.title AS post_name,
  'active' AS status,
  bc.created_at AS created_at,
  bp.fk_family_id AS fk_family_id,
  bc.fk_member_id AS fk_member_id
FROM blog_comment bc
INNER JOIN blog_post bp ON bp.id = bc.fk_blog_post_id
WHERE bc.content_json IS NOT NULL
  AND btrim(bc.content_json) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'COMMENT_CREATED'
      AND fa.feature_name = 'Blogs'
      AND fa.post_name = bp.title
      AND fa.fk_family_id = bp.fk_family_id
      AND fa.fk_member_id = bc.fk_member_id
      AND fa.created_at = bc.created_at
  );

-- 3a) Blog LIKE reactions activity
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
  'Blogs' AS feature_name,
  bp.title AS post_name,
  'active' AS status,
  bl.created_at AS created_at,
  bp.fk_family_id AS fk_family_id,
  bl.fk_member_id AS fk_member_id
FROM blog_likeness bl
INNER JOIN blog_post bp ON bp.id = bl.fk_blog_post_id
WHERE bl.likeness_degree = 1
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'LIKE_ADDED'
      AND fa.feature_name = 'Blogs'
      AND fa.post_name = bp.title
      AND fa.fk_family_id = bp.fk_family_id
      AND fa.fk_member_id = bl.fk_member_id
      AND fa.created_at = bl.created_at
  );

-- 3b) Blog LOVE reactions activity
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
  'LOVE_ADDED' AS action_type,
  'Blogs' AS feature_name,
  bp.title AS post_name,
  'active' AS status,
  bl.created_at AS created_at,
  bp.fk_family_id AS fk_family_id,
  bl.fk_member_id AS fk_member_id
FROM blog_likeness bl
INNER JOIN blog_post bp ON bp.id = bl.fk_blog_post_id
WHERE bl.likeness_degree = 2
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type = 'LOVE_ADDED'
      AND fa.feature_name = 'Blogs'
      AND fa.post_name = bp.title
      AND fa.fk_family_id = bp.fk_family_id
      AND fa.fk_member_id = bl.fk_member_id
      AND fa.created_at = bl.created_at
  );

COMMIT;

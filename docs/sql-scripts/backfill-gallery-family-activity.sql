-- Backfill missing Family Gallery activity records into family_activity.
-- Covers POST_CREATED (album creates), COMMENT_CREATED (album comments),
-- and LIKE_ADDED / LOVE_ADDED (album photo reactions).
-- Safe to run multiple times (all inserts are guarded by NOT EXISTS).

BEGIN;

-- ── 1. POST_CREATED — one record per created album ──────────────────────────
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
  'POST_CREATED'        AS action_type,
  'Family Gallery'      AS feature_name,
  ga.album_name         AS post_name,
  'active'              AS status,
  ga.updated_at         AS created_at,
  m.fk_family_id        AS fk_family_id,
  ga.fk_member_id       AS fk_member_id
FROM gallery_album ga
INNER JOIN member m ON m.id = ga.fk_member_id
WHERE NOT EXISTS (
  SELECT 1
  FROM family_activity fa
  WHERE fa.action_type  = 'POST_CREATED'
    AND fa.feature_name = 'Family Gallery'
    AND fa.post_name    = ga.album_name
    AND fa.fk_family_id = m.fk_family_id
    AND fa.fk_member_id = ga.fk_member_id
);

-- ── 2. COMMENT_CREATED — one record per album comment ───────────────────────
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
  'COMMENT_CREATED'              AS action_type,
  'Family Gallery'               AS feature_name,
  ga.album_name                  AS post_name,
  'active'                       AS status,
  gac.created_at                 AS created_at,
  m.fk_family_id                 AS fk_family_id,
  gac.fk_member_id               AS fk_member_id
FROM gallery_album_photo_comment gac
INNER JOIN gallery_album ga ON ga.id = gac.fk_gallery_album_id
INNER JOIN member m ON m.id = gac.fk_member_id
WHERE BTRIM(gac.comment_text) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type  = 'COMMENT_CREATED'
      AND fa.feature_name = 'Family Gallery'
      AND fa.fk_family_id = m.fk_family_id
      AND fa.fk_member_id = gac.fk_member_id
      AND fa.created_at   = gac.created_at
  );

  -- ── 3. LIKE_ADDED / LOVE_ADDED — one record per photo reaction ───────────────
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
    WHEN gapl.like_type = 2 THEN 'LOVE_ADDED'
    ELSE 'LIKE_ADDED'
  END                            AS action_type,
  'Family Gallery'               AS feature_name,
  ga.album_name                  AS post_name,
  'active'                       AS status,
  gapl.created_at                AS created_at,
  m.fk_family_id                 AS fk_family_id,
  gapl.fk_member_id              AS fk_member_id
FROM gallery_album_photo_like gapl
INNER JOIN gallery_album_photo gap ON gap.id = gapl.fk_gallery_album_photo_id
INNER JOIN gallery_album ga        ON ga.id  = gap.fk_album_id
INNER JOIN member m                ON m.id   = gapl.fk_member_id
WHERE gapl.like_type IN (1, 2)
  AND NOT EXISTS (
    SELECT 1
    FROM family_activity fa
    WHERE fa.action_type  = CASE WHEN gapl.like_type = 2 THEN 'LOVE_ADDED' ELSE 'LIKE_ADDED' END
      AND fa.feature_name = 'Family Gallery'
      AND fa.fk_family_id = m.fk_family_id
      AND fa.fk_member_id = gapl.fk_member_id
      AND fa.created_at   = gapl.created_at
  );

-- ── Cleanup: remove Family Gallery photo-upload post rows that were previously inserted
DELETE FROM family_activity fa
WHERE fa.action_type = 'POST_CREATED'
  AND fa.feature_name = 'Family Gallery'
  AND EXISTS (
    SELECT 1
    FROM gallery_photo gp
    WHERE gp.fk_member_id = fa.fk_member_id
      AND gp.created_at = fa.created_at
      AND fa.post_name = COALESCE(NULLIF(BTRIM(gp.caption), ''), gp.file_name, 'Photo Upload')
  );

COMMIT;

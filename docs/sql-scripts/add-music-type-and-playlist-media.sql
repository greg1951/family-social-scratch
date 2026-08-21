-- Add music_type support and playlist media storage for Music Salon.
-- This script is safe to run multiple times.

BEGIN;

ALTER TABLE IF EXISTS family_schema.music
ADD COLUMN IF NOT EXISTS music_type text;

UPDATE family_schema.music
SET music_type = CASE
  WHEN COALESCE(is_song, false) THEN 'song'
  ELSE 'album'
END
WHERE music_type IS NULL OR btrim(music_type) = '';

ALTER TABLE IF EXISTS family_schema.music
ALTER COLUMN music_type SET DEFAULT 'album';

ALTER TABLE IF EXISTS family_schema.music
ALTER COLUMN music_type SET NOT NULL;

ALTER TABLE IF EXISTS family_schema.music
ALTER COLUMN status SET DEFAULT 'published';

CREATE TABLE IF NOT EXISTS family_schema.music_playlist_media (
  id serial PRIMARY KEY,
  media_source text NOT NULL DEFAULT '',
  media_type text NOT NULL DEFAULT 'song',
  media_url text NOT NULL DEFAULT '',
  media_artist text NOT NULL DEFAULT '',
  media_caption text NOT NULL DEFAULT '',
  media_image_url text,
  use_image_url boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT now(),
  fk_music_id integer NOT NULL REFERENCES family_schema.music(id) ON DELETE CASCADE
);

ALTER TABLE IF EXISTS family_schema.music_playlist_media
  ADD COLUMN IF NOT EXISTS media_image_url text,
  ADD COLUMN IF NOT EXISTS use_image_url boolean DEFAULT false;

UPDATE family_schema.music_playlist_media
SET use_image_url = false
WHERE use_image_url IS NULL;

ALTER TABLE IF EXISTS family_schema.music_playlist_media
  ALTER COLUMN use_image_url SET NOT NULL;

CREATE INDEX IF NOT EXISTS music_media_music_id_idx
ON family_schema.music_playlist_media (fk_music_id);

COMMIT;

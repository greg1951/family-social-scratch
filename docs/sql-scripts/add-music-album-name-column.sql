-- Adds album_name to family_schema.music so Song entries can record their parent album.
-- Safe to run multiple times.

ALTER TABLE IF EXISTS family_schema.music
ADD COLUMN IF NOT EXISTS album_name text;

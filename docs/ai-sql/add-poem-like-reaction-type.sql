-- Add multi-reaction support for poem_like.
-- -1 = dislike, 1 = like, 2 = love

ALTER TABLE poem_like
ADD COLUMN IF NOT EXISTS reaction_type integer;

UPDATE poem_like
SET reaction_type = 1
WHERE reaction_type IS NULL;

ALTER TABLE poem_like
ALTER COLUMN reaction_type SET DEFAULT 1;

ALTER TABLE poem_like
ALTER COLUMN reaction_type SET NOT NULL;

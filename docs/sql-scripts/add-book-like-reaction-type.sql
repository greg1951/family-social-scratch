-- Add multi-reaction support for book_like.
-- -1 = dislike, 1 = like, 2 = love

ALTER TABLE book_like
ADD COLUMN IF NOT EXISTS reaction_type integer;

UPDATE book_like
SET reaction_type = 1
WHERE reaction_type IS NULL;

ALTER TABLE book_like
ALTER COLUMN reaction_type SET DEFAULT 1;

ALTER TABLE book_like
ALTER COLUMN reaction_type SET NOT NULL;

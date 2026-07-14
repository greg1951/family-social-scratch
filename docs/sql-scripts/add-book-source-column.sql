-- Adds book_source to family_schema.book for environments that predate this column.
-- Safe to run multiple times.

ALTER TABLE family_schema.book
  ADD COLUMN IF NOT EXISTS book_source text;

UPDATE family_schema.book
SET book_source = 'bookstore'
WHERE book_source IS NULL OR btrim(book_source) = '';

ALTER TABLE family_schema.book
  ALTER COLUMN book_source SET DEFAULT 'bookstore';

ALTER TABLE family_schema.book
  ALTER COLUMN book_source SET NOT NULL;

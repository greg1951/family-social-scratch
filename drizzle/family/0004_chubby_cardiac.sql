ALTER TABLE "family_schema"."book_biblio" ADD COLUMN "read_year" integer DEFAULT 0 NOT NULL;
ALTER TABLE "family_schema"."book_biblio" DROP COLUMN "date_read";
ALTER TABLE "family_schema"."book_biblio" DROP COLUMN "created_at";
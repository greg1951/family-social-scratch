ALTER TABLE "family_schema"."book_biblio" DROP CONSTRAINT "book_biblio_book_title_unique";--> statement-breakpoint
ALTER TABLE "family_schema"."book_biblio" ADD COLUMN "date_read" timestamp;--> statement-breakpoint
ALTER TABLE "family_schema"."book_biblio" ADD COLUMN "updated_at" timestamp DEFAULT now();
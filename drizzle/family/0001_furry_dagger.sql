CREATE TABLE "family_schema"."book_biblio" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_title" text NOT NULL,
	"author_name" text DEFAULT 'anonymous' NOT NULL,
	"book_series_name" text,
	"status" text DEFAULT 'private' NOT NULL,
	"summary_json" text DEFAULT '{}' NOT NULL,
	"comment_json" text DEFAULT '{}' NOT NULL,
	"published_year" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_family_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	CONSTRAINT "book_biblio_book_title_unique" UNIQUE("book_title")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."book_biblio_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_biblio_id" integer NOT NULL,
	"fk_tag_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "family_schema"."thread_template" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "family_schema"."thread_template" CASCADE;--> statement-breakpoint
ALTER TABLE "family_schema"."music" ALTER COLUMN "status" SET DEFAULT 'published';--> statement-breakpoint
ALTER TABLE "family_schema"."blog_post" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_post" ADD COLUMN "video_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "family_schema"."music" ADD COLUMN "album_name" text;--> statement-breakpoint
ALTER TABLE "family_schema"."music_playlist_media" ADD COLUMN "media_seq_no" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "family_schema"."music_playlist_media" ADD COLUMN "media_image_url" text;--> statement-breakpoint
ALTER TABLE "family_schema"."music_playlist_media" ADD COLUMN "use_image_url" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "family_schema"."book_biblio" ADD CONSTRAINT "book_biblio_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_biblio" ADD CONSTRAINT "book_biblio_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_biblio_tag" ADD CONSTRAINT "book_biblio_tag_fk_biblio_id_book_biblio_id_fk" FOREIGN KEY ("fk_biblio_id") REFERENCES "family_schema"."book_biblio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_biblio_tag" ADD CONSTRAINT "book_biblio_tag_fk_tag_id_book_category_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "global_schema"."book_category_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_biblio_family_id_idx" ON "family_schema"."book_biblio" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "book_biblio_member_id_idx" ON "family_schema"."book_biblio" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "book_biblio_biblio_id_idx" ON "family_schema"."book_biblio_tag" USING btree ("fk_biblio_id");--> statement-breakpoint
CREATE INDEX "book_biblio_tag_id_idx" ON "family_schema"."book_biblio_tag" USING btree ("fk_tag_id");--> statement-breakpoint
ALTER TABLE "family_schema"."music" DROP COLUMN "is_song";
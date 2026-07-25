CREATE TABLE "family_schema"."blog_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"soft_deleted_at" timestamp,
	"fk_blog_post_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."blog_likeness" (
	"id" serial PRIMARY KEY NOT NULL,
	"likeness_degree" integer DEFAULT -1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_blog_post_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	CONSTRAINT "blog_likeness_post_member_uq" UNIQUE("fk_blog_post_id","fk_member_id")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."blog_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"s3_object_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size_bytes" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"caption" text,
	"created_at" timestamp DEFAULT now(),
	"fk_blog_post_id" integer,
	"fk_upload_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."blog_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"cover_image_s3_key" text,
	"cover_image_alt" text,
	"allow_comments" boolean DEFAULT true NOT NULL,
	"fk_author_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	CONSTRAINT "blog_post_family_slug_uq" UNIQUE("fk_family_id","slug")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."blog_post_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_blog_post_id" integer NOT NULL,
	"fk_blog_tag_id" integer NOT NULL,
	CONSTRAINT "blog_post_tag_post_tag_uq" UNIQUE("fk_blog_post_id","fk_blog_tag_id")
);
--> statement-breakpoint
ALTER TABLE "family_schema"."blog_comment" ADD CONSTRAINT "blog_comment_fk_blog_post_id_blog_post_id_fk" FOREIGN KEY ("fk_blog_post_id") REFERENCES "family_schema"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_comment" ADD CONSTRAINT "blog_comment_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_likeness" ADD CONSTRAINT "blog_likeness_fk_blog_post_id_blog_post_id_fk" FOREIGN KEY ("fk_blog_post_id") REFERENCES "family_schema"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_likeness" ADD CONSTRAINT "blog_likeness_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_media" ADD CONSTRAINT "blog_media_fk_blog_post_id_blog_post_id_fk" FOREIGN KEY ("fk_blog_post_id") REFERENCES "family_schema"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_media" ADD CONSTRAINT "blog_media_fk_upload_member_id_member_id_fk" FOREIGN KEY ("fk_upload_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_media" ADD CONSTRAINT "blog_media_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_post" ADD CONSTRAINT "blog_post_fk_author_member_id_member_id_fk" FOREIGN KEY ("fk_author_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_post" ADD CONSTRAINT "blog_post_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_post_tag" ADD CONSTRAINT "blog_post_tag_fk_blog_post_id_blog_post_id_fk" FOREIGN KEY ("fk_blog_post_id") REFERENCES "family_schema"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."blog_post_tag" ADD CONSTRAINT "blog_post_tag_fk_blog_tag_id_blog_tag_reference_id_fk" FOREIGN KEY ("fk_blog_tag_id") REFERENCES "global_schema"."blog_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_comment_post_id_idx" ON "family_schema"."blog_comment" USING btree ("fk_blog_post_id");--> statement-breakpoint
CREATE INDEX "blog_comment_member_id_idx" ON "family_schema"."blog_comment" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "blog_likeness_post_id_idx" ON "family_schema"."blog_likeness" USING btree ("fk_blog_post_id");--> statement-breakpoint
CREATE INDEX "blog_likeness_member_id_idx" ON "family_schema"."blog_likeness" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "blog_media_post_id_idx" ON "family_schema"."blog_media" USING btree ("fk_blog_post_id");--> statement-breakpoint
CREATE INDEX "blog_media_uploader_id_idx" ON "family_schema"."blog_media" USING btree ("fk_upload_member_id");--> statement-breakpoint
CREATE INDEX "blog_media_family_id_idx" ON "family_schema"."blog_media" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "blog_post_family_created_idx" ON "family_schema"."blog_post" USING btree ("fk_family_id","created_at");--> statement-breakpoint
CREATE INDEX "blog_post_family_status_created_idx" ON "family_schema"."blog_post" USING btree ("fk_family_id","status","created_at");--> statement-breakpoint
CREATE INDEX "blog_post_author_created_idx" ON "family_schema"."blog_post" USING btree ("fk_author_member_id","created_at");--> statement-breakpoint
CREATE INDEX "blog_post_tag_post_id_idx" ON "family_schema"."blog_post_tag" USING btree ("fk_blog_post_id");--> statement-breakpoint
CREATE INDEX "blog_post_tag_tag_id_idx" ON "family_schema"."blog_post_tag" USING btree ("fk_blog_tag_id");
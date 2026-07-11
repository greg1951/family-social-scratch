CREATE TABLE "global_schema"."book_category_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_name" text DEFAULT '' NOT NULL,
	"category_description" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_schema"."book_category_tag_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" text DEFAULT '' NOT NULL,
	"tag_json" text DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_book_category_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_schema"."book_term" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text DEFAULT '' NOT NULL,
	"term_category" text DEFAULT 'definition' NOT NULL,
	"term_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_schema"."movie_tag_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" text DEFAULT '' NOT NULL,
	"tag_description" text,
	"tag_type" text DEFAULT 'global' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_schema"."music_tag_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" text DEFAULT '' NOT NULL,
	"tag_description" text,
	"tag_type" text DEFAULT 'genre' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_schema"."poem_category_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_name" text DEFAULT '' NOT NULL,
	"category_description" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_schema"."poem_category_tag_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" text DEFAULT '' NOT NULL,
	"tag_json" text DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_poem_category_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_schema"."poem_term" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text DEFAULT '' NOT NULL,
	"term_category" text DEFAULT 'definition' NOT NULL,
	"term_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_schema"."show_tag_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" text DEFAULT '' NOT NULL,
	"tag_description" text,
	"tag_type" text DEFAULT 'global' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_schema"."support_attachment" (
	"id" serial PRIMARY KEY NOT NULL,
	"attachment_type" text DEFAULT 'image' NOT NULL,
	"attachment_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_support_issue_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_schema"."support_environment" (
	"id" serial PRIMARY KEY NOT NULL,
	"env_pneumonic" text NOT NULL,
	"website_domain" text DEFAULT 'my-family-social.com' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"bypass_url" text,
	"support_email" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "support_environment_env_pneumonic_unique" UNIQUE("env_pneumonic")
);
--> statement-breakpoint
CREATE TABLE "global_schema"."support_family" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_name" text NOT NULL,
	"database_url" text,
	"db_owner" text,
	"db_credential" text,
	"status" text DEFAULT 'trial' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "support_family_family_name_unique" UNIQUE("family_name")
);
--> statement-breakpoint
CREATE TABLE "global_schema"."support_issue" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_type" text DEFAULT 'question' NOT NULL,
	"issue_title" text,
	"issue_json" text DEFAULT '{}' NOT NULL,
	"priority" text DEFAULT 'low' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer,
	"fk_support_family_id" integer
);
--> statement-breakpoint
CREATE TABLE "global_schema"."support_person" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"manages_team" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_support_team_id" integer,
	CONSTRAINT "support_person_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "global_schema"."support_person_issue" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_support_issue_id" integer,
	"fk_support_person_id" integer
);
--> statement-breakpoint
CREATE TABLE "global_schema"."support_response" (
	"id" serial PRIMARY KEY NOT NULL,
	"response_type" text DEFAULT 'general' NOT NULL,
	"is_proposed_solution" boolean DEFAULT false NOT NULL,
	"was_accepted" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"response_json" text DEFAULT '{}' NOT NULL,
	"email_sent_at" timestamp,
	"thread_sent_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"fk_support_issue_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_schema"."support_team" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_name" text NOT NULL,
	"support_level" text DEFAULT 'L1' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "support_team_team_name_unique" UNIQUE("team_name")
);
--> statement-breakpoint
CREATE TABLE "global_schema"."video" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_name" text DEFAULT '' NOT NULL,
	"faq_page_seq_no" integer DEFAULT 1 NOT NULL,
	"video_json" text DEFAULT '{}' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"video_url" text,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"caption" text DEFAULT 'Overview' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_video_s3_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_schema"."video_s3_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"encrypted_access_key" text NOT NULL,
	"encrypted_secret_key" text NOT NULL,
	"bucket_name" text NOT NULL,
	"region" text DEFAULT 'us-east-2' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_schema"."video_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_video_id" integer NOT NULL,
	"fk_tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_schema"."video_tag_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"tag_name" text DEFAULT '' NOT NULL,
	"tag_description" text,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "global_schema"."book_category_tag_reference" ADD CONSTRAINT "book_category_tag_reference_fk_book_category_id_book_category_reference_id_fk" FOREIGN KEY ("fk_book_category_id") REFERENCES "global_schema"."book_category_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."poem_category_tag_reference" ADD CONSTRAINT "poem_category_tag_reference_fk_poem_category_id_poem_category_reference_id_fk" FOREIGN KEY ("fk_poem_category_id") REFERENCES "global_schema"."poem_category_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."support_attachment" ADD CONSTRAINT "support_attachment_fk_support_issue_id_support_issue_id_fk" FOREIGN KEY ("fk_support_issue_id") REFERENCES "global_schema"."support_issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."support_issue" ADD CONSTRAINT "support_issue_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."support_issue" ADD CONSTRAINT "support_issue_fk_support_family_id_support_family_id_fk" FOREIGN KEY ("fk_support_family_id") REFERENCES "global_schema"."support_family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."support_person" ADD CONSTRAINT "support_person_fk_support_team_id_support_team_id_fk" FOREIGN KEY ("fk_support_team_id") REFERENCES "global_schema"."support_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."support_person_issue" ADD CONSTRAINT "support_person_issue_fk_support_issue_id_support_issue_id_fk" FOREIGN KEY ("fk_support_issue_id") REFERENCES "global_schema"."support_issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."support_person_issue" ADD CONSTRAINT "support_person_issue_fk_support_person_id_support_person_id_fk" FOREIGN KEY ("fk_support_person_id") REFERENCES "global_schema"."support_person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."support_response" ADD CONSTRAINT "support_response_fk_support_issue_id_support_issue_id_fk" FOREIGN KEY ("fk_support_issue_id") REFERENCES "global_schema"."support_issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."video" ADD CONSTRAINT "video_fk_video_s3_id_video_s3_credentials_id_fk" FOREIGN KEY ("fk_video_s3_id") REFERENCES "global_schema"."video_s3_credentials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."video_tag" ADD CONSTRAINT "video_tag_fk_video_id_video_id_fk" FOREIGN KEY ("fk_video_id") REFERENCES "global_schema"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_schema"."video_tag" ADD CONSTRAINT "video_tag_fk_tag_id_video_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "global_schema"."video_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_attachment_id_idx" ON "global_schema"."support_attachment" USING btree ("id");--> statement-breakpoint
CREATE INDEX "support_env_id_idx" ON "global_schema"."support_environment" USING btree ("id");--> statement-breakpoint
CREATE INDEX "support_family_id_idx" ON "global_schema"."support_family" USING btree ("id");--> statement-breakpoint
CREATE INDEX "support_issue_id_idx" ON "global_schema"."support_issue" USING btree ("id");--> statement-breakpoint
CREATE INDEX "support_issue_family_id_idx" ON "global_schema"."support_issue" USING btree ("fk_support_family_id");--> statement-breakpoint
CREATE INDEX "support_issue_member_id_idx" ON "global_schema"."support_issue" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "support_person_id_idx" ON "global_schema"."support_person" USING btree ("id");--> statement-breakpoint
CREATE INDEX "support_person_team_id_idx" ON "global_schema"."support_person" USING btree ("fk_support_team_id");--> statement-breakpoint
CREATE INDEX "support_person_issue_id_idx" ON "global_schema"."support_person_issue" USING btree ("id");--> statement-breakpoint
CREATE INDEX "support_person_issue_issue_id_idx" ON "global_schema"."support_person_issue" USING btree ("fk_support_issue_id");--> statement-breakpoint
CREATE INDEX "support_person_issue_person_id_idx" ON "global_schema"."support_person_issue" USING btree ("fk_support_person_id");--> statement-breakpoint
CREATE INDEX "support_response_id_idx" ON "global_schema"."support_response" USING btree ("id");--> statement-breakpoint
CREATE INDEX "support_team_id_idx" ON "global_schema"."support_team" USING btree ("id");--> statement-breakpoint
CREATE INDEX "video_s3_id_idx" ON "global_schema"."video" USING btree ("fk_video_s3_id");--> statement-breakpoint
CREATE INDEX "video_tag_video_id_idx" ON "global_schema"."video_tag" USING btree ("fk_video_id");--> statement-breakpoint
CREATE INDEX "video_tag_tag_id_idx" ON "global_schema"."video_tag" USING btree ("fk_tag_id");
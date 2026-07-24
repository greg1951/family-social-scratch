CREATE TABLE "family_schema"."account" (
	"userId" integer NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."book" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_title" text NOT NULL,
	"author_name" text DEFAULT 'anonymous' NOT NULL,
	"book_language" text DEFAULT 'english' NOT NULL,
	"book_year" integer DEFAULT 0 NOT NULL,
	"book_series_name" text,
	"book_source" text DEFAULT 'bookstore' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	CONSTRAINT "book_book_title_unique" UNIQUE("book_title")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."book_category_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_book_id" integer NOT NULL,
	"fk_tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."book_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_book_analysis" boolean DEFAULT false NOT NULL,
	"comment_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_book_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."book_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_book_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"reaction_type" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "book_like_member_id_uq" UNIQUE("fk_book_id","fk_member_id")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."club" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"club_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_club_founder_id" integer,
	"fk_family_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."club_session" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"target_type" text NOT NULL,
	"fk_target_id" integer NOT NULL,
	"fk_club_id" integer NOT NULL,
	"fk_post_member_id" integer
);
--> statement-breakpoint
CREATE TABLE "family_schema"."discuss_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_discuss_post_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"reaction_type" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "discuss_like_discuss_post_member_id_uq" UNIQUE("fk_discuss_post_id","fk_member_id")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."discuss_post_reply" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_reply_type" text DEFAULT 'post' NOT NULL,
	"summary" text NOT NULL,
	"content_json" text DEFAULT '{}' NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"parent_post_id" integer,
	"root_post_id" integer,
	"fk_discuss_thread_id" integer NOT NULL,
	"fk_author_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."discuss_thread" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"topic_json" text,
	"closed_at" timestamp,
	"target_type" text NOT NULL,
	"fk_target_id" integer NOT NULL,
	"fk_post_member_id" integer,
	"fk_family_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."family" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_name" text NOT NULL,
	"status" text DEFAULT 'trial' NOT NULL,
	"expiration_date" timestamp DEFAULT CURRENT_DATE + INTERVAL '28 days',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "family_family_name_unique" UNIQUE("family_name")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."family_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_type" text NOT NULL,
	"feature_name" text NOT NULL,
	"post_name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_family_id" integer NOT NULL,
	"fk_member_id" integer
);
--> statement-breakpoint
CREATE TABLE "family_schema"."family_feature_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_selected" boolean DEFAULT false NOT NULL,
	"fk_family_id" integer NOT NULL,
	"fk_feature_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."family_invitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"invited_email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"expiration_date" timestamp DEFAULT CURRENT_DATE + INTERVAL '7 days' NOT NULL,
	"secret" text,
	"invite_token" text,
	"invite_founder_message" text,
	"fk_family_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status_update" timestamp
);
--> statement-breakpoint
CREATE TABLE "family_schema"."family_s3_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"encrypted_access_key" text NOT NULL,
	"encrypted_secret_key" text NOT NULL,
	"bucket_name" text NOT NULL,
	"region" text DEFAULT 'us-east-2' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_family_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."gallery_album" (
	"id" serial PRIMARY KEY NOT NULL,
	"caption" text,
	"album_name" text NOT NULL,
	"album_json" text DEFAULT '{}' NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"is_liked" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."gallery_album_photo_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_text" text DEFAULT '' NOT NULL,
	"fk_member_id" integer NOT NULL,
	"fk_gallery_album_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."gallery_album_photo" (
	"id" serial PRIMARY KEY NOT NULL,
	"caption" text,
	"album_photo_description" text,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_photo_id" integer NOT NULL,
	"fk_album_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."gallery_album_photo_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"like_type" integer DEFAULT 1 NOT NULL,
	"fk_gallery_album_photo_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."gallery_photo" (
	"id" serial PRIMARY KEY NOT NULL,
	"caption" text,
	"photo_year" integer DEFAULT 0 NOT NULL,
	"photo_image_url" text NOT NULL,
	"photo_position" text DEFAULT 'portrait' NOT NULL,
	"file_name" text,
	"file_size_bytes" integer,
	"mime_type" text,
	"created_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."game_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"high_or_lo" text DEFAULT 'high' NOT NULL,
	"score_uom" text DEFAULT 'points' NOT NULL,
	"is_round_based" boolean DEFAULT true NOT NULL,
	"max_rounds" integer DEFAULT 12 NOT NULL,
	"max_players" integer DEFAULT 4 NOT NULL,
	"rounds_order" text DEFAULT 'desc' NOT NULL,
	"winning_score" integer DEFAULT -1 NOT NULL,
	"supports_teams" boolean DEFAULT false NOT NULL,
	CONSTRAINT "game_metadata_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."game_player_round" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_no" integer DEFAULT 1 NOT NULL,
	"round_score" integer DEFAULT 0 NOT NULL,
	"cumulative_score" integer DEFAULT 0 NOT NULL,
	"fk_game_id" integer NOT NULL,
	"fk_game_player_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."game_player_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"play_position" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"fk_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."game_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"fk_game_meta_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	CONSTRAINT "game_state_game_title_unique" UNIQUE("game_title")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."guided_member_tour_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_major" integer DEFAULT 1 NOT NULL,
	"version_minor" integer DEFAULT 0 NOT NULL,
	"version_patch" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"current_step_no" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp,
	"last_seen_at" timestamp,
	"completed_at" timestamp,
	"skipped_at" timestamp,
	"dismissed_at" timestamp,
	"never_show_again" boolean DEFAULT false NOT NULL,
	"restart_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	"fk_tour_id" integer NOT NULL,
	CONSTRAINT "member_tour_progress_member_family_tour_version_uq" UNIQUE("fk_member_id","fk_family_id","fk_tour_id","version_major","version_minor","version_patch")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."guided_member_tour_step_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"step_no" integer NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"viewed_at" timestamp,
	"completed_at" timestamp,
	"skipped_at" timestamp,
	"time_spent_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"fk_member_tour_progress_id" integer NOT NULL,
	"fk_step_id" integer NOT NULL,
	CONSTRAINT "member_tour_step_progress_member_progress_step_uq" UNIQUE("fk_member_tour_progress_id","fk_step_id")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."member" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"nick_name" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"birthday" text DEFAULT '01/01/1970' NOT NULL,
	"cell_phone" text DEFAULT '(000) 000-0000' NOT NULL,
	"fk_family_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"member_image_url" text,
	"is_family_founder" boolean DEFAULT false NOT NULL,
	"is_guest" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."member_option" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_member_id" integer NOT NULL,
	"fk_option_id" integer NOT NULL,
	"is_selected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."movie" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_title" text NOT NULL,
	"movie_image_credit" text DEFAULT '' NOT NULL,
	"movie_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"movie_image_url" text,
	"movie_site_url" text,
	"movie_site_background" text DEFAULT '#000000' NOT NULL,
	"movie_year" integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE) NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	CONSTRAINT "movie_movie_title_unique" UNIQUE("movie_title")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."movie_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_movie_reviewer" boolean DEFAULT false NOT NULL,
	"comment_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_movie_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."movie_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"likeness_degree" integer DEFAULT -1 NOT NULL,
	"fk_movie_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."movie_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_movie_id" integer NOT NULL,
	"fk_tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."movie_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text DEFAULT '' NOT NULL,
	"is_global_template" boolean DEFAULT false NOT NULL,
	"template_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer,
	"fk_family_id" integer
);
--> statement-breakpoint
CREATE TABLE "family_schema"."music" (
	"id" serial PRIMARY KEY NOT NULL,
	"music_title" text NOT NULL,
	"artist_name" text DEFAULT '' NOT NULL,
	"music_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_song" boolean DEFAULT true NOT NULL,
	"music_image_url" text,
	"music_year" integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE) NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	CONSTRAINT "music_music_title_unique" UNIQUE("music_title")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."music_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_music_reviewer" boolean DEFAULT false NOT NULL,
	"comment_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_music_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."music_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"likeness_degree" integer DEFAULT -1 NOT NULL,
	"fk_music_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."music_lyrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"lyrics_json" text DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'draft' NOT NULL,
	"fk_music_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."music_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_music_id" integer NOT NULL,
	"fk_tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."music_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text DEFAULT '' NOT NULL,
	"is_global_template" boolean DEFAULT false NOT NULL,
	"template_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer,
	"fk_family_id" integer
);
--> statement-breakpoint
CREATE TABLE "family_schema"."password_reset" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_user_id" integer NOT NULL,
	"token" text NOT NULL,
	"token_expiry" timestamp,
	CONSTRAINT "password_reset_fk_user_id_unique" UNIQUE("fk_user_id")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."poem" (
	"id" serial PRIMARY KEY NOT NULL,
	"poem_title" text NOT NULL,
	"poet_name" text DEFAULT 'Anonymous' NOT NULL,
	"poem_source" text DEFAULT 'Unknown' NOT NULL,
	"poem_year" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	CONSTRAINT "poem_poem_title_unique" UNIQUE("poem_title")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."poem_category_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_poem_id" integer NOT NULL,
	"fk_tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."poem_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_poem_analysis" boolean DEFAULT false NOT NULL,
	"comment_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_poem_verse_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."poem_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_poem_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"reaction_type" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "poem_like_poem_member_id_uq" UNIQUE("fk_poem_id","fk_member_id")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."poem_verse" (
	"id" serial PRIMARY KEY NOT NULL,
	"verse_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_poem_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."pwa_mutation_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_key" text NOT NULL,
	"mutation_name" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"fk_family_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "pwa_mutation_request_request_key_unique" UNIQUE("request_key")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."recipe" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_title" text NOT NULL,
	"recipe_short_summary" text DEFAULT '' NOT NULL,
	"recipe_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"recipe_image_url" text,
	"prep_time_minutes" integer DEFAULT 0 NOT NULL,
	"cook_time_minutes" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	"fk_template_id" integer,
	CONSTRAINT "recipe_recipe_title_unique" UNIQUE("recipe_title")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."recipe_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_recipe_pro_tip" boolean DEFAULT false NOT NULL,
	"comment_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_recipe_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."recipe_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"likeness_degree" integer DEFAULT -1 NOT NULL,
	"fk_recipe_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."recipe_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_recipe_id" integer NOT NULL,
	"fk_tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."recipe_tag_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" text DEFAULT '' NOT NULL,
	"tag_description" text,
	"tag_type" text DEFAULT 'global' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."recipe_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text DEFAULT '' NOT NULL,
	"is_global_template" boolean DEFAULT false NOT NULL,
	"template_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer,
	"fk_family_id" integer,
	CONSTRAINT "recipe_template_template_name_unique" UNIQUE("template_name"),
	CONSTRAINT "recipe_template_family_id_name_uq" UNIQUE("fk_family_id","template_name")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."recipe_term" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text DEFAULT '' NOT NULL,
	"term_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."show" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_title" text NOT NULL,
	"show_image_credit" text DEFAULT '' NOT NULL,
	"show_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"show_image_url" text,
	"show_site_url" text,
	"show_site_background" text DEFAULT '#000000' NOT NULL,
	"show_first_year" integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE) NOT NULL,
	"show_last_year" integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE) NOT NULL,
	"season_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer NOT NULL,
	"fk_family_id" integer NOT NULL,
	CONSTRAINT "show_show_title_unique" UNIQUE("show_title")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."show_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_show_reviewer" boolean DEFAULT false NOT NULL,
	"comment_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"fk_show_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."show_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"likeness_degree" integer DEFAULT -1 NOT NULL,
	"fk_show_id" integer NOT NULL,
	"fk_member_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."show_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_show_id" integer NOT NULL,
	"fk_tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."show_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text DEFAULT '' NOT NULL,
	"is_global_template" boolean DEFAULT false NOT NULL,
	"template_json" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"fk_member_id" integer,
	"fk_family_id" integer
);
--> statement-breakpoint
CREATE TABLE "family_schema"."thread_conversation" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"subject" text,
	"primary_category" text,
	"closed_at" timestamp,
	"archived_at" timestamp,
	"archive_batch_id" integer,
	"archive_object_key" text,
	"fk_sender_member_id" integer,
	"fk_family_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."thread_conversation_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_tag_id" integer NOT NULL,
	"fk_conversation_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."thread_post_attachment" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_post_id" integer NOT NULL,
	"attachment_type" text DEFAULT 'image' NOT NULL,
	"s3_object_key" text NOT NULL,
	"display_url" text,
	"file_name" text,
	"file_size_bytes" integer,
	"mime_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."thread_post_reply" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_conversation_id" integer NOT NULL,
	"fk_author_member_id" integer NOT NULL,
	"type" text DEFAULT 'post' NOT NULL,
	"content" text NOT NULL,
	"content_json" text DEFAULT '{}' NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"soft_deleted_at" timestamp,
	"parent_post_id" integer,
	"root_post_id" integer,
	CONSTRAINT "thread_post_reply_conversation_seq_uq" UNIQUE("fk_conversation_id","seq_no")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."thread_recipient_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_conversation_id" integer NOT NULL,
	"fk_recipient_member_id" integer NOT NULL,
	"delivery_type" text DEFAULT 'threads' NOT NULL,
	"read_at" timestamp,
	"answered_at" timestamp,
	"archived_at" timestamp,
	"archive_batch_id" integer,
	"archive_object_key" text,
	"created_at" timestamp DEFAULT now(),
	"last_viewed_post_id" integer,
	CONSTRAINT "thread_recipient_state_conversation_recipient_uq" UNIQUE("fk_conversation_id","fk_recipient_member_id")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."thread_tag_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" text NOT NULL,
	"tag_description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_schema"."thread_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text DEFAULT '' NOT NULL,
	"template_category" text DEFAULT 'thread' NOT NULL,
	"template_json" text DEFAULT '{}' NOT NULL,
	"seq_no" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "thread_template_template_name_unique" UNIQUE("template_name")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"emailVerified" timestamp,
	"image" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"2fa_secret" text,
	"2fa_activated" boolean DEFAULT false,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"fk_family_id" integer NOT NULL,
	"fk_member_id" integer,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "family_schema"."user_2fa_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_number" integer NOT NULL,
	"fk_user_id" integer NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_schema"."verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "family_schema"."account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "family_schema"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book" ADD CONSTRAINT "book_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book" ADD CONSTRAINT "book_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_category_tag" ADD CONSTRAINT "book_category_tag_fk_book_id_book_id_fk" FOREIGN KEY ("fk_book_id") REFERENCES "family_schema"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_category_tag" ADD CONSTRAINT "book_category_tag_fk_tag_id_book_category_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "global_schema"."book_category_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_comment" ADD CONSTRAINT "book_comment_fk_book_id_book_id_fk" FOREIGN KEY ("fk_book_id") REFERENCES "family_schema"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_comment" ADD CONSTRAINT "book_comment_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_like" ADD CONSTRAINT "book_like_fk_book_id_book_id_fk" FOREIGN KEY ("fk_book_id") REFERENCES "family_schema"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."book_like" ADD CONSTRAINT "book_like_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."club" ADD CONSTRAINT "club_fk_club_founder_id_member_id_fk" FOREIGN KEY ("fk_club_founder_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."club" ADD CONSTRAINT "club_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."club_session" ADD CONSTRAINT "club_session_fk_club_id_club_id_fk" FOREIGN KEY ("fk_club_id") REFERENCES "family_schema"."club"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."club_session" ADD CONSTRAINT "club_session_fk_post_member_id_member_id_fk" FOREIGN KEY ("fk_post_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."discuss_like" ADD CONSTRAINT "discuss_like_fk_discuss_post_id_discuss_post_reply_id_fk" FOREIGN KEY ("fk_discuss_post_id") REFERENCES "family_schema"."discuss_post_reply"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."discuss_like" ADD CONSTRAINT "discuss_like_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."discuss_post_reply" ADD CONSTRAINT "discuss_post_reply_fk_discuss_thread_id_discuss_thread_id_fk" FOREIGN KEY ("fk_discuss_thread_id") REFERENCES "family_schema"."discuss_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."discuss_post_reply" ADD CONSTRAINT "discuss_post_reply_fk_author_member_id_member_id_fk" FOREIGN KEY ("fk_author_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."discuss_post_reply" ADD CONSTRAINT "thread_post_reply_parent_post_fkey" FOREIGN KEY ("parent_post_id") REFERENCES "family_schema"."discuss_post_reply"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."discuss_post_reply" ADD CONSTRAINT "thread_post_reply_root_post_fkey" FOREIGN KEY ("root_post_id") REFERENCES "family_schema"."discuss_post_reply"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."discuss_thread" ADD CONSTRAINT "discuss_thread_fk_post_member_id_member_id_fk" FOREIGN KEY ("fk_post_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."discuss_thread" ADD CONSTRAINT "discuss_thread_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."family_activity" ADD CONSTRAINT "family_activity_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."family_activity" ADD CONSTRAINT "family_activity_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."family_feature_config" ADD CONSTRAINT "family_feature_config_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."family_feature_config" ADD CONSTRAINT "family_feature_config_fk_feature_id_feature_reference_id_fk" FOREIGN KEY ("fk_feature_id") REFERENCES "global_schema"."feature_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."family_invitation" ADD CONSTRAINT "family_invitation_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."family_s3_credentials" ADD CONSTRAINT "family_s3_credentials_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_album" ADD CONSTRAINT "gallery_album_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_album_photo_comment" ADD CONSTRAINT "gallery_album_photo_comment_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_album_photo_comment" ADD CONSTRAINT "gallery_album_photo_comment_fk_gallery_album_id_gallery_album_id_fk" FOREIGN KEY ("fk_gallery_album_id") REFERENCES "family_schema"."gallery_album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_album_photo" ADD CONSTRAINT "gallery_album_photo_fk_photo_id_gallery_photo_id_fk" FOREIGN KEY ("fk_photo_id") REFERENCES "family_schema"."gallery_photo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_album_photo" ADD CONSTRAINT "gallery_album_photo_fk_album_id_gallery_album_id_fk" FOREIGN KEY ("fk_album_id") REFERENCES "family_schema"."gallery_album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_album_photo" ADD CONSTRAINT "gallery_album_photo_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_album_photo_like" ADD CONSTRAINT "gallery_album_photo_like_fk_gallery_album_photo_id_gallery_album_photo_id_fk" FOREIGN KEY ("fk_gallery_album_photo_id") REFERENCES "family_schema"."gallery_album_photo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_album_photo_like" ADD CONSTRAINT "gallery_album_photo_like_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."gallery_photo" ADD CONSTRAINT "gallery_photo_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."game_player_round" ADD CONSTRAINT "game_player_round_fk_game_id_game_state_id_fk" FOREIGN KEY ("fk_game_id") REFERENCES "family_schema"."game_state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."game_player_round" ADD CONSTRAINT "game_player_round_fk_game_player_id_game_player_state_id_fk" FOREIGN KEY ("fk_game_player_id") REFERENCES "family_schema"."game_player_state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."game_player_state" ADD CONSTRAINT "game_player_state_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."game_player_state" ADD CONSTRAINT "game_player_state_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."game_state" ADD CONSTRAINT "game_state_fk_game_meta_id_game_metadata_id_fk" FOREIGN KEY ("fk_game_meta_id") REFERENCES "family_schema"."game_metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."game_state" ADD CONSTRAINT "game_state_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."guided_member_tour_progress" ADD CONSTRAINT "guided_member_tour_progress_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."guided_member_tour_progress" ADD CONSTRAINT "guided_member_tour_progress_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."guided_member_tour_progress" ADD CONSTRAINT "guided_member_tour_progress_fk_tour_id_guided_tour_reference_id_fk" FOREIGN KEY ("fk_tour_id") REFERENCES "global_schema"."guided_tour_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."guided_member_tour_step_progress" ADD CONSTRAINT "guided_member_tour_step_progress_fk_member_tour_progress_id_guided_member_tour_progress_id_fk" FOREIGN KEY ("fk_member_tour_progress_id") REFERENCES "family_schema"."guided_member_tour_progress"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."guided_member_tour_step_progress" ADD CONSTRAINT "guided_member_tour_step_progress_fk_step_id_guided_tour_step_reference_id_fk" FOREIGN KEY ("fk_step_id") REFERENCES "global_schema"."guided_tour_step_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."member" ADD CONSTRAINT "member_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."member_option" ADD CONSTRAINT "member_option_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."member_option" ADD CONSTRAINT "member_option_fk_option_id_member_option_reference_id_fk" FOREIGN KEY ("fk_option_id") REFERENCES "global_schema"."member_option_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."movie" ADD CONSTRAINT "movie_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."movie" ADD CONSTRAINT "movie_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."movie_comment" ADD CONSTRAINT "movie_comment_fk_movie_id_movie_id_fk" FOREIGN KEY ("fk_movie_id") REFERENCES "family_schema"."movie"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."movie_comment" ADD CONSTRAINT "movie_comment_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."movie_like" ADD CONSTRAINT "movie_like_fk_movie_id_movie_id_fk" FOREIGN KEY ("fk_movie_id") REFERENCES "family_schema"."movie"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."movie_like" ADD CONSTRAINT "movie_like_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."movie_tag" ADD CONSTRAINT "movie_tag_fk_movie_id_movie_id_fk" FOREIGN KEY ("fk_movie_id") REFERENCES "family_schema"."movie"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."movie_tag" ADD CONSTRAINT "movie_tag_fk_tag_id_movie_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "global_schema"."movie_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music" ADD CONSTRAINT "music_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music" ADD CONSTRAINT "music_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_comment" ADD CONSTRAINT "music_comment_fk_music_id_music_id_fk" FOREIGN KEY ("fk_music_id") REFERENCES "family_schema"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_comment" ADD CONSTRAINT "music_comment_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_like" ADD CONSTRAINT "music_like_fk_music_id_music_id_fk" FOREIGN KEY ("fk_music_id") REFERENCES "family_schema"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_like" ADD CONSTRAINT "music_like_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_lyrics" ADD CONSTRAINT "music_lyrics_fk_music_id_music_id_fk" FOREIGN KEY ("fk_music_id") REFERENCES "family_schema"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_lyrics" ADD CONSTRAINT "music_lyrics_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_tag" ADD CONSTRAINT "music_tag_fk_music_id_music_id_fk" FOREIGN KEY ("fk_music_id") REFERENCES "family_schema"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_tag" ADD CONSTRAINT "music_tag_fk_tag_id_music_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "global_schema"."music_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_template" ADD CONSTRAINT "music_template_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."music_template" ADD CONSTRAINT "music_template_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."password_reset" ADD CONSTRAINT "password_reset_fk_user_id_user_id_fk" FOREIGN KEY ("fk_user_id") REFERENCES "family_schema"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem" ADD CONSTRAINT "poem_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem" ADD CONSTRAINT "poem_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem_category_tag" ADD CONSTRAINT "poem_category_tag_fk_poem_id_poem_id_fk" FOREIGN KEY ("fk_poem_id") REFERENCES "family_schema"."poem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem_category_tag" ADD CONSTRAINT "poem_category_tag_fk_tag_id_poem_category_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "global_schema"."poem_category_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem_comment" ADD CONSTRAINT "poem_comment_fk_poem_verse_id_poem_verse_id_fk" FOREIGN KEY ("fk_poem_verse_id") REFERENCES "family_schema"."poem_verse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem_comment" ADD CONSTRAINT "poem_comment_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem_like" ADD CONSTRAINT "poem_like_fk_poem_id_poem_id_fk" FOREIGN KEY ("fk_poem_id") REFERENCES "family_schema"."poem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem_like" ADD CONSTRAINT "poem_like_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."poem_verse" ADD CONSTRAINT "poem_verse_fk_poem_id_poem_id_fk" FOREIGN KEY ("fk_poem_id") REFERENCES "family_schema"."poem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."pwa_mutation_request" ADD CONSTRAINT "pwa_mutation_request_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."pwa_mutation_request" ADD CONSTRAINT "pwa_mutation_request_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe" ADD CONSTRAINT "recipe_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe" ADD CONSTRAINT "recipe_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe" ADD CONSTRAINT "recipe_fk_template_id_recipe_template_id_fk" FOREIGN KEY ("fk_template_id") REFERENCES "family_schema"."recipe_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe_comment" ADD CONSTRAINT "recipe_comment_fk_recipe_id_recipe_id_fk" FOREIGN KEY ("fk_recipe_id") REFERENCES "family_schema"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe_comment" ADD CONSTRAINT "recipe_comment_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe_like" ADD CONSTRAINT "recipe_like_fk_recipe_id_recipe_id_fk" FOREIGN KEY ("fk_recipe_id") REFERENCES "family_schema"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe_like" ADD CONSTRAINT "recipe_like_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe_tag" ADD CONSTRAINT "recipe_tag_fk_recipe_id_recipe_id_fk" FOREIGN KEY ("fk_recipe_id") REFERENCES "family_schema"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe_tag" ADD CONSTRAINT "recipe_tag_fk_tag_id_recipe_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "family_schema"."recipe_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe_template" ADD CONSTRAINT "recipe_template_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."recipe_template" ADD CONSTRAINT "recipe_template_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "family_schema"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show" ADD CONSTRAINT "show_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show" ADD CONSTRAINT "show_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show_comment" ADD CONSTRAINT "show_comment_fk_show_id_show_id_fk" FOREIGN KEY ("fk_show_id") REFERENCES "family_schema"."show"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show_comment" ADD CONSTRAINT "show_comment_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show_like" ADD CONSTRAINT "show_like_fk_show_id_show_id_fk" FOREIGN KEY ("fk_show_id") REFERENCES "family_schema"."show"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show_like" ADD CONSTRAINT "show_like_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show_tag" ADD CONSTRAINT "show_tag_fk_show_id_show_id_fk" FOREIGN KEY ("fk_show_id") REFERENCES "family_schema"."show"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show_tag" ADD CONSTRAINT "show_tag_fk_tag_id_show_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "global_schema"."show_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."show_template" ADD CONSTRAINT "show_template_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_conversation" ADD CONSTRAINT "thread_conversation_fk_sender_member_id_member_id_fk" FOREIGN KEY ("fk_sender_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_conversation" ADD CONSTRAINT "thread_conversation_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_conversation_tag" ADD CONSTRAINT "thread_conversation_tag_fk_tag_id_thread_tag_reference_id_fk" FOREIGN KEY ("fk_tag_id") REFERENCES "family_schema"."thread_tag_reference"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_conversation_tag" ADD CONSTRAINT "thread_conversation_tag_fk_conversation_id_thread_conversation_id_fk" FOREIGN KEY ("fk_conversation_id") REFERENCES "family_schema"."thread_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_post_attachment" ADD CONSTRAINT "thread_post_attachment_fk_post_id_thread_post_reply_id_fk" FOREIGN KEY ("fk_post_id") REFERENCES "family_schema"."thread_post_reply"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_post_reply" ADD CONSTRAINT "thread_post_reply_fk_conversation_id_thread_conversation_id_fk" FOREIGN KEY ("fk_conversation_id") REFERENCES "family_schema"."thread_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_post_reply" ADD CONSTRAINT "thread_post_reply_fk_author_member_id_member_id_fk" FOREIGN KEY ("fk_author_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_post_reply" ADD CONSTRAINT "thread_post_reply_parent_post_fkey" FOREIGN KEY ("parent_post_id") REFERENCES "family_schema"."thread_post_reply"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_post_reply" ADD CONSTRAINT "thread_post_reply_root_post_fkey" FOREIGN KEY ("root_post_id") REFERENCES "family_schema"."thread_post_reply"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_recipient_state" ADD CONSTRAINT "thread_recipient_state_fk_conversation_id_thread_conversation_id_fk" FOREIGN KEY ("fk_conversation_id") REFERENCES "family_schema"."thread_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_recipient_state" ADD CONSTRAINT "thread_recipient_state_fk_recipient_member_id_member_id_fk" FOREIGN KEY ("fk_recipient_member_id") REFERENCES "family_schema"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."thread_recipient_state" ADD CONSTRAINT "thread_recipient_state_last_viewed_post_fkey" FOREIGN KEY ("last_viewed_post_id") REFERENCES "family_schema"."thread_recipient_state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."user" ADD CONSTRAINT "user_fk_family_id_family_id_fk" FOREIGN KEY ("fk_family_id") REFERENCES "family_schema"."family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."user" ADD CONSTRAINT "user_fk_member_id_member_id_fk" FOREIGN KEY ("fk_member_id") REFERENCES "family_schema"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_schema"."user_2fa_code" ADD CONSTRAINT "user_2fa_code_fk_user_id_user_id_fk" FOREIGN KEY ("fk_user_id") REFERENCES "family_schema"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_member_id_idx" ON "family_schema"."book" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "book_family_id_idx" ON "family_schema"."book" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "book_category_tag_book_id_idx" ON "family_schema"."book_category_tag" USING btree ("fk_book_id");--> statement-breakpoint
CREATE INDEX "book_category_tag_reference_id_idx" ON "family_schema"."book_category_tag" USING btree ("fk_tag_id");--> statement-breakpoint
CREATE INDEX "book_comment_book_id_idx" ON "family_schema"."book_comment" USING btree ("fk_book_id");--> statement-breakpoint
CREATE INDEX "book_comment_member_id_idx" ON "family_schema"."book_comment" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "book_like_book_id_idx" ON "family_schema"."book_like" USING btree ("fk_book_id");--> statement-breakpoint
CREATE INDEX "book_like_member_id_idx" ON "family_schema"."book_like" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "club_family_id_idx" ON "family_schema"."club" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "club_club_founder_id_idx" ON "family_schema"."club" USING btree ("fk_club_founder_id");--> statement-breakpoint
CREATE INDEX "club_session_moderator_id_idx" ON "family_schema"."club_session" USING btree ("fk_post_member_id");--> statement-breakpoint
CREATE INDEX "club_session_club_id_idx" ON "family_schema"."club_session" USING btree ("fk_club_id");--> statement-breakpoint
CREATE INDEX "discuss_like_discuss_post_id_idx" ON "family_schema"."discuss_like" USING btree ("fk_discuss_post_id");--> statement-breakpoint
CREATE INDEX "discuss_like_member_id_idx" ON "family_schema"."discuss_like" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "discuss_post_reply_discuss_thread_seq_idx" ON "family_schema"."discuss_post_reply" USING btree ("fk_discuss_thread_id","seq_no");--> statement-breakpoint
CREATE INDEX "discuss_post_reply_discuss_thread_idx" ON "family_schema"."discuss_post_reply" USING btree ("fk_discuss_thread_id");--> statement-breakpoint
CREATE INDEX "discuss_post_reply_parent_post_idx" ON "family_schema"."discuss_post_reply" USING btree ("parent_post_id");--> statement-breakpoint
CREATE INDEX "discuss_post_reply_author_created_idx" ON "family_schema"."discuss_post_reply" USING btree ("fk_author_member_id");--> statement-breakpoint
CREATE INDEX "discuss_thread_family_created_idx" ON "family_schema"."discuss_thread" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "discuss_thread_post_member_created_idx" ON "family_schema"."discuss_thread" USING btree ("fk_post_member_id");--> statement-breakpoint
CREATE INDEX "discuss_thread_target_id_idx" ON "family_schema"."discuss_thread" USING btree ("fk_target_id","target_type");--> statement-breakpoint
CREATE INDEX "family_activity_family_id_idx" ON "family_schema"."family_activity" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "family_activity_member_id_idx" ON "family_schema"."family_activity" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "family_feature_config_family_id_idx" ON "family_schema"."family_feature_config" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "family_feature_config_feature_id_idx" ON "family_schema"."family_feature_config" USING btree ("fk_feature_id");--> statement-breakpoint
CREATE INDEX "invite_email_idx" ON "family_schema"."family_invitation" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "invite_token_idx" ON "family_schema"."family_invitation" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "family_s3_credentials_family_id_idx" ON "family_schema"."family_s3_credentials" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "family_s3_active_credential_idx" ON "family_schema"."family_s3_credentials" USING btree ("fk_family_id","is_active");--> statement-breakpoint
CREATE INDEX "gallery_album_member_id_idx" ON "family_schema"."gallery_album" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "gallery_album_comment_member_id_idx" ON "family_schema"."gallery_album_photo_comment" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "gallery_album_comment_gallery_album_id_idx" ON "family_schema"."gallery_album_photo_comment" USING btree ("fk_gallery_album_id");--> statement-breakpoint
CREATE INDEX "gallery_album_photo_member_id_idx" ON "family_schema"."gallery_album_photo" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "gallery_album_photo_photo_id_idx" ON "family_schema"."gallery_album_photo" USING btree ("fk_photo_id");--> statement-breakpoint
CREATE INDEX "gallery_album_photo_album_id_idx" ON "family_schema"."gallery_album_photo" USING btree ("fk_album_id");--> statement-breakpoint
CREATE INDEX "gallery_album_photo_like_gallery_album_photo_id_idx" ON "family_schema"."gallery_album_photo_like" USING btree ("fk_gallery_album_photo_id");--> statement-breakpoint
CREATE INDEX "gallery_album_photo_like_member_id_idx" ON "family_schema"."gallery_album_photo_like" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "gallery_photo_member_id_idx" ON "family_schema"."gallery_photo" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "game_player_round_game_player_id_idx" ON "family_schema"."game_player_round" USING btree ("fk_game_player_id");--> statement-breakpoint
CREATE INDEX "game_player_round_game_id_idx" ON "family_schema"."game_player_round" USING btree ("fk_game_id");--> statement-breakpoint
CREATE INDEX "game_player_state_member_id_idx" ON "family_schema"."game_player_state" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "game_player_state_family_id_idx" ON "family_schema"."game_player_state" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "game_state_metadata_id_idx" ON "family_schema"."game_state" USING btree ("fk_game_meta_id");--> statement-breakpoint
CREATE INDEX "game_state_family_id_idx" ON "family_schema"."game_state" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "member_tour_progress_member_status_updated_idx" ON "family_schema"."guided_member_tour_progress" USING btree ("fk_member_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "member_tour_progress_family_member_idx" ON "family_schema"."guided_member_tour_progress" USING btree ("fk_family_id","fk_member_id");--> statement-breakpoint
CREATE INDEX "member_tour_step_progress_member_progress_status_idx" ON "family_schema"."guided_member_tour_step_progress" USING btree ("fk_member_tour_progress_id","status");--> statement-breakpoint
CREATE INDEX "member_tour_step_progress_step_no_idx" ON "family_schema"."guided_member_tour_step_progress" USING btree ("step_no");--> statement-breakpoint
CREATE INDEX "member_email_idx" ON "family_schema"."member" USING btree ("email");--> statement-breakpoint
CREATE INDEX "movie_member_id_idx" ON "family_schema"."movie" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "movie_family_id_idx" ON "family_schema"."movie" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "movie_comment_movie_id_idx" ON "family_schema"."movie_comment" USING btree ("fk_movie_id");--> statement-breakpoint
CREATE INDEX "movie_comment_member_id_idx" ON "family_schema"."movie_comment" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "movie_like_movie_id_idx" ON "family_schema"."movie_like" USING btree ("fk_movie_id");--> statement-breakpoint
CREATE INDEX "movie_like_member_id_idx" ON "family_schema"."movie_like" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "movie_tag_movie_id_idx" ON "family_schema"."movie_tag" USING btree ("fk_movie_id");--> statement-breakpoint
CREATE INDEX "movie_tag_tag_id_idx" ON "family_schema"."movie_tag" USING btree ("fk_tag_id");--> statement-breakpoint
CREATE INDEX "movie_template_member_id_idx" ON "family_schema"."movie_template" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "movie_template_family_id_idx" ON "family_schema"."movie_template" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "music_member_id_idx" ON "family_schema"."music" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "music_family_id_idx" ON "family_schema"."music" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "music_comment_music_id_idx" ON "family_schema"."music_comment" USING btree ("fk_music_id");--> statement-breakpoint
CREATE INDEX "music_comment_member_id_idx" ON "family_schema"."music_comment" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "music_like_music_id_idx" ON "family_schema"."music_like" USING btree ("fk_music_id");--> statement-breakpoint
CREATE INDEX "music_like_member_id_idx" ON "family_schema"."music_like" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "music_lyrics_music_id_idx" ON "family_schema"."music_lyrics" USING btree ("fk_music_id");--> statement-breakpoint
CREATE INDEX "music_lyrics_member_id_idx" ON "family_schema"."music_lyrics" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "music_tag_music_id_idx" ON "family_schema"."music_tag" USING btree ("fk_music_id");--> statement-breakpoint
CREATE INDEX "music_tag_tag_id_idx" ON "family_schema"."music_tag" USING btree ("fk_tag_id");--> statement-breakpoint
CREATE INDEX "music_template_member_id_idx" ON "family_schema"."music_template" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "music_template_family_id_idx" ON "family_schema"."music_template" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "reset_token_idx" ON "family_schema"."password_reset" USING btree ("token");--> statement-breakpoint
CREATE INDEX "poem_member_id_idx" ON "family_schema"."poem" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "poem_family_id_idx" ON "family_schema"."poem" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "poem_category_tag_poem_id_idx" ON "family_schema"."poem_category_tag" USING btree ("fk_poem_id");--> statement-breakpoint
CREATE INDEX "poem_category_tag_reference_id_idx" ON "family_schema"."poem_category_tag" USING btree ("fk_tag_id");--> statement-breakpoint
CREATE INDEX "poem_comment_poem_verse_id_idx" ON "family_schema"."poem_comment" USING btree ("fk_poem_verse_id");--> statement-breakpoint
CREATE INDEX "poem_comment_member_id_idx" ON "family_schema"."poem_comment" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "poem_like_poem_id_idx" ON "family_schema"."poem_like" USING btree ("fk_poem_id");--> statement-breakpoint
CREATE INDEX "poem_like_member_id_idx" ON "family_schema"."poem_like" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "poem_verse_poem_id_idx" ON "family_schema"."poem_verse" USING btree ("fk_poem_id");--> statement-breakpoint
CREATE INDEX "pwa_mutation_request_family_id_idx" ON "family_schema"."pwa_mutation_request" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "pwa_mutation_request_member_id_idx" ON "family_schema"."pwa_mutation_request" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "recipe_member_id_idx" ON "family_schema"."recipe" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "recipe_family_id_idx" ON "family_schema"."recipe" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "recipe_template_id_idx" ON "family_schema"."recipe" USING btree ("fk_template_id");--> statement-breakpoint
CREATE INDEX "recipe_comment_recipe_id_idx" ON "family_schema"."recipe_comment" USING btree ("fk_recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_comment_member_id_idx" ON "family_schema"."recipe_comment" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "recipe_like_recipe_id_idx" ON "family_schema"."recipe_like" USING btree ("fk_recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_like_member_id_idx" ON "family_schema"."recipe_like" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "recipe_tag_recipe_id_idx" ON "family_schema"."recipe_tag" USING btree ("fk_recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_tag_tag_id_idx" ON "family_schema"."recipe_tag" USING btree ("fk_tag_id");--> statement-breakpoint
CREATE INDEX "recipe_template_member_id_idx" ON "family_schema"."recipe_template" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "recipe_template_family_id_idx" ON "family_schema"."recipe_template" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "show_member_id_idx" ON "family_schema"."show" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "show_family_id_idx" ON "family_schema"."show" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "show_comment_show_id_idx" ON "family_schema"."show_comment" USING btree ("fk_show_id");--> statement-breakpoint
CREATE INDEX "show_comment_member_id_idx" ON "family_schema"."show_comment" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "show_like_show_id_idx" ON "family_schema"."show_like" USING btree ("fk_show_id");--> statement-breakpoint
CREATE INDEX "show_like_member_id_idx" ON "family_schema"."show_like" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "show_tag_show_id_idx" ON "family_schema"."show_tag" USING btree ("fk_show_id");--> statement-breakpoint
CREATE INDEX "show_tag_tag_id_idx" ON "family_schema"."show_tag" USING btree ("fk_tag_id");--> statement-breakpoint
CREATE INDEX "show_template_member_id_idx" ON "family_schema"."show_template" USING btree ("fk_member_id");--> statement-breakpoint
CREATE INDEX "show_template_family_id_idx" ON "family_schema"."show_template" USING btree ("fk_family_id");--> statement-breakpoint
CREATE INDEX "thread_conversation_family_created_idx" ON "family_schema"."thread_conversation" USING btree ("fk_family_id","created_at");--> statement-breakpoint
CREATE INDEX "thread_conversation_family_status_created_idx" ON "family_schema"."thread_conversation" USING btree ("fk_family_id","status","created_at");--> statement-breakpoint
CREATE INDEX "thread_conversation_sender_created_idx" ON "family_schema"."thread_conversation" USING btree ("fk_sender_member_id","created_at");--> statement-breakpoint
CREATE INDEX "thread_conversation_tag_idx" ON "family_schema"."thread_conversation_tag" USING btree ("fk_conversation_id","fk_tag_id");--> statement-breakpoint
CREATE INDEX "thread_post_attachment_post_idx" ON "family_schema"."thread_post_attachment" USING btree ("fk_post_id");--> statement-breakpoint
CREATE INDEX "thread_post_attachment_object_key_idx" ON "family_schema"."thread_post_attachment" USING btree ("s3_object_key");--> statement-breakpoint
CREATE INDEX "thread_post_reply_conversation_seq_idx" ON "family_schema"."thread_post_reply" USING btree ("fk_conversation_id","seq_no");--> statement-breakpoint
CREATE INDEX "thread_post_reply_conversation_created_idx" ON "family_schema"."thread_post_reply" USING btree ("fk_conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "thread_post_reply_parent_post_idx" ON "family_schema"."thread_post_reply" USING btree ("parent_post_id");--> statement-breakpoint
CREATE INDEX "thread_post_reply_author_created_idx" ON "family_schema"."thread_post_reply" USING btree ("fk_author_member_id","created_at");--> statement-breakpoint
CREATE INDEX "thread_recipient_state_conversation_recipient_idx" ON "family_schema"."thread_recipient_state" USING btree ("fk_conversation_id","fk_recipient_member_id");--> statement-breakpoint
CREATE INDEX "thread_recipient_state_conversation_created_idx" ON "family_schema"."thread_recipient_state" USING btree ("fk_conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "thread_recipient_state_recipient_read_archive_idx" ON "family_schema"."thread_recipient_state" USING btree ("fk_recipient_member_id","read_at","archived_at");
-- Move tables from public schema to family_schema and global_schema.
-- Generated from:
--   src/components/db/schema/family-social-schema-tables.ts
--   src/components/db/schema/global-schema-tables.ts

BEGIN;

CREATE SCHEMA IF NOT EXISTS family_schema;
CREATE SCHEMA IF NOT EXISTS global_schema;

-- Family-social tables: public -> family_schema
ALTER TABLE public.account SET SCHEMA family_schema;
ALTER TABLE public.session SET SCHEMA family_schema;
ALTER TABLE public."user" SET SCHEMA family_schema;
ALTER TABLE public.password_reset SET SCHEMA family_schema;
ALTER TABLE public.family SET SCHEMA family_schema;
ALTER TABLE public.family_invitation SET SCHEMA family_schema;
ALTER TABLE public.feature_reference SET SCHEMA family_schema;
ALTER TABLE public.family_feature_config SET SCHEMA family_schema;
ALTER TABLE public.family_activity SET SCHEMA family_schema;
ALTER TABLE public.pwa_mutation_request SET SCHEMA family_schema;
ALTER TABLE public.family_s3_credentials SET SCHEMA family_schema;
ALTER TABLE public.member SET SCHEMA family_schema;
ALTER TABLE public.member_option SET SCHEMA family_schema;
ALTER TABLE public.option_reference SET SCHEMA family_schema;
ALTER TABLE public.club SET SCHEMA family_schema;
ALTER TABLE public.club_session SET SCHEMA family_schema;
ALTER TABLE public.discuss_thread SET SCHEMA family_schema;
ALTER TABLE public.discuss_post_reply SET SCHEMA family_schema;
ALTER TABLE public.discuss_like SET SCHEMA family_schema;
ALTER TABLE public.thread_tag_reference SET SCHEMA family_schema;
ALTER TABLE public.thread_conversation_tag SET SCHEMA family_schema;
ALTER TABLE public.thread_conversation SET SCHEMA family_schema;
ALTER TABLE public.thread_post_reply SET SCHEMA family_schema;
ALTER TABLE public.thread_post_attachment SET SCHEMA family_schema;
ALTER TABLE public.thread_recipient_state SET SCHEMA family_schema;
ALTER TABLE public.thread_template SET SCHEMA family_schema;
ALTER TABLE public.gallery_photo SET SCHEMA family_schema;
ALTER TABLE public.gallery_album SET SCHEMA family_schema;
ALTER TABLE public.gallery_album_photo SET SCHEMA family_schema;
ALTER TABLE public.gallery_album_photo_like SET SCHEMA family_schema;
ALTER TABLE public.gallery_album_photo_comment SET SCHEMA family_schema;
ALTER TABLE public.game_metadata SET SCHEMA family_schema;
ALTER TABLE public.game_state SET SCHEMA family_schema;
ALTER TABLE public.game_player_state SET SCHEMA family_schema;
ALTER TABLE public.game_player_round SET SCHEMA family_schema;
ALTER TABLE public.poem SET SCHEMA family_schema;
ALTER TABLE public.poem_verse SET SCHEMA family_schema;
ALTER TABLE public.poem_comment SET SCHEMA family_schema;
ALTER TABLE public.poem_category_tag SET SCHEMA family_schema;
ALTER TABLE public.poem_like SET SCHEMA family_schema;
ALTER TABLE public.book SET SCHEMA family_schema;
ALTER TABLE public.book_comment SET SCHEMA family_schema;
ALTER TABLE public.book_category_tag SET SCHEMA family_schema;
ALTER TABLE public.book_like SET SCHEMA family_schema;
ALTER TABLE public.recipe SET SCHEMA family_schema;
ALTER TABLE public.recipe_comment SET SCHEMA family_schema;
ALTER TABLE public.recipe_template SET SCHEMA family_schema;
ALTER TABLE public.recipe_tag_reference SET SCHEMA family_schema;
ALTER TABLE public.recipe_tag SET SCHEMA family_schema;
ALTER TABLE public.recipe_like SET SCHEMA family_schema;
ALTER TABLE public.recipe_term SET SCHEMA family_schema;
ALTER TABLE public.show SET SCHEMA family_schema;
ALTER TABLE public.show_comment SET SCHEMA family_schema;
ALTER TABLE public.show_template SET SCHEMA family_schema;
ALTER TABLE public.show_tag SET SCHEMA family_schema;
ALTER TABLE public.show_like SET SCHEMA family_schema;
ALTER TABLE public.movie SET SCHEMA family_schema;
ALTER TABLE public.movie_comment SET SCHEMA family_schema;
ALTER TABLE public.movie_template SET SCHEMA family_schema;
ALTER TABLE public.movie_tag SET SCHEMA family_schema;
ALTER TABLE public.movie_like SET SCHEMA family_schema;
ALTER TABLE public.music SET SCHEMA family_schema;
ALTER TABLE public.music_comment SET SCHEMA family_schema;
ALTER TABLE public.music_lyrics SET SCHEMA family_schema;
ALTER TABLE public.music_template SET SCHEMA family_schema;
ALTER TABLE public.music_tag SET SCHEMA family_schema;
ALTER TABLE public.music_like SET SCHEMA family_schema;

-- Global tables: public -> global_schema
ALTER TABLE public.book_category_reference SET SCHEMA global_schema;
ALTER TABLE public.book_category_tag_reference SET SCHEMA global_schema;
ALTER TABLE public.book_term SET SCHEMA global_schema;
ALTER TABLE public.movie_tag_reference SET SCHEMA global_schema;
ALTER TABLE public.music_tag_reference SET SCHEMA global_schema;
ALTER TABLE public.poem_category_reference SET SCHEMA global_schema;
ALTER TABLE public.poem_category_tag_reference SET SCHEMA global_schema;
ALTER TABLE public.poem_term SET SCHEMA global_schema;
ALTER TABLE public.show_tag_reference SET SCHEMA global_schema;
ALTER TABLE public.support_environment SET SCHEMA global_schema;
ALTER TABLE public.support_family SET SCHEMA global_schema;
ALTER TABLE public.support_issue SET SCHEMA global_schema;
ALTER TABLE public.support_response SET SCHEMA global_schema;
ALTER TABLE public.support_attachment SET SCHEMA global_schema;
ALTER TABLE public.support_team SET SCHEMA global_schema;
ALTER TABLE public.support_person SET SCHEMA global_schema;
ALTER TABLE public.support_person_issue SET SCHEMA global_schema;
ALTER TABLE public.video_s3_credentials SET SCHEMA global_schema;
ALTER TABLE public.video SET SCHEMA global_schema;
ALTER TABLE public.video_tag_reference SET SCHEMA global_schema;
ALTER TABLE public.video_tag SET SCHEMA global_schema;

COMMIT;

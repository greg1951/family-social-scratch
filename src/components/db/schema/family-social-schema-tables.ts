import { serial, pgTable, index, text, timestamp, boolean, integer, pgEnum, foreignKey, unique } from "drizzle-orm/pg-core";
import {not, sql } from 'drizzle-orm';
import { number } from "zod";

export const familyStatus = pgEnum('status', ['trial', 'active', 'expired']);
export const inviteStatus = pgEnum('status', ['invited', 'joined', 'resend', 'declined']);
export const memberStatus = pgEnum('status', ['active', 'resigned']);
export const optionReferenceCategory = pgEnum('category', [
  'feature', 'notification', 'admin', 'other'
]);


export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  twoFactorSecret: text("2fa_secret"),
  twoFactorActivated: boolean("2fa_activated").default(false),
  familyId: integer("fk_family_id").notNull().references(() => family.id),
  memberId: integer("fk_member_id").references(() => member.id),
});

export const passwordReset = pgTable("password_reset", {
  id: serial("id").primaryKey(),
  userId: integer("fk_user_id").notNull().references(() => user.id, {onDelete: "cascade"}).unique(),
  token: text("token").notNull(),
  tokenExpiry: timestamp("token_expiry"),
}, (table) => [
  index('reset_token_idx').on(table.token),
]);

export const family = pgTable("family", {
  id: serial("id").primaryKey(),
  name: text("family_name").notNull().unique(),
  status: text("status").notNull().default("trial"),
  expirationDate: timestamp("expiration_date").default(sql`CURRENT_DATE + INTERVAL '14 days'`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const familyInvitation = pgTable("family_invitation", {
  id: serial("id").primaryKey(),
  email: text("invited_email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  status: text("status").notNull().default("invited"),
  expirationDate: timestamp("expiration_date").notNull().default(sql`CURRENT_DATE + INTERVAL '7 days'`),
  secret: text("secret"),
  inviteToken: text("invite_token"),
  familyId: integer("fk_family_id").notNull().references(() => family.id, {onDelete: 'cascade'}),
  createdAt: timestamp("created_at").defaultNow(),
  statusUpdate: timestamp("status_update"),
}, (table) => [
  index('invite_email_idx').on(table.email),
  index('invite_token_idx').on(table.inviteToken),
]);

export const member = pgTable("member", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nickName: text("nick_name").notNull().default(""),
  email: text("email").notNull(),
  birthday: text("birthday").notNull().default("01/01/1970"),
  cellPhone: text("cell_phone").notNull().default("(000) 000-0000"),
  familyId: integer("fk_family_id").notNull().references(() => family.id),
  status: text("status").notNull().default("active"),
  isFounder: boolean("is_family_founder").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index('member_email_idx').on(table.email),
]);


export const memberOption = pgTable("member_option", {
  id: serial("id").primaryKey(),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'cascade'}),
  optionId: integer("fk_option_id").notNull().references(() => optionReference.id, {onDelete: 'cascade'}),
  isSelected: boolean("is_selected").notNull().default(false),
});

export const optionReference = pgTable("option_reference", {
  id: serial("id").primaryKey(),
  optionName: text("option_name").notNull(),
  category: text("category").notNull().default("feature"),
  seqNo: integer("seq_no").notNull().default(1),
  isSelected: boolean("is_selected").notNull().default(false),
});

/*------------------------------- Family Threads Schema ------------------------------ */
export const threadVisibility = pgEnum('visibility', ['public', 'private']);
export const conversationStatus = pgEnum('status', ['active', 'archived', 'closed']);
export const postReplyType = pgEnum('type', ['post', 'reply']);
export const deliveryType = pgEnum('delivery_type', ['threads', 'email', 'sms']);
export const tagName = pgEnum('tag_name', [
  'tv', 'movie', 'music', 'books', 'poetry', 'recipe', 'games', 
  'founder', 'member', 'admin', 'suggestion', 'bug', 'question', 'other',
]);

export const threadTagReference = pgTable("thread_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull(),
  tagDesc: text("tag_description"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),  
});


export const threadConversationTag = pgTable("thread_conversation_tag", {
  id: serial("id").primaryKey(),
  tagId: integer("fk_tag_id").notNull().references(() => threadTagReference.id, {onDelete: 'cascade'}),
  conversationId: integer("fk_conversation_id").notNull().references(() => threadConversation.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('thread_conversation_tag_idx').on(table.conversationId, table.tagId),
    // unique().on(table.conversationId, table.tagId),
]);

export const threadConversation = pgTable("thread_conversation", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  visibility: text("visibility").notNull().default("private"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  subject: text("subject"),
  primaryCategory: text("primary_category"),
  closedAt: timestamp("closed_at"),
  archivedAt: timestamp("archived_at"),
  archiveBatchId: integer("archive_batch_id"),
  archiveObjectKey: text("archive_object_key"),
  senderMemberId: integer("fk_sender_member_id").references(() => member.id),
  familyId: integer("fk_family_id").notNull().references(() => family.id),
});

export const threadPostReply = pgTable("thread_post_reply", {
  id: serial("id").primaryKey(),
  conversationId: integer("fk_conversation_id").notNull().references(() => threadConversation.id),
  authorMemberId: integer("fk_author_member_id").notNull().references(() => member.id),
  type: text("type").notNull().default("post"),
  content: text("content").notNull(),
  seqNo: integer("seq_no").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  softDeletedAt: timestamp("soft_deleted_at"),
  parentPostId: integer("parent_post_id"),
  rootPostId: integer("root_post_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.parentPostId],
      foreignColumns: [table.id],
      name: "thread_post_reply_parent_post_fkey",
    }),
    foreignKey({
      columns: [table.rootPostId],
      foreignColumns: [table.id],
      name: "thread_post_reply_root_post_fkey",
    }),
    index('thread_post_reply_conversation_seq_idx').on(table.conversationId, table.seqNo),
    index('thread_post_reply_conversation_created_idx').on(table.conversationId, table.createdAt),
]);

export const threadRecipientState = pgTable("thread_recipient_state", {
  id: serial("id").primaryKey(),
  conversationId: integer("fk_conversation_id").notNull().references(() => threadConversation.id),
  recipientMemberId: integer("fk_recipient_member_id").notNull().references(() => member.id),
  deliveryType: text("delivery_type").notNull().default("threads"),
  readAt: timestamp("read_at"),
  archivedAt: timestamp("archived_at"),
  archiveBatchId: integer("archive_batch_id"),
  archiveObjectKey: text("archive_object_key"),
  createdAt: timestamp("created_at").defaultNow(),
  lastViewedPostId: integer("last_viewed_post_id"),
},
  (table) => [
    foreignKey({
      columns: [table.lastViewedPostId],
      foreignColumns: [table.id],
      name: "thread_recipient_state_last_viewed_post_fkey",
    }),
    index('thread_recipient_state_conversation_recipient_idx').on(table.conversationId, table.recipientMemberId),
    index('thread_recipient_state_conversation_created_idx').on(table.conversationId, table.createdAt),
]);

/*------------------------------- Games Scoreboard ------------------------------ */
export const gameStatus = pgEnum('game_status', ['active', 'in_progress', 'completed', 'archived']);

export const gameMetadata = pgTable("game_metadata", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  highOrLo: text("high_or_lo").notNull().default("high"),
  isRoundBased: boolean("is_round_based").notNull().default(true),
  maxRounds: integer("max_rounds").notNull().default(12),
});

export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  gameTitle: text("game_title").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  gameMetaId: integer("fk_game_meta_id").notNull().references(() => gameMetadata.id),
  familyId: integer("fk_family_id").notNull().references(() => family.id),
},
  (table) => [
    index('game_state_metadata_id_idx').on(table.gameMetaId),
    index('game_state_family_id_idx').on(table.familyId),
]);

export const gamePlayerState = pgTable("game_player_state", {
  id: serial("id").primaryKey(),
  playPosition: integer("play_position"),
  status: text("status").notNull().default("active"),
  memberId: integer("fk_member_id").notNull().references(() => member.id),
  familyId: integer("fk_family_id").notNull().references(() => family.id),
},
  (table) => [
    index('game_player_state_member_id_idx').on(table.memberId),
    index('game_player_state_family_id_idx').on(table.familyId),
]);


export const gamePlayerRound = pgTable("game_player_round", {
  id: serial("id").primaryKey(),
  roundNo: integer("round_no").notNull().default(1),
  roundScore: integer("round_score").notNull().default(0),
  cumulativeScore: integer("cumulative_score").notNull().default(0),
  gameId: integer("fk_game_id").notNull().references(() => gameState.id),
  gamePlayerId: integer("fk_game_player_id").notNull().references(() => gamePlayerState.id),
},
  (table) => [
    index('game_player_round_game_player_id_idx').on(table.gamePlayerId),
    index('game_player_round_game_id_idx').on(table.gameId),
]);



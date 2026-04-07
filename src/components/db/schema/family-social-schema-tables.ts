import { serial, pgTable, index, text, timestamp, boolean, integer, pgEnum, foreignKey, unique } from "drizzle-orm/pg-core";
import {sql } from 'drizzle-orm';

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
    unique().on(table.conversationId, table.tagId),
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
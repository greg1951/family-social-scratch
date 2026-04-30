// ...existing code...
import { serial, pgTable, index, text, timestamp, boolean, integer, pgEnum, foreignKey, unique } from "drizzle-orm/pg-core";
import {is, like, not, sql } from 'drizzle-orm';
import { number } from "zod";
import { ta } from "date-fns/locale";

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
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
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
  inviteFounderMessage: text("invite_founder_message"),
  familyId: integer("fk_family_id").notNull().references(() => family.id, {onDelete: 'cascade'}),
  createdAt: timestamp("created_at").defaultNow(),
  statusUpdate: timestamp("status_update"),
}, (table) => [
  index('invite_email_idx').on(table.email),
  index('invite_token_idx').on(table.inviteToken),
]);

export const familyActivity = pgTable("family_activity", {
  id: serial("id").primaryKey(),
  actionType: text("action_type").notNull(),
  featureName: text("feature_name").notNull(),
  postName: text("post_name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  familyId: integer("fk_family_id").notNull().references(() => family.id, {onDelete: 'cascade'}),
  memberId: integer("fk_member_id").references(() => member.id),
}, (table) => [
  index('family_activity_family_id_idx').on(table.familyId),
  index('family_activity_member_id_idx').on(table.memberId),

]);

export const familyS3Credentials = pgTable("family_s3_credentials", {
  id: serial("id").primaryKey(),
  encryptedAccessKey: text("encrypted_access_key").notNull(),
  encryptedSecretKey: text("encrypted_secret_key").notNull(),
  bucketName: text("bucket_name").notNull(),
  region: text("region").notNull().default("us-east-2"),  
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  familyId: integer("fk_family_id").notNull().references(() => family.id, {onDelete: 'cascade'}),
}, (table) => [
  index('family_s3_credentials_family_id_idx').on(table.familyId),
  index('family_s3_active_credential_idx').on(table.familyId, table.isActive),
  // uniqueIndex('family_active_credential_uniq').on(table.familyId).where(sql`${table.isActive} = true`),
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
  memberImageUrl: text("member_image_url"),
  isFounder: boolean("is_family_founder").notNull().default(false),
  isGuest: boolean("is_guest").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
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
},
  (table) => [
    index('thread_conversation_family_created_idx').on(table.familyId, table.createdAt),
    index('thread_conversation_family_status_created_idx').on(table.familyId, table.status, table.createdAt),
    index('thread_conversation_sender_created_idx').on(table.senderMemberId, table.createdAt),
]);

export const threadPostReply = pgTable("thread_post_reply", {
  id: serial("id").primaryKey(),
  conversationId: integer("fk_conversation_id").notNull().references(() => threadConversation.id),
  authorMemberId: integer("fk_author_member_id").notNull().references(() => member.id),
  type: text("type").notNull().default("post"),
  content: text("content").notNull(),
  contentJson: text("content_json").notNull().default("{}"),
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
    index('thread_post_reply_parent_post_idx').on(table.parentPostId),
    index('thread_post_reply_author_created_idx').on(table.authorMemberId, table.createdAt),
    unique('thread_post_reply_conversation_seq_uq').on(table.conversationId, table.seqNo),
]);

export const threadPostAttachment = pgTable("thread_post_attachment", {
  id: serial("id").primaryKey(),
  postId: integer("fk_post_id").notNull().references(() => threadPostReply.id, { onDelete: 'cascade' }),
  attachmentType: text("attachment_type").notNull().default("image"),
  s3ObjectKey: text("s3_object_key").notNull(),
  displayUrl: text("display_url"),
  fileName: text("file_name"),
  fileSizeBytes: integer("file_size_bytes"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
},
  (table) => [
    index('thread_post_attachment_post_idx').on(table.postId),
    index('thread_post_attachment_object_key_idx').on(table.s3ObjectKey),
]);

export const threadRecipientState = pgTable("thread_recipient_state", {
  id: serial("id").primaryKey(),
  conversationId: integer("fk_conversation_id").notNull().references(() => threadConversation.id),
  recipientMemberId: integer("fk_recipient_member_id").notNull().references(() => member.id),
  deliveryType: text("delivery_type").notNull().default("threads"),
  readAt: timestamp("read_at"),
  answeredAt: timestamp("answered_at"),
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
    index('thread_recipient_state_recipient_read_archive_idx').on(table.recipientMemberId, table.readAt, table.archivedAt),
    unique('thread_recipient_state_conversation_recipient_uq').on(table.conversationId, table.recipientMemberId),
]);

/*------------------------------- Games Scoreboard ------------------------------ */
//export const gameStatus = pgEnum('game_status', ['active', 'in_progress', 'completed', 'archived']);

export const gameMetadata = pgTable("game_metadata", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  highOrLo: text("high_or_lo").notNull().default("high"),
  scoreUom: text("score_uom").notNull().default("points"),
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

/*------------------------------- Poetry Cafe ------------------------------ */
//export const status = pgEnum('status', ['draft', 'published', 'archived']);

export const poem = pgTable("poem", {
  id: serial("id").primaryKey(),
  poemTitle: text("poem_title").notNull().unique(),
  poetName: text("poet_name").notNull().default("Anonymous"),
  poemSource: text("poem_source").notNull().default("Unknown"),
  poemYear: integer("poem_year").notNull().default(0),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  memberId: integer("fk_member_id").notNull().references(() => member.id),
  familyId: integer("fk_family_id").notNull().references(() => family.id),
},
  (table) => [
    index('poem_member_id_idx').on(table.memberId),
    index('poem_family_id_idx').on(table.familyId),
  ]
);

export const poemVerse = pgTable("poem_verse", {
  id: serial("id").primaryKey(),
  verseJson: text("verse_json").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  poemId: integer("fk_poem_id").notNull().references(() => poem.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('poem_verse_poem_id_idx').on(table.poemId),
  ]
);

export const poemComment = pgTable("poem_comment", {
  id: serial("id").primaryKey(),
  isPoemAnalysis: boolean("is_poem_analysis").notNull().default(false),
  commentJson: text("comment_json").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  poemVerseId: integer("fk_poem_verse_id").notNull().references(() => poemVerse.id, {onDelete: 'cascade'}),
  memberId: integer("fk_member_id").notNull().references(() => member.id),
},
  (table) => [
    index('poem_comment_poem_verse_id_idx').on(table.poemVerseId),
    index('poem_comment_member_id_idx').on(table.memberId),
  ]
);

export const poemTagReference = pgTable("poem_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  tagType: text("tag_type").notNull().default("category"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const poemTag = pgTable("poem_tag", {
  id: serial("id").primaryKey(),
  poemId: integer("fk_poem_id").notNull().references(() => poem.id, {onDelete: 'cascade'}),
  tagId: integer("fk_tag_id").notNull().references(() => poemTagReference.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('poem_tag_poem_id_idx').on(table.poemId),
    index('poem_tag_tag_id_idx').on(table.tagId),
  ]
);

export const poemLike = pgTable("poem_like", {
  id: serial("id").primaryKey(),
  poemId: integer("fk_poem_id").notNull().references(() => poem.id, { onDelete: 'cascade' }),
  memberId: integer("fk_member_id").notNull().references(() => member.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
},
  (table) => [
    index("poem_like_poem_id_idx").on(table.poemId),
    index("poem_like_member_id_idx").on(table.memberId),
    unique("poem_like_poem_member_id_uq").on(table.poemId, table.memberId),
  ]
);

export const poemTerm = pgTable("poem_term", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().default(""),
  termJson: text("term_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});


/*------------------------------- Book Besties ------------------------------ */
//export const status = pgEnum('status', ['draft', 'published', 'archived']);

export const book = pgTable("book", {
  id: serial("id").primaryKey(),
  bookTitle: text("book_title").notNull().unique(),
  authorName: text("author_name").notNull().default("anonymous"),
  bookLanguage: text("book_language").notNull().default("english"),
  bookYear: integer("book_year").notNull().default(0),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  memberId: integer("fk_member_id").notNull().references(() => member.id),
  familyId: integer("fk_family_id").notNull().references(() => family.id),
},
  (table) => [
    index('book_member_id_idx').on(table.memberId),
    index('book_family_id_idx').on(table.familyId),
  ]
);

export const bookComment = pgTable("book_comment", {
  id: serial("id").primaryKey(),
  isBookAnalysis: boolean("is_book_analysis").notNull().default(false),
  commentJson: text("comment_json").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  bookId: integer("fk_book_id").notNull().references(() => book.id, {onDelete: 'cascade'}),
  memberId: integer("fk_member_id").notNull().references(() => member.id),
},
  (table) => [
    index('book_comment_book_id_idx').on(table.bookId),
    index('book_comment_member_id_idx').on(table.memberId),
  ]
);

export const bookTagReference = pgTable("book_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookTag = pgTable("book_tag", {
  id: serial("id").primaryKey(),
  bookId: integer("fk_book_id").notNull().references(() => book.id, {onDelete: 'cascade'}),
  tagId: integer("fk_tag_id").notNull().references(() => bookTagReference.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('book_tag_book_id_idx').on(table.bookId),
    index('book_tag_tag_id_idx').on(table.tagId),
  ]
);

export const bookLike = pgTable("book_like", {
  id: serial("id").primaryKey(),
  bookId: integer("fk_book_id").notNull().references(() => book.id, { onDelete: 'cascade' }),
  memberId: integer("fk_member_id").notNull().references(() => member.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
},
  (table) => [
    index("book_like_book_id_idx").on(table.bookId),
    index("book_like_member_id_idx").on(table.memberId),
    unique("book_like_member_id_uq").on(table.bookId, table.memberId),
  ]
);

export const bookTerm = pgTable("book_term", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().default(""),
  termJson: text("term_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

/*------------------------------- Family Foodies ------------------------------ */

export const recipe = pgTable("recipe", {
  id: serial("id").primaryKey(),
  recipeTitle: text("recipe_title").notNull().unique(),
  recipeShortSummary: text("recipe_short_summary").notNull().default(""),
  recipeJson: text("recipe_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  recipeImageUrl: text("recipe_image_url"),
  prepTimeMins: integer("prep_time_minutes").notNull().default(0),
  cookTimeMins: integer("cook_time_minutes").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'set null'}),
  familyId: integer("fk_family_id").notNull().references(() => family.id, {onDelete: 'set null'}),
  templateId: integer("fk_template_id").references(() => recipeTemplate.id, {onDelete: 'set null'}),
},
  (table) => [
    index('recipe_member_id_idx').on(table.memberId),
    index('recipe_family_id_idx').on(table.familyId),
    index('recipe_template_id_idx').on(table.templateId),
  ]
);

export const recipeComment = pgTable("recipe_comment", {
  id: serial("id").primaryKey(),
  isRecipeProTip: boolean("is_recipe_pro_tip").notNull().default(false),
  commentJson: text("comment_json").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  recipeId: integer("fk_recipe_id").notNull().references(() => recipe.id, {onDelete: 'cascade'}),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'set null'}),
},
  (table) => [
    index('recipe_comment_recipe_id_idx').on(table.recipeId),
    index('recipe_comment_member_id_idx').on(table.memberId),
  ]
);

export const recipeTemplate = pgTable("recipe_template", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull().default("").unique(),
  isGlobalTemplate: boolean("is_global_template").notNull().default(false),
  templateJson: text("template_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id").references(() => member.id, {onDelete: 'set null'}),
  familyId: integer("fk_family_id").references(() => family.id, {onDelete: 'set null'}),
},
  (table) => [
    index('recipe_template_member_id_idx').on(table.memberId),
    index('recipe_template_family_id_idx').on(table.familyId),
    unique('recipe_template_family_id_name_uq').on(table.familyId, table.templateName),
  ]
);

export const recipeTagReference = pgTable("recipe_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  tagType: text("tag_type").notNull().default("global"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipeTag = pgTable("recipe_tag", {
  id: serial("id").primaryKey(),
  recipeId: integer("fk_recipe_id").notNull().references(() => recipe.id, {onDelete: 'cascade'}),
  tagId: integer("fk_tag_id").notNull().references(() => recipeTagReference.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('recipe_tag_recipe_id_idx').on(table.recipeId),
    index('recipe_tag_tag_id_idx').on(table.tagId),
  ]
);

export const recipeLike = pgTable("recipe_like", {
  id: serial("id").primaryKey(),
  likenessDegree: integer("likeness_degree").notNull().default(-1),
  recipeId: integer("fk_recipe_id").notNull().references(() => recipe.id, { onDelete: 'cascade' }),
  memberId: integer("fk_member_id").notNull().references(() => member.id, { onDelete: 'set null' }),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (table) => [
    index("recipe_like_recipe_id_idx").on(table.recipeId),
    index("recipe_like_member_id_idx").on(table.memberId),
  ]
);

export const recipeTerm = pgTable("recipe_term", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().default(""),
  termJson: text("term_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/*------------------------------- TV Junkies ------------------------------ */

export const show = pgTable("show", {
  id: serial("id").primaryKey(),
  showTitle: text("show_title").notNull().unique(),
  showCaption: text("show_caption").notNull().default(""),
  showJson: text("show_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  showImageUrl: text("show_image_url"),
  showFirstYear: integer("show_first_year").notNull().default(sql`EXTRACT(YEAR FROM CURRENT_DATE)`),
  showLastYear: integer("show_last_year").notNull().default(sql`EXTRACT(YEAR FROM CURRENT_DATE)`),
  seasonCount: integer("season_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'set null'}),
  familyId: integer("fk_family_id").notNull().references(() => family.id, {onDelete: 'set null'}),
},
  (table) => [
    index('show_member_id_idx').on(table.memberId),
    index('show_family_id_idx').on(table.familyId),
  ]
);

export const showComment = pgTable("show_comment", {
  id: serial("id").primaryKey(),
  isShowReviewer: boolean("is_show_reviewer").notNull().default(false),
  commentJson: text("comment_json").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  showId: integer("fk_show_id").notNull().references(() => show.id, {onDelete: 'cascade'}),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'set null'}),
},
  (table) => [
    index('show_comment_show_id_idx').on(table.showId),
    index('show_comment_member_id_idx').on(table.memberId),
  ]
);

export const showTemplate = pgTable("show_template", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull().default("").unique(),
  isGlobalTemplate: boolean("is_global_template").notNull().default(false),
  templateJson: text("template_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id"),
  familyId: integer("fk_family_id"),
},
  (table) => [
    index('show_template_member_id_idx').on(table.memberId),
    index('show_template_family_id_idx').on(table.familyId),
  ]
);

export const showTagReference = pgTable("show_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  tagType: text("tag_type").notNull().default("global"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const showTag = pgTable("show_tag", {
  id: serial("id").primaryKey(),
  showId: integer("fk_show_id").notNull().references(() => show.id, {onDelete: 'cascade'}),
  tagId: integer("fk_tag_id").notNull().references(() => showTagReference.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('show_tag_show_id_idx').on(table.showId),
    index('show_tag_tag_id_idx').on(table.tagId),
  ]
);

export const showLike = pgTable("show_like", {
  id: serial("id").primaryKey(),
  likenessDegree: integer("likeness_degree").notNull().default(-1),
  showId: integer("fk_show_id").notNull().references(() => show.id, { onDelete: 'cascade' }),
  memberId: integer("fk_member_id").notNull().references(() => member.id, { onDelete: 'set null' }),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (table) => [
    index("show_like_show_id_idx").on(table.showId),
    index("show_like_member_id_idx").on(table.memberId),
  ]
);

/*------------------------------- Movie Maniacs ------------------------------ */

export const movie = pgTable("movie", {
  id: serial("id").primaryKey(),
  movieTitle: text("movie_title").notNull().unique(),
  movieCaption: text("movie_caption").notNull().default(""),
  movieJson: text("movie_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  movieImageUrl: text("movie_image_url"),
  movieDebutYear: integer("movie_year").notNull().default(sql`EXTRACT(YEAR FROM CURRENT_DATE)`),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'set null'}),
  familyId: integer("fk_family_id").notNull().references(() => family.id, {onDelete: 'set null'}),
},
  (table) => [
    index('movie_member_id_idx').on(table.memberId),
    index('movie_family_id_idx').on(table.familyId),
  ]
);

export const movieComment = pgTable("movie_comment", {
  id: serial("id").primaryKey(),
  ismovieReviewer: boolean("is_movie_reviewer").notNull().default(false),
  commentJson: text("comment_json").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  movieId: integer("fk_movie_id").notNull().references(() => movie.id, {onDelete: 'cascade'}),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('movie_comment_movie_id_idx').on(table.movieId),
    index('movie_comment_member_id_idx').on(table.memberId),
  ]
);

export const movieTemplate = pgTable("movie_template", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull().default("").unique(),
  isGlobalTemplate: boolean("is_global_template").notNull().default(false),
  templateJson: text("template_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id"),
  familyId: integer("fk_family_id"),
},
  (table) => [
    index('movie_template_member_id_idx').on(table.memberId),
    index('movie_template_family_id_idx').on(table.familyId),
  ]
);

export const movieTagReference = pgTable("movie_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  tagType: text("tag_type").notNull().default("global"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const movieTag = pgTable("movie_tag", {
  id: serial("id").primaryKey(),
  movieId: integer("fk_movie_id").notNull().references(() => movie.id, {onDelete: 'cascade'}),
  tagId: integer("fk_tag_id").notNull().references(() => movieTagReference.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('movie_tag_movie_id_idx').on(table.movieId),
    index('movie_tag_tag_id_idx').on(table.tagId),
  ]
);

export const movieLike = pgTable("movie_like", {
  id: serial("id").primaryKey(),
  likenessDegree: integer("likeness_degree").notNull().default(-1),
  movieId: integer("fk_movie_id").notNull().references(() => movie.id, { onDelete: 'cascade' }),
  memberId: integer("fk_member_id").notNull().references(() => member.id, { onDelete: 'set null' }),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (table) => [
    index("movie_like_movie_id_idx").on(table.movieId),
    index("movie_like_member_id_idx").on(table.memberId),
  ]
);

/*------------------------------- Music Lovers ------------------------------ */
export const music = pgTable("music", {
  id: serial("id").primaryKey(),
  musicTitle: text("music_title").notNull().unique(),
  artistName: text("artist_name").notNull().default(""),
  musicJson: text("music_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  isSong: boolean("is_song").notNull().default(true),
  musicImageUrl: text("music_image_url"),
  musicDebutYear: integer("music_year").notNull().default(sql`EXTRACT(YEAR FROM CURRENT_DATE)`),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'set null'}),
  familyId: integer("fk_family_id").notNull().references(() => family.id, {onDelete: 'set null'}),
},
  (table) => [
    index('music_member_id_idx').on(table.memberId),
    index('music_family_id_idx').on(table.familyId),
  ]
);

export const musicComment = pgTable("music_comment", {
  id: serial("id").primaryKey(),
  isMusicReviewer: boolean("is_music_reviewer").notNull().default(false),
  commentJson: text("comment_json").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  musicId: integer("fk_music_id").notNull().references(() => music.id, {onDelete: 'cascade'}),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'set null'}),
},
  (table) => [
    index('music_comment_music_id_idx').on(table.musicId),
    index('music_comment_member_id_idx').on(table.memberId),
  ]
);

export const musicLyrics = pgTable("music_lyrics", {
  id: serial("id").primaryKey(),
  lyricsJson: text("lyrics_json").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow(),
  status: text("status").notNull().default("draft"),
  musicId: integer("fk_music_id").notNull().references(() => music.id, {onDelete: 'cascade'}),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'set null'}),
},
  (table) => [
    index('music_lyrics_music_id_idx').on(table.musicId),
    index('music_lyrics_member_id_idx').on(table.memberId),
  ]
);

export const musicTemplate = pgTable("music_template", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull().default("").unique(),
  isGlobalTemplate: boolean("is_global_template").notNull().default(false),
  templateJson: text("template_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id").references(() => member.id, {onDelete: 'set null'}),
  familyId: integer("fk_family_id"),
},
  (table) => [
    index('music_template_member_id_idx').on(table.memberId),
    index('music_template_family_id_idx').on(table.familyId),
  ]
);

export const musicTagReference = pgTable("music_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  tagType: text("tag_type").notNull().default("genre"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const musicTag = pgTable("music_tag", {
  id: serial("id").primaryKey(),
  musicId: integer("fk_music_id").notNull().references(() => music.id, {onDelete: 'cascade'}),
  tagId: integer("fk_tag_id").notNull().references(() => musicTagReference.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('music_tag_music_id_idx').on(table.musicId),
    index('music_tag_tag_id_idx').on(table.tagId),
  ]
);

export const musicLike = pgTable("music_like", {
  id: serial("id").primaryKey(),
  likenessDegree: integer("likeness_degree").notNull().default(-1),
  musicId: integer("fk_music_id").notNull().references(() => music.id, { onDelete: 'cascade' }),
  memberId: integer("fk_member_id").notNull().references(() => member.id, { onDelete: 'set null' }),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (table) => [
    index("music_like_music_id_idx").on(table.musicId),
    index("music_like_member_id_idx").on(table.memberId),
  ]
);

/*------------------------------- Support ------------------------------ */
export const supportFamily = pgTable("support_family", {
  id: serial("id").primaryKey(),
  familyName: text("family_name").notNull().unique(),
  databaseUrl: text("database_url"),
  dbOwner: text("db_owner"),
  dbCredential: text("db_credential"),
  status: text("status").notNull().default("trial"),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (table) => [
    index('support_family_id_idx').on(table.id),
  ]
);

export const supportIssue = pgTable("support_issue", {
  id: serial("id").primaryKey(),
  issueType: text("issue_type").notNull().default("question"),
  priority: text("priority").notNull().default("low"),
  status: text("status").notNull().default("open"),
  issueJson: text("issue_json").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow(),
  memberId: integer("fk_member_id").references(() => member.id, {onDelete: 'cascade'}),
  supportFamilyId: integer("fk_support_family_id").references(() => supportFamily.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('support_issue_id_idx').on(table.id),
    index('support_issue_family_id_idx').on(table.supportFamilyId),
    index('support_issue_member_id_idx').on(table.memberId),
  ]
);

export const supportResponse = pgTable("support_response", {
  id: serial("id").primaryKey(),
  responseType: text("response_type").notNull().default("general"),
  isProposedSolution: boolean("is_proposed_solution").notNull().default(false),
  wasAccepted: boolean("was_accepted").notNull().default(false),
  status: text("status").notNull().default("open"),
  responseJson: text("response_json").notNull().default("{}"),
  emailSentAt: timestamp("email_sent_at"),
  threadSentAt: timestamp("thread_sent_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
  supportIssueId: integer("fk_support_issue_id").notNull().references(() => supportIssue.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('support_response_id_idx').on(table.id),
  ]
);

export const supportAttachment = pgTable("support_attachment", {
  id: serial("id").primaryKey(),
  attachmentType: text("attachment_type").notNull().default("image"),
  attachmentJson: text("attachment_json").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  supportIssueId: integer("fk_support_issue_id").notNull().references(() => supportIssue.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('support_attachment_id_idx').on(table.id),
  ]
);

export const supportTeam = pgTable("support_team", {
  id: serial("id").primaryKey(),
  teamName: text("team_name").notNull().unique(),
  supportLevel: text("support_level").notNull().default("L1"),
  isAdmin: boolean("is_admin").notNull().default(false),
  status: text("status").notNull().default("active"),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (table) => [
    index('support_team_id_idx').on(table.id),
  ]
);

export const supportPerson = pgTable("support_person", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  managesTeam: boolean("manages_team").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  supportTeamId: integer("fk_support_team_id").references(() => supportTeam.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('support_person_id_idx').on(table.id),
    index('support_person_team_id_idx').on(table.supportTeamId),
  ]
);

export const supportPersonIssue = pgTable("support_person_issue", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  supportIssueId: integer("fk_support_issue_id").references(() => supportIssue.id, {onDelete: 'cascade'}),
  supportPersonId: integer("fk_support_person_id").references(() => supportPerson.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('support_person_issue_id_idx').on(table.id),
    index('support_person_issue_issue_id_idx').on(table.supportIssueId),
    index('support_person_issue_person_id_idx').on(table.supportPersonId),
  ]
);
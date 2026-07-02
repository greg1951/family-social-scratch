import { pgSchema, serial, index, boolean, pgEnum, foreignKey, unique } from "drizzle-orm/pg-core";
import {is, like, not, sql } from 'drizzle-orm';
import { number } from "zod";
import { ta } from "date-fns/locale";
import { member } from "./family-social-schema-tables"; 

import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";

export const globalSchema = pgSchema('global_schema');

import type { AdapterAccount } from "@auth/core/adapters"


export const bookCategoryReference = globalSchema.table("book_category_reference", {
  id: serial("id").primaryKey(),
  categoryName: text("category_name").notNull().default(""),
  categoryDesc: text("category_description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const bookCategoryTagReference = globalSchema.table("book_category_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagJson: text("tag_json").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow(),
  bookCategoryId: integer("fk_book_category_id").notNull().references(() => bookCategoryReference.id, {onDelete: 'cascade'}),
});

export const bookTerm = globalSchema.table("book_term", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().default(""),
  termCategory: text("term_category").notNull().default("definition"),
  termJson: text("term_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const movieTagReference = globalSchema.table("movie_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  tagType: text("tag_type").notNull().default("global"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const musicTagReference = globalSchema.table("music_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  tagType: text("tag_type").notNull().default("genre"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const poemCategoryReference = globalSchema.table("poem_category_reference", {
  id: serial("id").primaryKey(),
  categoryName: text("category_name").notNull().default(""),
  categoryDesc: text("category_description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const poemCategoryTagReference = globalSchema.table("poem_category_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagJson: text("tag_json").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow(),
  poemCategoryId: integer("fk_poem_category_id").notNull().references(() => poemCategoryReference.id, {onDelete: 'cascade'}),
});

export const poemTerm = globalSchema.table("poem_term", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().default(""),
  termCategory: text("term_category").notNull().default("definition"),
  termJson: text("term_json").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const showTagReference = globalSchema.table("show_tag_reference", {
  id: serial("id").primaryKey(),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  tagType: text("tag_type").notNull().default("global"),
  status: text("status").notNull().default("active"),
  seqNo: integer("seq_no").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const supportEnvironment = globalSchema.table("support_environment", {
  id: serial("id").primaryKey(),
  envPneumonic: text("env_pneumonic").notNull().unique(),
  websiteDomain: text("website_domain").notNull().default("my-family-social.com"),
  isAvailable: boolean("is_available").notNull().default(true),
  bypassUrl: text("bypass_url"),
  supportEmail: text("support_email"),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (table) => [
    index('support_env_id_idx').on(table.id),
  ]
);

export const supportFamily = globalSchema.table("support_family", {
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

export const supportIssue = globalSchema.table("support_issue", {
  id: serial("id").primaryKey(),
  issueType: text("issue_type").notNull().default("question"),
  issueTitle: text("issue_title"),
  issueJson: text("issue_json").notNull().default("{}"),
  priority: text("priority").notNull().default("low"),
  status: text("status").notNull().default("open"),
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

export const supportResponse = globalSchema.table("support_response", {
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

export const supportAttachment = globalSchema.table("support_attachment", {
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

export const supportTeam = globalSchema.table("support_team", {
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

export const supportPerson = globalSchema.table("support_person", {
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

export const supportPersonIssue = globalSchema.table("support_person_issue", {
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
export const videoS3Credentials = globalSchema.table("video_s3_credentials", {
  id: serial("id").primaryKey(),
  encryptedAccessKey: text("encrypted_access_key").notNull(),
  encryptedSecretKey: text("encrypted_secret_key").notNull(),
  bucketName: text("bucket_name").notNull(),
  region: text("region").notNull().default("us-east-2"),  
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const video = globalSchema.table("video", {
  id: serial("id").primaryKey(),
  videoName: text("video_name").notNull().default(""),
  faqPageSeqNo: integer("faq_page_seq_no").notNull().default(1),
  videoJson: text("video_json").notNull().default("{}"),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("draft"),
  link: text("link").notNull().default(""),
  durationMinutes: integer("duration_seconds").notNull().default(0),
  videoUrl: text("video_url"),
  seqNo: integer("seq_no").notNull().default(1),
  caption: text("caption").notNull().default("Overview"),
  updatedAt: timestamp("updated_at").defaultNow(),
  videoS3Id: integer("fk_video_s3_id").notNull().references(() => videoS3Credentials.id, {onDelete: 'set null'}),
},
  (table) => [
    index('video_s3_id_idx').on(table.videoS3Id),
  ]
);

export const videoTagReference = globalSchema.table("video_tag_reference", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().default("general"),
  tagName: text("tag_name").notNull().default(""),
  tagDesc: text("tag_description"),
  seqNo: integer("seq_no").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoTag = globalSchema.table("video_tag", {
  id: serial("id").primaryKey(),
  videoId: integer("fk_video_id").notNull().references(() => video.id, {onDelete: 'cascade'}),
  tagId: integer("fk_tag_id").notNull().references(() => videoTagReference.id, {onDelete: 'cascade'}),
},
  (table) => [
    index('video_tag_video_id_idx').on(table.videoId),
    index('video_tag_tag_id_idx').on(table.tagId),
  ]
);

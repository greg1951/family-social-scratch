import { serial, pgTable, index, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import {sql } from 'drizzle-orm';

export const familyStatus = pgEnum('status', ['trial', 'active', 'expired']);
export const inviteStatus = pgEnum('status', ['invited', 'joined', 'resent', 'declined']);
export const memberStatus = pgEnum('status', ['active', 'resigned']);

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
});

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
}, (table) => ({
  emailIdx: index('invite_email_idx').on(table.email),
}));

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
}, (table) => ({
  emailIdx: index('member_email_idx').on(table.email),
}));


export const memberOption = pgTable("member_option", {
  id: serial("id").primaryKey(),
  memberId: integer("fk_member_id").notNull().references(() => member.id, {onDelete: 'cascade'}),
  optionId: integer("fk_option_id").notNull().references(() => optionReference.id, {onDelete: 'cascade'}),
  isSelected: boolean("is_selected").notNull().default(false),
});

export const optionReference = pgTable("option_reference", {
  id: serial("id").primaryKey(),
  optionName: text("option_name").notNull(),
  optionDesc: text("option_description"),
  isSelected: boolean("is_selected").notNull().default(false),
});
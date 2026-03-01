import { serial, pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

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
  userId: integer("fk_user_id").notNull().references(() => user.id, {
    onDelete: "cascade"
  }).unique(),
  token: text("token").notNull(),
  tokenExpiry: timestamp("token_expiry"),
});

export const family = pgTable("family", {
  id: serial("id").primaryKey(),
  name: text("family_name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const familyInvitation = pgTable("family_invitation", {
  id: serial("id").primaryKey(),
  memberId: integer("fk_family_id").notNull().references(() => family.id),
  email: text("invited_email").notNull(),
  hasJoined: boolean("has_joined").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  statusUpdate: timestamp("status_update"),
});

export const member = pgTable("member", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nickName: text("nick_name"),
  email: text("email").notNull(),
  birthday: text("birthday").notNull(),
  cellPhone: text("cell_phone"),
  familyId: integer("fk_family_id").notNull().references(() => family.id),
  isFounder: boolean("is_family_founder").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberOption = pgTable("member_option", {
  id: serial("id").primaryKey(),
  memberId: integer("fk_member_id").notNull().references(() => member.id),
  optionId: integer("fk_option_id").notNull().references(() => optionReference.id),
  isSelected: boolean("is_selected").notNull().default(false),
});

export const optionReference = pgTable("option_reference", {
  id: serial("id").primaryKey(),
  optionName: text("option_name").notNull(),
  optionDesc: text("option_description"),
  isSelected: boolean("is_selected").notNull().default(false),
});
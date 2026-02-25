import { serial, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import {users} from "./schema-users";

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, {
    onDelete: "cascade"
  }).unique(),
  token: text("token").notNull(),
  tokenExpiry: timestamp("token_expiry"),
});

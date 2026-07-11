import { boolean, integer, pgSchema, serial, text } from "drizzle-orm/pg-core";

const globalSchema = pgSchema("global_schema");

export const memberOptionReference = globalSchema.table("member_option_reference", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().default("feature"),
  optionName: text("option_name").notNull(),
  optionType: text("option_type").notNull().default("boolean"),
  seqNo: integer("seq_no").notNull().default(1),
  isSelected: boolean("is_selected"),
  optionStringValue: text("option_string_value"),
});

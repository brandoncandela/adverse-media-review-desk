import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const trainingCases = sqliteTable("training_cases", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  partyJson: text("party_json").notNull(),
  hitJson: text("hit_json").notNull(),
  expectedDisposition: text("expected_disposition").notNull(),
  explanation: text("explanation").notNull(),
});
export const comparisonExamples = sqliteTable("comparison_examples", {
  id: integer("id").primaryKey(),
  caseId: text("case_id")
    .notNull()
    .references(() => trainingCases.id),
  field: text("field").notNull(),
  state: text("state").notNull(),
});

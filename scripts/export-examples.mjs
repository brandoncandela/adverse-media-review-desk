// Builds public/examples.json: applies sql/migrations to an in-memory SQLite
// database and exports the training cases with their SQL-derived disposition.
// Usage: node scripts/export-examples.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(":memory:");
for (const file of readdirSync("sql/migrations").filter((f) => f.endsWith(".sql")).sort())
  for (const statement of readFileSync(`sql/migrations/${file}`, "utf8").split("--> statement-breakpoint"))
    if (statement.trim()) db.exec(statement);

const cases = db
  .prepare(
    "SELECT t.id, t.label, t.party_json, t.hit_json, v.disposition AS expected_disposition, t.explanation FROM training_cases t JOIN training_triage v ON v.id=t.id ORDER BY t.id",
  )
  .all();
const summary = db
  .prepare(
    "SELECT field, state, COUNT(*) AS hit_count FROM comparison_examples GROUP BY field, state ORDER BY field, state",
  )
  .all();
writeFileSync(
  "public/examples.json",
  JSON.stringify({
    cases,
    summary,
    source: "SQLite (sql/migrations)",
    scope: "Synthetic training examples only",
  }) + "\n",
);
console.log(`Exported ${cases.length} cases and ${summary.length} summary rows`);

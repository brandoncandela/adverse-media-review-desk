// Builds public/examples.json for the static GitHub Pages build by applying the
// Drizzle migrations to an in-memory SQLite database and running the same
// queries as app/api/examples/route.ts. Usage: node scripts/export-examples.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(":memory:");
for (const file of readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort())
  for (const statement of readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint"))
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
    source: "SQLite (same migrations and queries as the Cloudflare D1 build)",
    scope: "Synthetic training examples only",
  }) + "\n",
);
console.log(`Exported ${cases.length} cases and ${summary.length} summary rows`);

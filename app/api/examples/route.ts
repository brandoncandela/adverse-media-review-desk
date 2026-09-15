import { env } from "cloudflare:workers";
export async function GET() {
  try {
    if (!env.DB) throw Error("Missing database");
    const [cases, summary] = await Promise.all([
      env.DB.prepare(
        "SELECT t.id, t.label, t.party_json, t.hit_json, v.disposition AS expected_disposition, t.explanation FROM training_cases t JOIN training_triage v ON v.id=t.id ORDER BY t.id",
      ).all(),
      env.DB.prepare(
        `SELECT field, state, COUNT(*) AS hit_count FROM comparison_examples GROUP BY field, state ORDER BY field, state`,
      ).all(),
    ]);
    return Response.json(
      {
        cases: cases.results,
        summary: summary.results,
        source: "Cloudflare D1 / SQLite",
        scope: "Synthetic training examples only",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "The example database is unavailable. Your current case can still be reviewed.",
      },
      { status: 503 },
    );
  }
}

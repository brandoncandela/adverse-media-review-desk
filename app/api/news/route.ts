import { gdeltUrl, newsQuery, newsResult, NEWS_UNAVAILABLE } from "../../../lib/news";

const recent = new Map<string, { at: number; result: unknown }>();
let nextRequest = 0;
export async function POST(req: Request) {
  try {
    const body = await req.text();
    if (body.length > 1000)
      return Response.json({ error: "Search is too long." }, { status: 413 });
    const q = newsQuery(JSON.parse(body).name);
    if ("error" in q) return Response.json({ error: q.error }, { status: 400 });
    const { query } = q;
    const cached = recent.get(query);
    if (cached && Date.now() - cached.at < 300000)
      return Response.json(cached.result, {
        headers: { "Cache-Control": "no-store" },
      });
    if (Date.now() < nextRequest)
      return Response.json(
        {
          error:
            "News provider cooldown. Try again in a few seconds or use Google and import a hit.",
        },
        { status: 429 },
      );
    nextRequest = Date.now() + 6000;
    const r = await fetch(gdeltUrl(query), { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw Error();
    const result = newsResult(await r.text(), query);
    if (recent.size > 100) recent.clear();
    recent.set(query, { at: Date.now(), result });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: NEWS_UNAVAILABLE },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

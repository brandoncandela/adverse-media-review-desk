const recent = new Map<string, { at: number; result: unknown }>();
let nextRequest = 0;
export async function POST(req: Request) {
  try {
    const body = await req.text();
    if (body.length > 1000)
      return Response.json({ error: "Search is too long." }, { status: 413 });
    const input = JSON.parse(body);
    if (
      typeof input.name !== "string" ||
      input.name.trim().length < 3 ||
      input.name.length > 120
    )
      return Response.json(
        { error: "Enter a name between 3 and 120 characters." },
        { status: 400 },
      );
    const name = input.name
      .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
      .trim()
      .replace(/\s+/g, " ");
    if (name.length < 3)
      return Response.json({ error: "Enter a valid name." }, { status: 400 });
    const query = `"${name}" (fraud OR corruption OR laundering OR charged OR convicted OR investigation)`;
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
    const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    for (const [k, v] of Object.entries({
      query,
      mode: "artlist",
      format: "json",
      maxrecords: "25",
      timespan: "3months",
      sort: "datedesc",
    }))
      url.searchParams.set(k, v);
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw Error();
    const raw = await r.text();
    if (raw.length > 1000000) throw Error();
    const data = JSON.parse(raw);
    if (!Array.isArray(data.articles)) throw Error();
    const seen = new Set<string>();
    const articles = data.articles
      .filter((a: any) => {
        try {
          const u = new URL(a.url);
          u.hash = "";
          for (const k of [...u.searchParams.keys()])
            if (k.startsWith("utm_")) u.searchParams.delete(k);
          const key = u.href;
          if (
            !["https:", "http:"].includes(u.protocol) ||
            seen.has(key) ||
            typeof a.title !== "string"
          )
            return false;
          seen.add(key);
          return true;
        } catch {
          return false;
        }
      })
      .map((a: any) => ({
        title: a.title.slice(0, 500),
        url: a.url,
        seenAt: a.seendate,
        language: a.language,
        publisherCountry: a.sourcecountry,
      }));
    const result = {
      articles,
      query,
      retrievedAt: new Date().toISOString(),
      scope:
        "Up to 25 GDELT article leads, last 3 months. English risk keywords; not comprehensive screening. Publisher country is not subject location.",
    };
    if (recent.size > 100) recent.clear();
    recent.set(query, { at: Date.now(), result });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      {
        error:
          "News search is unavailable or rate limited. No screening conclusion was reached. Open Google or import a source manually.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

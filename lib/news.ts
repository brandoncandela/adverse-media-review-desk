export const NEWS_SCOPE =
  "Up to 25 GDELT article leads, last 3 months. English risk keywords; not comprehensive screening. Publisher country is not subject location.";
export const NEWS_UNAVAILABLE =
  "News search is unavailable or rate limited. No screening conclusion was reached. Open Google or import a source manually.";

/** Validates a customer name and builds the GDELT keyword query, or returns an error message. */
export function newsQuery(input: unknown): { query: string } | { error: string } {
  if (typeof input !== "string" || input.trim().length < 3 || input.length > 120)
    return { error: "Enter a name between 3 and 120 characters." };
  const name = input
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (name.length < 3) return { error: "Enter a valid name." };
  return {
    query: `"${name}" (fraud OR corruption OR laundering OR charged OR convicted OR investigation)`,
  };
}

export function gdeltUrl(query: string) {
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
  return url;
}

/** Parses a GDELT response into deduplicated article leads. Throws on malformed input. */
export function newsResult(raw: string, query: string) {
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
  return { articles, query, retrievedAt: new Date().toISOString(), scope: NEWS_SCOPE };
}

let nextBrowserRequest = 0;
/** Browser-side search for static hosting: calls GDELT directly, honoring its one-request-per-5-seconds limit. */
export async function searchNewsInBrowser(name: string) {
  const q = newsQuery(name);
  if ("error" in q) throw Error(q.error);
  if (Date.now() < nextBrowserRequest)
    throw Error("News provider cooldown. Try again in a few seconds or use Google and import a hit.");
  nextBrowserRequest = Date.now() + 6000;
  try {
    const r = await fetch(gdeltUrl(q.query), { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw Error();
    return newsResult(await r.text(), q.query);
  } catch {
    throw Error(NEWS_UNAVAILABLE);
  }
}

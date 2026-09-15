"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  ArrowUpRight,
  Download,
  Database,
  ScanSearch,
  CheckCircle2,
} from "lucide-react";
import {
  evaluate,
  exampleParty,
  exampleHit,
  blankParty,
  blankHit,
  safeUrl,
  VERSION,
  type Party,
  type Hit,
} from "@/lib/matching";
import {
  newReview,
  replaceReview,
  validateReview,
  exportReviews,
  type ReviewEntry,
} from "@/lib/reviews";
function Choice({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (s: string) => void;
}) {
  return (
    <label>
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="choice" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label>
      {label}
      <Input
        type={type}
        maxLength={500}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export default function Home() {
  const [party, setParty] = useState<Party>(exampleParty),
    [hit, setHit] = useState<Hit>(exampleHit),
    [tab, setTab] = useState("review"),
    [note, setNote] = useState(""),
    [decision, setDecision] = useState("Pending review"),
    [reviewer, setReviewer] = useState(""),
    [qc, setQc] = useState("Not reviewed"),
    [qcNote, setQcNote] = useState(""),
    [snapshot, setSnapshot] = useState<any>(null),
    [examples, setExamples] = useState<any>(null),
    [dbError, setDbError] = useState(""),
    [news, setNews] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [mode, setMode] = useState("Fictional training case");
  const [activeId, setActiveId] = useState("hit-1"),
    [savedHits, setSavedHits] = useState<ReviewEntry[]>([
      newReview("hit-1", exampleHit, "Fictional training case"),
    ]);
  const result = evaluate(party, hit);
  const current = JSON.stringify({ party, hit, note, decision });
  const stale = snapshot && snapshot.content !== current;
  const p = (k: keyof Party, v: string) => {
    setParty({ ...party, [k]: v });
    setHit({ ...hit, verified: false });
    setSavedHits((entries) =>
      entries.map((e) => ({ ...e, hit: { ...e.hit, verified: false } })),
    );
  };
  const h = (k: keyof Hit, v: string | boolean) =>
    setHit({ ...hit, [k]: v, verified: k === "verified" ? Boolean(v) : false });
  useEffect(() => {
    fetch("/api/examples")
      .then(async (r) => {
        const d: any = await r.json();
        if (!r.ok) throw Error(d.error);
        setExamples(d);
      })
      .catch((e) => setDbError(e.message));
  }, []);
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const life = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: "read_identity_comparison",
          title: "Read current identity comparison",
          description:
            "Read the visible customer-to-media comparison. Does not change or finalize a decision.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: (input: any) => {
            if (!input || Object.keys(input).length)
              throw Error("No parameters accepted");
            return evaluate(party, hit);
          },
        },
        { signal: life.signal },
      ),
    ).catch(() => {});
    return () => life.abort();
  }, [party, hit]);
  function activeEntry(): ReviewEntry {
    return {
      id: activeId,
      hit,
      note,
      decision,
      reviewer,
      qc,
      qcNote,
      snapshot,
      mode,
    };
  }
  function allEntries() {
    return replaceReview(savedHits, activeEntry());
  }
  function loadEntry(entry: ReviewEntry) {
    setActiveId(entry.id);
    setHit(entry.hit);
    setNote(entry.note);
    setDecision(entry.decision);
    setReviewer(entry.reviewer);
    setQc(entry.qc);
    setQcNote(entry.qcNote);
    setSnapshot(entry.snapshot);
    setMode(entry.mode);
    setTab("review");
  }
  function chooseHit(id: string) {
    const list = allEntries();
    setSavedHits(list);
    const target = list.find((e) => e.id === id);
    if (target) loadEntry(target);
  }
  function addHit(
    value: Hit = { ...blankHit },
    label = "Manual source review",
  ) {
    const list = allEntries();
    if (list.length >= 25) {
      setMessage(
        "This case supports up to 25 hits. Export before starting another case.",
      );
      return;
    }
    const duplicate = value.url && list.find((e) => e.hit.url === value.url);
    if (duplicate) {
      chooseHit(duplicate.id);
      setMessage(
        "This source URL is already in the case. Opened its existing review.",
      );
      return;
    }
    const entry = newReview(crypto.randomUUID(), value, label);
    setSavedHits([...list, entry]);
    loadEntry(entry);
  }
  function replaceCase(p: Party, h: Hit, label: string) {
    const entry = newReview(crypto.randomUUID(), h, label);
    setParty(p);
    setSavedHits([entry]);
    loadEntry(entry);
    setNews(null);
    setError("");
  }
  async function searchNews() {
    setBusy(true);
    setError("");
    setNews(null);
    try {
      const r = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: party.name }),
      });
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setNews(d);
    } catch (e: any) {
      setError(e.message || "News search unavailable.");
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    replaceCase({ ...blankParty }, { ...blankHit }, "Manual case");
    setMessage("New case started. Previous unsaved changes are replaced.");
  }
  function download() {
    if (!party.name.trim()) {
      setMessage("Enter the customer name before exporting.");
      return;
    }
    if (decision !== "Pending review" && note.trim().length < 20) {
      setMessage("Add an evidence-based rationale of at least 20 characters.");
      return;
    }
    if (
      decision === "Disprove / false positive" &&
      result.disposition !== "Disprove candidate"
    ) {
      setMessage(
        "A false-positive disposition needs a verified identifier conflict, source URL and supporting excerpt.",
      );
      return;
    }
    for (const entry of allEntries()) {
      const issue = validateReview(party, entry);
      if (issue) {
        setMessage(
          (entry.hit.title || entry.hit.name || "Untitled hit") + ": " + issue,
        );
        return;
      }
    }
    const report = {
      format: "adverse-media-review-v2",
      reviews: exportReviews(party, allEntries()),
      exportedAt: new Date().toISOString(),
      mode,
      party,
      hit,
      comparison: result,
      decision,
      note,
      qc: snapshot ? { ...snapshot, stale } : null,
      limitations:
        "Independent prototype. Rule-based priorities are not probabilities. Reports are editable and reviewer identity is not authenticated.",
    };
    const b = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(b),
      a = document.createElement("a");
    a.href = url;
    a.download = "adverse-media-review.json";
    a.click();
    URL.revokeObjectURL(url);
    setMessage(
      "All hit reviews exported with their individual notes, evidence and QC snapshots.",
    );
  }
  function recordQc() {
    if (
      !reviewer.trim() ||
      qc === "Not reviewed" ||
      qcNote.trim().length < 20 ||
      decision === "Pending review" ||
      note.trim().length < 20
    ) {
      setMessage(
        "QC needs a reviewer name, outcome, review comment and a completed analyst decision with rationale.",
      );
      return;
    }
    if (
      decision === "Disprove / false positive" &&
      result.disposition !== "Disprove candidate"
    ) {
      setMessage(
        "QC of a false-positive disposition needs a verified identifier conflict, source URL and supporting excerpt.",
      );
      return;
    }
    setSnapshot({
      reviewer,
      qc,
      qcNote,
      at: new Date().toISOString(),
      content: current,
    });
    setMessage(
      "QC snapshot recorded for this exact assessment. Changes will require another review.",
    );
  }
  const google =
    "https://www.google.com/search?q=" +
    encodeURIComponent(
      '"' +
        party.name.replaceAll('"', "") +
        '" (fraud OR corruption OR "money laundering" OR charged OR convicted)',
    );
  return (
    <main className="desk">
      <header>
        <a className="brand" href="/">
          AM <span>/</span> REVIEW DESK
        </a>
        <span><a href="https://github.com/brandoncandela" target="_blank" rel="noopener noreferrer">Brandon Candela</a> · Independent AML work sample</span>
        <a className="link-button" href="https://github.com/brandoncandela/adverse-media-review-desk" target="_blank" rel="noopener noreferrer">View on GitHub</a><Button variant="outline" onClick={download}>
          <Download size={16} /> Export all hits
        </Button>
      </header>
      <section className="intro">
        <p className="eyebrow">ADVERSE MEDIA · IDENTITY REVIEW</p>
        <h1>Bank record. Media subject. Compare the evidence.</h1>
        <p>
          One customer, multiple hits, a separate explanation for every
          decision.
        </p>
      </section>
      <div className="notice">
        <span>
          <b>{mode}</b> · Enter public or fictional information. Case edits stay
          in this tab until exported.
        </span>
        <Button variant="outline" onClick={reset}>
          New case
        </Button>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="main-tabs">
          <TabsTrigger value="review">01 · Compare & decide</TabsTrigger>
          <TabsTrigger value="discover">02 · Find media</TabsTrigger>
          <TabsTrigger value="data">03 · SQL & methodology</TabsTrigger>
        </TabsList>
        <TabsContent value="review">
          <section className="hit-queue">
            <div className="queue-heading">
              <div>
                <b>Screening hits · {savedHits.length}</b>
                <p className="small">
                  Each hit keeps its own assessment and QC history. URL
                  duplicates reopen the existing hit.
                </p>
              </div>
              <Button variant="outline" onClick={() => addHit()}>
                + Add hit
              </Button>
            </div>
            <div className="hit-buttons">
              {allEntries().map((entry, i) => (
                <button
                  key={entry.id}
                  className={
                    entry.id === activeId ? "hit-button selected" : "hit-button"
                  }
                  aria-pressed={entry.id === activeId}
                  onClick={() => chooseHit(entry.id)}
                >
                  <small>
                    HIT {String(i + 1).padStart(2, "0")} ·{" "}
                    {entry.decision === "Pending review"
                      ? "Pending"
                      : "Decision drafted"}
                  </small>
                  <b>{entry.hit.name || "Subject not identified"}</b>
                  <span>{entry.hit.title || "Add a source title and URL"}</span>
                </button>
              ))}
            </div>
          </section>
          <div className="workspace">
            <section className="panel customer">
              <p className="eyebrow">LEFT / BANK INFORMATION</p>
              <h2>Customer record</h2>
              <p className="small">
                Entered bank information. No bank system is connected.
              </p>
              <Choice
                label="Entity type"
                value={party.kind}
                values={["individual", "business"]}
                onChange={(v) =>
                  replaceCase(
                    { ...blankParty, kind: v as Party["kind"] },
                    { ...blankHit },
                    "Manual case",
                  )
                }
              />
              <Field
                label={
                  party.kind === "business"
                    ? "Legal business name"
                    : "Full name"
                }
                value={party.name}
                onChange={(v) => p("name", v)}
              />
              <Field
                label="Known aliases (separate with ;)"
                value={party.aliases}
                onChange={(v) => p("aliases", v)}
              />
              {party.kind === "individual" ? (
                <Field
                  label="Date of birth, if known"
                  type="date"
                  value={party.dob}
                  onChange={(v) => p("dob", v)}
                />
              ) : (
                <>
                  <Field
                    label="Registration number"
                    value={party.registration}
                    onChange={(v) => p("registration", v)}
                  />
                  <Field
                    label="Issuing registry / jurisdiction"
                    value={party.registry}
                    onChange={(v) => p("registry", v)}
                  />
                </>
              )}
              <Field
                label="Home / registered address"
                value={party.address}
                onChange={(v) => p("address", v)}
              />
              <Field
                label="Country"
                value={party.country}
                onChange={(v) => p("country", v)}
              />
              <Field
                label="Other countries / associations (;)"
                value={party.associations}
                onChange={(v) => p("associations", v)}
              />
              <p className="small">
                An association is not a residence. Common US and UK
                abbreviations are normalized; other country names are compared
                as entered.
              </p>
              <div className="coverage">
                <b>{result.known} / 3</b>
                <span>
                  identifier groups comparable
                  <br />
                  Completeness, not match probability
                </span>
              </div>
            </section>
            <div className="review-column">
              <section className="panel">
                <p className="eyebrow">RIGHT / SELECTED ONLINE HIT</p>
                <h2>Source subject</h2>
                <p className="small">
                  Record only information attributed to this person or business
                  in the original source.
                </p>
                <div className="two-col">
                  <Choice
                    label="Screening record type"
                    value={hit.recordType || "Adverse media"}
                    values={[
                      "Adverse media",
                      "PEP / public role",
                      "Sanctions / watchlist",
                      "Regulatory record",
                      "Other / unknown",
                    ]}
                    onChange={(v) => h("recordType", v)}
                  />
                  <Choice
                    label="Source reliability assessment"
                    value={hit.sourceReliability || "Not assessed"}
                    values={[
                      "Not assessed",
                      "Primary official source",
                      "Established reporting",
                      "Unverified / secondary source",
                    ]}
                    onChange={(v) => h("sourceReliability", v)}
                  />
                  <Field
                    label="Article / record title"
                    value={hit.title}
                    onChange={(v) => h("title", v)}
                  />
                  <Field
                    label="Source URL"
                    value={hit.url}
                    placeholder="https://…"
                    onChange={(v) => h("url", v)}
                  />
                </div>
                {hit.url && !safeUrl(hit.url) && (
                  <p role="alert">Use a valid http or https source URL.</p>
                )}
                {safeUrl(hit.url) && (
                  <a
                    href={safeUrl(hit.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open original source{" "}
                    <ArrowUpRight size={14} className="inline" />
                  </a>
                )}
                <div className="two-col">
                  <Field
                    label="Publication / reference date"
                    type="date"
                    value={hit.published}
                    onChange={(v) => h("published", v)}
                  />
                  <Field
                    label="Subject name in source"
                    value={hit.name}
                    onChange={(v) => h("name", v)}
                  />
                  <Field
                    label="Source aliases / alternate names (;)"
                    value={hit.aliases || ""}
                    onChange={(v) => h("aliases", v)}
                  />
                  {party.kind === "individual" ? (
                    <>
                      <Field
                        label="DOB in source (YYYY-MM-DD or YYYY)"
                        value={hit.dob}
                        onChange={(v) => h("dob", v)}
                      />
                      <Field
                        label="Reported age, if DOB unavailable"
                        value={hit.age}
                        onChange={(v) => h("age", v)}
                      />
                    </>
                  ) : (
                    <>
                      <Field
                        label="Source registration number"
                        value={hit.registration}
                        onChange={(v) => h("registration", v)}
                      />
                      <Field
                        label="Source issuing registry"
                        value={hit.registry}
                        onChange={(v) => h("registry", v)}
                      />
                    </>
                  )}
                  <Field
                    label="Subject address in source"
                    value={hit.address}
                    onChange={(v) => h("address", v)}
                  />
                  <Field
                    label="Subject country in source"
                    value={hit.country}
                    onChange={(v) => h("country", v)}
                  />
                  <Choice
                    label="What does this location describe?"
                    value={hit.locationRole}
                    values={[
                      "Unknown",
                      "Residence / registered address",
                      "Other subject association",
                      "Event location",
                      "Publisher location",
                    ]}
                    onChange={(v) => h("locationRole", v)}
                  />
                  <Choice
                    label="Procedural status reported"
                    value={hit.stage}
                    values={[
                      "Unverified mention",
                      "Allegation",
                      "Investigation",
                      "Charge",
                      "Conviction",
                      "Acquittal / dismissal",
                      "Correction / retraction",
                      "Regulatory action",
                    ]}
                    onChange={(v) => h("stage", v)}
                  />
                  <Choice
                    label="Adverse media category"
                    value={hit.category}
                    values={[
                      "Unclassified",
                      "Fraud",
                      "Money laundering",
                      "Corruption / bribery",
                      "Sanctions evasion",
                      "Other financial crime",
                      "Not relevant",
                    ]}
                    onChange={(v) => h("category", v)}
                  />
                </div>
                <label>
                  Supporting excerpt / attribution notes
                  <Textarea
                    rows={4}
                    maxLength={10000}
                    value={hit.excerpt}
                    onChange={(e) => h("excerpt", e.target.value)}
                    placeholder="Paste the short passage supporting these identifiers. Distinguish the subject from witnesses or other people mentioned."
                  />
                </label>
                <label className="check">
                  <Checkbox
                    checked={hit.verified}
                    onCheckedChange={(v) => h("verified", v === true)}
                  />
                  <span>
                    I checked the original records, attributed the identifiers
                    to the correct subject, and verified any conflict against
                    reliable customer information.
                  </span>
                </label>
                <p className="small">
                  Do not infer DOB from the search query or use a publisher’s
                  country as the subject’s location. Any source-field edit
                  resets verification.
                </p>
              </section>
            </div>
          </div>
          <section className="panel result-panel">
            <div className="result-title">
              <div>
                <p className="eyebrow">RECOMMENDED NEXT STEP</p>
                <h2>
                  {result.disposition === "Escalate"
                    ? "Escalate · potential true match"
                    : result.disposition}
                </h2>
              </div>
              <span
                className={
                  "pill " +
                  (result.disposition === "Disprove candidate"
                    ? "blue"
                    : "amber")
                }
              >
                {result.priority}
              </span>
            </div>
            <p>{result.reason}</p>
            <p className="identity-basis">
              <b>Identity evidence:</b> {result.identityBasis}
            </p>
            <p className="callout">{result.recordContext}</p>
            <p className="probability">
              <b>True-match probability:</b> Not yet calibrated. No percentage
              is assigned.
            </p>
            <p className="small">
              Potential identity match ≠ proven adverse conduct. Analyst review
              remains required.
            </p>
            <div className="evidence-matrix">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Bank information</TableHead>
                    <TableHead>Online subject</TableHead>
                    <TableHead>Comparison & explanation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.comparisons.map((c) => (
                    <TableRow key={c.field}>
                      <TableCell>
                        <b>{c.field}</b>
                      </TableCell>
                      <TableCell>{c.customer}</TableCell>
                      <TableCell>{c.article}</TableCell>
                      <TableCell>
                        <span className={"state " + c.state}>{c.state}</span>
                        <p>{c.reason}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
          <section className="panel">
            <p className="eyebrow">ANALYST DISPOSITION</p>
            <h2>Leave a reviewable explanation.</h2>
            <Choice
              label="Your decision"
              value={decision}
              values={[
                "Pending review",
                "Escalate / potential true match",
                "Disprove / false positive",
                "Request more information",
                "Not adverse / not relevant",
              ]}
              onChange={setDecision}
            />
            <label>
              Rationale, evidence and unresolved questions
              <Textarea
                rows={4}
                maxLength={10000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain which identifiers support or challenge identity, how reliable the source is, and what is still unknown."
              />
            </label>
            <details>
              <summary>QC reviewer check</summary>
              <div className="two-col">
                <Field
                  label="Reviewer name (self-reported)"
                  value={reviewer}
                  onChange={setReviewer}
                />
                <Choice
                  label="QC outcome"
                  value={qc}
                  values={[
                    "Not reviewed",
                    "Return for clarification",
                    "Documentation reviewed",
                  ]}
                  onChange={setQc}
                />
              </div>
              <label>
                QC comments
                <Textarea
                  value={qcNote}
                  rows={3}
                  maxLength={5000}
                  onChange={(e) => setQcNote(e.target.value)}
                />
              </label>
              <Button variant="outline" onClick={recordQc}>
                Record QC snapshot
              </Button>
              {snapshot && (
                <p className="callout">
                  {stale
                    ? "Assessment changed since QC. Another review is required."
                    : `QC snapshot: ${snapshot.qc} · ${snapshot.reviewer}`}
                </p>
              )}
              <p className="small">
                Reviewer names are self-reported. This prototype does not
                enforce independent review or provide a tamper-proof audit
                trail.
              </p>
            </details>
            <Button onClick={download}>
              <Download size={16} /> Export case and evidence
            </Button>
          </section>
        </TabsContent>
        <TabsContent value="discover">
          <section className="panel discover">
            <p className="eyebrow">NEWS DISCOVERY</p>
            <h2>Start broad. Verify the person behind each hit.</h2>
            <p>
              Search for <b>{party.name || "a customer name"}</b>. Search sends
              the name and risk keywords to the selected provider; DOB and
              address are excluded.
            </p>
            <div className="actions">
              <Button
                disabled={busy || party.name.trim().length < 3}
                onClick={searchNews}
              >
                <Search size={16} />
                {busy ? "Searching recent coverage…" : "Search recent news"}
              </Button>
              <a
                className="link-button"
                href={google}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Google search <ArrowUpRight size={16} />
              </a>
              <Button variant="outline" onClick={() => addHit()}>
                Import a hit manually
              </Button>
            </div>
            <p className="small">
              Recent news uses GDELT: up to 25 leads over the last 3 months,
              with English risk keywords. Google opens separately; results are
              not automatically imported. Neither search is exhaustive.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {news && (
              <>
                <p className="callout">
                  {news.articles.length} unique article links · Retrieved{" "}
                  {new Date(news.retrievedAt).toLocaleString()}
                  <br />
                  {news.scope}
                </p>
                {news.articles.length === 0 && (
                  <p>
                    No leads returned in this search window. This is not
                    clearance or evidence that no adverse information exists.
                  </p>
                )}
                {news.articles.map((a: any) => (
                  <article className="news-hit" key={a.url}>
                    <div>
                      <a
                        href={safeUrl(a.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {a.title}
                      </a>
                      <p className="small">
                        {new URL(a.url).hostname} · {a.language} · Publisher
                        country: {a.publisherCountry || "not provided"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        addHit(
                          { ...blankHit, title: a.title, url: a.url },
                          "Live article lead · identifiers unverified",
                        )
                      }
                    >
                      Review hit
                    </Button>
                  </article>
                ))}
              </>
            )}
            {!news && !busy && !error && (
              <div className="empty">
                <ScanSearch size={38} />
                <h3>A search hit is the beginning of the review.</h3>
                <p>
                  Read the source, enter only identifiers actually attributed to
                  its subject, then compare.
                </p>
              </div>
            )}
          </section>
        </TabsContent>
        <TabsContent value="data">
          <div className="data-layout">
            <section className="panel">
              <p className="eyebrow">SQL TRAINING DATA</p>
              <h2>Test the edge cases.</h2>
              <p>
                These fictional cases are stored in SQLite / Cloudflare D1.
                Loading an example replaces the current unsaved review.
              </p>
              {dbError && <p className="error">{dbError}</p>}
              {!examples && !dbError && <p>Loading training cases…</p>}
              {examples?.cases.map((c: any) => (
                <button
                  className="example"
                  key={c.id}
                  onClick={() =>
                    replaceCase(
                      JSON.parse(c.party_json),
                      JSON.parse(c.hit_json),
                      "Fictional training case",
                    )
                  }
                >
                  <b>{c.label}</b>
                  <span>{c.explanation}</span>
                  <small>{c.expected_disposition} →</small>
                </button>
              ))}
              <a href="/data-model.sql" download>
                Download the SQL data model and analysis queries
              </a>
            </section>
            <section className="panel">
              <p className="eyebrow">TRANSPARENT LOGIC · {VERSION}</p>
              <h2>Explainable first, calibrated later.</h2>
              <p>
                The current engine uses deterministic identity rules. It is not
                a trained AI model and does not invent match probabilities.
              </p>
              <ol>
                <li>
                  Name + full DOB or same-registry registration match →
                  escalate, even with different locations.
                </li>
                <li>
                  Verified identifier conflict + cited evidence → candidate for
                  disproof, with analyst rationale.
                </li>
                <li>
                  Name match with missing identifiers → escalate for additional
                  review, not a confirmed match.
                </li>
                <li>
                  Different name + strong identifier match → review aliases or
                  data quality.
                </li>
                <li>
                  Missing or unassigned data → unknown, never an automatic false
                  positive.
                </li>
              </ol>
              <p>
                Before adding AI probability estimates: independently label
                cases, separate training and test entities, measure missed
                matches and false positives, calibrate probabilities, and assess
                performance on common names and incomplete records.
              </p>
              <p>
                <a
                  href="https://wolfsberg-group.org/news/publication-of-the-negative-news-screening-faqs/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wolfsberg negative news screening guidance
                </a>{" "}
                informs source reliability, materiality and review governance.
              </p>
              <h3>
                <Database size={18} className="inline" /> Evidence completeness
                in the training set
              </h3>
              <pre>
                SELECT field, state, COUNT(*) AS hit_count{"\n"}FROM
                comparison_examples{"\n"}GROUP BY field, state;
              </pre>
              {examples && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identifier</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examples.summary.map((r: any) => (
                      <TableRow key={r.field + r.state}>
                        <TableCell>{r.field}</TableCell>
                        <TableCell>{r.state}</TableCell>
                        <TableCell>{r.hit_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <p className="small">
                Counts describe synthetic test cases, not measured model
                performance. Customer edits and live article reviews are not
                stored in this shared database.
              </p>
            </section>
          </div>
        </TabsContent>
      </Tabs>
      <div role="status" aria-live="polite" className={message ? "toast" : ""}>
        {message && (
          <>
            <CheckCircle2 size={18} />
            {message}
            <button aria-label="Dismiss message" onClick={() => setMessage("")}>
              ×
            </button>
          </>
        )}
      </div>
      <footer>
        Independent educational prototype · No employer endorsement · {VERSION}{" "}
        · Export before closing this tab
      </footer>
    </main>
  );
}

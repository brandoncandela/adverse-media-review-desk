# Adverse Media Review Desk

**Brandon Candela · AML transaction monitoring, adverse media investigations and SQL analysis**

[Open the public browser demo](https://brandon-adverse-media-review-desk.brandon-d-candela.chatgpt.site/) · [GitHub profile](https://github.com/brandoncandela)

An independent AML portfolio prototype by Brandon Candela for comparing an individual or business with an adverse media subject, recording an explained disposition, and preserving a QC snapshot.

## SQL portfolio: start here

**Business problem:** an AML analyst needs to separate identity evidence from missing information and explain which media hits need further review. SQL makes the training evidence queryable and the example triage logic inspectable.

| SQL skill | Working evidence | AML purpose |
| --- | --- | --- |
| Relational modeling and foreign keys | [Training schema and migrations](drizzle/0000_careless_human_fly.sql) | Link each comparison to its training case |
| CTEs, conditional aggregation and CASE | [Training triage view](drizzle/0002_triage_view.sql) | Turn recorded comparison states into explained review categories |
| JOINs | [Database-backed examples endpoint](app/api/examples/route.ts) | Combine case details with the SQL-derived disposition |
| GROUP BY and COUNT | [Examples endpoint](app/api/examples/route.ts) | Summarize matches, variants, conflicts and unknowns by identifier |
| JSON extraction | [SQL view](drizzle/0002_triage_view.sql) | Check verification status and source evidence |
| Schema design | [Downloadable SQL](public/data-model.sql) | Inspect working training tables and a separately labeled proposed case store |

### A three-minute technical walkthrough

1. Open the browser demo and inspect the fictional training examples.
2. Read the SQL view: explain why matching name and DOB still require escalation when location differs.
3. Inspect the endpoint JOIN and aggregation. These queries run against Cloudflare D1, which uses SQLite.
4. Run the reproducible SQL examples below. Explain what the results establish and what the small fixture dataset cannot establish.

### Run the SQL locally

With SQLite installed, load the fictional dataset into an in-memory database:

```sh
sqlite3 :memory: ".read public/data-model.sql"
```

Or apply the three files in `drizzle/` in order to an empty SQLite database. Then run:

```sql
-- Review workload by rule-based disposition.
SELECT disposition, COUNT(*) AS training_case_count
FROM training_triage
GROUP BY disposition
ORDER BY training_case_count DESC, disposition;

-- Identify evidence gaps without treating unknown values as mismatches.
SELECT field, COUNT(*) AS unknown_comparisons
FROM comparison_examples
WHERE state = 'unknown'
GROUP BY field
ORDER BY unknown_comparisons DESC, field;

-- Check the view against the curated expected outcomes.
-- Zero rows means fixture agreement, not measured real-world accuracy.
SELECT t.id, t.expected_disposition, v.disposition AS sql_disposition
FROM training_cases AS t
LEFT JOIN training_triage AS v ON v.id = t.id
WHERE v.id IS NULL OR t.expected_disposition <> v.disposition;
```

**Scope:** nine synthetic cases and 27 comparisons. This demonstrates SQL implementation and investigative reasoning, not large-scale performance, calibrated identity probabilities or production database administration. Browser-entered customer reviews are not stored in the shared training database. The additional normalized case-store tables in the downloadable file are a proposal, not a deployed customer database.

## Browser workflow

1. Open the app and review the fictional John Smith case, or start a new case.
2. Enter known customer identifiers. Missing middle names, DOBs or countries are not mismatches.
3. Discover recent article leads through GDELT, open a Google search, or manually import an article URL and short source excerpt.
4. Attribute each identifier to the subject. Publisher and event locations do not establish residence.
5. Review the transparent comparison and document an escalation, disproof or information request.
6. Export the JSON review to retain notes and evidence. Case edits remain in the current browser tab; files are not automatically saved or authenticated.

The hosted app is public. It has its own Sites source repository and local Git checkout, separate from all previous projects.

## What is implemented

- Individual name, optional aliases, DOB, reported age on publication date, address and country associations.
- Business legal names and registration identifiers scoped to the same issuing registry.
- Match / variant / conflict / unknown comparisons and deterministic, versioned triage rules.
- Name and full DOB match plus differing location: **Escalate / potential true match**. Location differences alone cannot disprove identity.
- Verified identifier conflicts can support an analyst's false-positive disposition, with evidence and rationale.
- Procedural status distinguishes allegation, investigation, charge, conviction, acquittal and retraction.
- GDELT searches send only the name and risk keywords; up to 25 article leads from a 3-month window. Provider throttling and outages return unavailable, not an empty screening result.
- Google is an external search link, not a scraper or an integrated Google results API.
- Cloudflare D1 / SQLite stores nine fictional training cases and 27 evidence comparisons. The UI reads SQL-derived triage dispositions and executes an aggregate SQL query. A downloadable SQL file provides the working training schema and a proposed normalized investigation schema.
- Customer edits and live reviews are not saved to the shared SQL training database.
- Self-reported reviewer comments and a content snapshot become stale if the assessment changes.

## Model limitations and validation plan

This version is **not a trained AI model**. No language model API is connected. No numerical true-match probabilities are assigned because no representative adjudicated dataset has been provided. Review priority is not identity confidence or criminality risk.

To add validated probabilities, obtain independently adjudicated positive and negative identity pairs with source provenance. Escalation is not a positive ground-truth label. Split train/test sets by entity and event to prevent duplicate leakage. Evaluate recall and false-positive rates separately for common names, missing identifiers, businesses, jurisdictions and transliterations. Measure calibration and review workload; preserve an abstention path for insufficient evidence. Prospective analyst review is needed before operational adoption.

String normalization is basic. Common US and UK country abbreviations are normalized. Other country synonyms, transliteration, phonetic variants, address resolution and corporate ownership are not inferred. Human source attribution and data-quality checks remain necessary. A common name is never proof of identity; adverse allegations are not proof of misconduct.

No employer material, proprietary rules, attached photographs, confidential cases, or real allegations are included in the sample data. This independent work sample is not employer endorsed and has not been validated for production compliance use.

## SQL and local development

Install Node 22.13 or later, then run `npm run install:ci` and `npm run dev`.

- `npm run build`: build the Worker and assets.
- `node --experimental-strip-types --test tests/*.test.ts`: meaningful matching edge-case tests.
- `npx tsc --noEmit`: type validation.
- `public/data-model.sql`: runnable SQLite training data and proposed normalized case schema.
- `db/schema.ts` and `drizzle/`: D1 schema and migrations.
- `lib/matching.ts`: versioned matching rules.

For local D1, build once and apply all three SQL migrations in order. First:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_careless_human_fly.sql
```

## References

- [Wolfsberg Negative News Screening FAQs](https://wolfsberg-group.org/news/publication-of-the-negative-news-screening-faqs/) for source reliability, materiality and governance.
- [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) for the article discovery endpoint.

Then repeat with `drizzle/0001_verified_conflict.sql` and `drizzle/0002_triage_view.sql`.

## Bank record versus online subject

The left panel holds analyst-entered bank information; the right holds the selected online subject and source evidence. No bank system is connected. A row-aligned comparison separates name, strong identifier and location evidence.

A case can contain up to 25 hits with independent notes, decisions and QC snapshots. Selecting another hit preserves the current draft. Exact duplicate URLs reopen the existing review. Export includes every hit and marks QC snapshots stale after material edits. Case drafts remain in the current tab.

The model recognizes supplied source aliases, possible additional or repeated surnames, and common US/UK country abbreviations. These are explainable candidate signals, not probabilistic identity confirmation. PEP/public-role records and sanctions/list records carry separate context from adverse media. Source reliability is analyst-assessed and is not an automatic score.

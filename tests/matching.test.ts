import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluate,
  exampleParty as p,
  exampleHit as h,
  blankParty,
  blankHit,
  safeUrl,
} from "../lib/matching.ts";
test("matching name and full DOB escalates despite country conflict", () => {
  const r = evaluate(p, h);
  assert.equal(r.disposition, "Escalate");
  assert.equal(r.priority, "High");
  assert.equal(r.comparisons[2].state, "conflict");
});
test("name alone remains escalation with unknown identifiers", () => {
  const r = evaluate(
    { ...blankParty, name: "John Smith" },
    { ...blankHit, name: "John Smith" },
  );
  assert.equal(r.disposition, "Escalate");
  assert.equal(r.known, 1);
  assert.notEqual(r.priority, "High");
});
test("missing middle name is not a mismatch", () =>
  assert.equal(
    evaluate(p, { ...h, name: "John Andrew Smith" }).comparisons[0].state,
    "variant",
  ));
test("unverified DOB conflict is not false positive", () =>
  assert.equal(
    evaluate(p, { ...h, dob: "1970-01-01" }).disposition,
    "Escalate",
  ));
test("verified DOB conflict needs evidence and source", () => {
  assert.notEqual(
    evaluate(p, { ...h, dob: "1970-01-01", verified: true }).disposition,
    "Disprove candidate",
  );
  assert.equal(
    evaluate(p, {
      ...h,
      dob: "1970-01-01",
      verified: true,
      url: "https://example.org/fictional-record",
    }).disposition,
    "Disprove candidate",
  );
});
test("day month reversals are ambiguous", () =>
  assert.equal(
    evaluate(p, { ...h, dob: "1985-12-04" }).comparisons[1].state,
    "variant",
  ));
test("age evaluated on article date not today", () => {
  assert.equal(
    evaluate(p, { ...h, dob: "", age: "41" }).comparisons[1].state,
    "variant",
  );
  assert.equal(
    evaluate(p, { ...h, dob: "", age: "41", published: "2025-08-20" })
      .comparisons[1].state,
    "conflict",
  );
});
test("country of event is not subject location", () =>
  assert.equal(
    evaluate(p, { ...h, country: "India", locationRole: "Event location" })
      .comparisons[2].state,
    "unknown",
  ));
test("country association only weak support", () =>
  assert.equal(
    evaluate(p, { ...h, country: "India" }).comparisons[2].state,
    "variant",
  ));
test("business identifiers need same registry", () => {
  const a = {
    ...blankParty,
    kind: "business" as const,
    name: "Example Ltd",
    registration: "123",
    registry: "A",
  };
  const b = {
    ...blankHit,
    name: "Example Ltd",
    registration: "123",
    registry: "B",
  };
  assert.equal(evaluate(a, b).comparisons[1].state, "unknown");
  assert.equal(evaluate(a, { ...b, registry: "A" }).priority, "High");
});
test("same DOB and different name requires review", () =>
  assert.equal(
    evaluate(p, { ...h, name: "James Jones" }).disposition,
    "Escalate",
  ));
test("invalid dates are unknown", () =>
  assert.equal(
    evaluate(p, { ...h, dob: "1985-02-31" }).comparisons[1].state,
    "unknown",
  ));
test("unsafe links rejected", () =>
  assert.equal(safeUrl("javascript:alert(1)"), ""));
test("a repeated surname is a possible variant, not a name conflict", () =>
  assert.equal(
    evaluate({ ...p, name: "Sara Lopez" }, { ...h, name: "Sara Lopez Lopez" })
      .comparisons[0].state,
    "variant",
  ));
test("source aliases can corroborate the recorded customer name", () =>
  assert.equal(
    evaluate(
      { ...p, name: "Sara Lopez" },
      { ...h, name: "Sara Elena Ruiz", aliases: "Sara Lopez" },
    ).comparisons[0].state,
    "variant",
  ));
test("US abbreviation normalization prevents a country false conflict", () =>
  assert.equal(
    evaluate(p, { ...h, country: "USA" }).comparisons[2].state,
    "variant",
  ));
test("PEP context does not allege wrongdoing", () =>
  assert.match(
    evaluate(p, { ...h, recordType: "PEP / public role" }).recordContext,
    /not an adverse allegation/,
  ));

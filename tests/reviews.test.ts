import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newReview,
  replaceReview,
  validateReview,
  exportReviews,
} from "../lib/reviews.ts";
import { exampleParty as p, exampleHit as h } from "../lib/matching.ts";
test("switching hits preserves independent notes and decisions", () => {
  const a = newReview("a", h),
    b = newReview("b", { ...h, dob: "1970-02-10" });
  const next = replaceReview([a, b], {
    ...a,
    note: "First candidate only",
    decision: "Escalate / potential true match",
  });
  assert.equal(next[0].note, "First candidate only");
  assert.equal(next[1].note, "");
  assert.equal(next[1].decision, "Pending review");
});
test("all-hit export recalculates and flags stale QC after customer change", () => {
  const a = {
    ...newReview("a", h),
    note: "Original rationale",
    decision: "Escalate / potential true match",
  };
  a.snapshot = {
    content: JSON.stringify({
      party: p,
      hit: h,
      note: a.note,
      decision: a.decision,
    }),
  };
  assert.equal(exportReviews(p, [a])[0].snapshot.stale, false);
  assert.equal(
    exportReviews({ ...p, name: "Another name" }, [a])[0].snapshot.stale,
    true,
  );
});
test("final disproof cannot carry through unsupported evidence", () => {
  const a = {
    ...newReview("a", h),
    decision: "Disprove / false positive",
    note: "Fictional source checks recorded in the rationale",
  };
  assert.match(validateReview(p, a), /verified identifier conflict/);
});

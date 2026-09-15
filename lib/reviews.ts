import { evaluate, type Party, type Hit } from "./matching.ts";
export type ReviewEntry = {
  id: string;
  hit: Hit;
  note: string;
  decision: string;
  reviewer: string;
  qc: string;
  qcNote: string;
  snapshot: any;
  mode: string;
};
export function newReview(
  id: string,
  hit: Hit,
  mode = "Manual source review",
): ReviewEntry {
  return {
    id,
    hit,
    note: "",
    decision: "Pending review",
    reviewer: "",
    qc: "Not reviewed",
    qcNote: "",
    snapshot: null,
    mode,
  };
}
export function replaceReview(entries: ReviewEntry[], active: ReviewEntry) {
  return entries.map((e) => (e.id === active.id ? active : e));
}
export function validateReview(party: Party, entry: ReviewEntry) {
  if (entry.decision === "Pending review") return "";
  if (entry.note.trim().length < 20)
    return "A completed disposition needs an evidence-based rationale of at least 20 characters.";
  if (
    entry.decision === "Disprove / false positive" &&
    evaluate(party, entry.hit).disposition !== "Disprove candidate"
  )
    return "Disproof needs a verified identifier conflict, source URL and excerpt.";
  return "";
}
export function exportReviews(party: Party, entries: ReviewEntry[]) {
  return entries.map((e) => ({
    ...e,
    comparison: evaluate(party, e.hit),
    snapshot: e.snapshot
      ? {
          ...e.snapshot,
          stale:
            e.snapshot.content !==
            JSON.stringify({
              party,
              hit: e.hit,
              note: e.note,
              decision: e.decision,
            }),
        }
      : null,
  }));
}

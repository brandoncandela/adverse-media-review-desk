export type Party = {
  kind: "individual" | "business";
  name: string;
  aliases: string;
  dob: string;
  address: string;
  country: string;
  associations: string;
  registration: string;
  registry: string;
};
export type Hit = {
  aliases?: string;
  recordType?: string;
  sourceReliability?: string;
  name: string;
  dob: string;
  age: string;
  address: string;
  country: string;
  registration: string;
  registry: string;
  locationRole: string;
  title: string;
  url: string;
  published: string;
  excerpt: string;
  stage: string;
  category: string;
  verified: boolean;
};
export type State = "match" | "variant" | "conflict" | "unknown";
export type Comparison = {
  field: string;
  customer: string;
  article: string;
  state: State;
  reason: string;
};
export const VERSION = "evidence-rules-1.1";
export const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
export const safeUrl = (s: string) => {
  try {
    const u = new URL(s);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
};
export function validDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  );
}
export function compareName(p: Party, h: Hit): Comparison {
  const a = normalize(p.name),
    b = normalize(h.name);
  let state: State = "unknown",
    reason =
      "The article subject must be identified; a search query is not evidence of a name match.";
  if (a && b) {
    const aliases = p.aliases.split(";").map(normalize).filter(Boolean);
    if (a === b) {
      state = "match";
      reason =
        "Names match after case, punctuation and accent normalization. Common names still need corroboration.";
    } else if (
      aliases.includes(b) ||
      (h.aliases || "").split(";").map(normalize).filter(Boolean).includes(a)
    ) {
      state = "variant";
      reason =
        "A supplied customer or source alias aligns. Verify the alias attribution in the original record.";
    } else {
      const aa = a.split(" "),
        bb = b.split(" ");
      if (
        aa.length > 1 &&
        bb.length > 1 &&
        aa[0] === bb[0] &&
        aa.at(-1) === bb.at(-1) &&
        (aa.length === 2 || bb.length === 2)
      ) {
        state = "variant";
        reason =
          "First and last names agree; a missing middle name is not a contradiction.";
      } else if (
        p.kind === "individual" &&
        aa.length >= 2 &&
        bb.length >= 2 &&
        aa[0] === bb[0] &&
        ([...new Set(aa)].every((t) => bb.includes(t)) ||
          [...new Set(bb)].every((t) => aa.includes(t)))
      ) {
        state = "variant";
        reason =
          "Shared name tokens with an additional or repeated surname. Check the complete name and naming convention; this is not an exact identity match.";
      } else if ([...aa].sort().join(" ") === [...bb].sort().join(" ")) {
        state = "variant";
        reason = "Same tokens in a different order; confirm naming convention.";
      } else {
        state = "conflict";
        reason =
          "Recorded names differ. Check aliases, transliteration and input errors before exclusion.";
      }
    }
  }
  return {
    field: "Name",
    customer: p.name || "Not provided",
    article: h.name || "Not extracted",
    state,
    reason,
  };
}
function dateComparison(p: Party, h: Hit): Comparison {
  let state: State = "unknown",
    reason = "Missing or invalid birth information is not a mismatch.";
  if (validDate(p.dob) && validDate(h.dob)) {
    if (p.dob === h.dob) {
      state = "match";
      reason = "Full dates of birth agree.";
    } else if (
      p.dob.slice(0, 4) === h.dob.slice(0, 4) &&
      p.dob.slice(5, 7) === h.dob.slice(8, 10) &&
      p.dob.slice(8, 10) === h.dob.slice(5, 7)
    ) {
      state = "variant";
      reason = "Possible day/month reversal; verify original records.";
    } else {
      state = "conflict";
      reason =
        "Full DOBs differ. Validate both sources and exclude an input error before disproving.";
    }
  } else if (validDate(p.dob) && /^\d{4}$/.test(h.dob)) {
    state = p.dob.slice(0, 4) === h.dob ? "variant" : "conflict";
    reason =
      state === "variant"
        ? "Birth year agrees, but month and day are unknown."
        : "Reported birth year differs; confirm source and possible age approximation.";
  } else if (
    validDate(p.dob) &&
    /^\d{1,3}$/.test(h.age) &&
    Number(h.age) <= 120 &&
    validDate(h.published) &&
    h.published >= p.dob
  ) {
    const birth = new Date(p.dob),
      at = new Date(h.published);
    let age = at.getUTCFullYear() - birth.getUTCFullYear();
    if (h.published.slice(5) < p.dob.slice(5)) age--;
    state = age === Number(h.age) ? "variant" : "conflict";
    reason =
      state === "variant"
        ? "Reported age is compatible on the article date; it is not a full DOB match."
        : "Reported age differs on the article date; reporting dates and approximations need verification.";
  }
  return {
    field: "Date of birth / age",
    customer: p.dob || "Not provided",
    article:
      h.dob ||
      (h.age
        ? `Age ${h.age} on ${h.published || "unknown date"}`
        : "Not provided"),
    state,
    reason,
  };
}
function identifier(p: Party, h: Hit): Comparison {
  const a = normalize(p.registration),
    b = normalize(h.registration),
    authority = normalize(p.registry),
    other = normalize(h.registry);
  let state: State = "unknown",
    reason =
      "Compare registration numbers within the same issuing registry. Businesses do not have a personal DOB.";
  if (a && b && authority && other) {
    if (authority !== other) {
      state = "unknown";
      reason =
        "Different registries: these identifiers are not directly comparable.";
    } else {
      state = a === b ? "match" : "conflict";
      reason =
        state === "match"
          ? "Registration numbers agree within the same named registry. Verify the original register."
          : "Registration numbers differ within the same named registry. Confirm branch and parent relationships.";
    }
  }
  return {
    field: "Business registration",
    customer:
      [p.registration, p.registry].filter(Boolean).join(" · ") ||
      "Not provided",
    article:
      [h.registration, h.registry].filter(Boolean).join(" · ") ||
      "Not provided",
    state,
    reason,
  };
}
export function countryKey(value: string) {
  const n = normalize(value);
  const aliases: Record<string, string> = {
    us: "united states",
    usa: "united states",
    "u s": "united states",
    "u s a": "united states",
    "united states of america": "united states",
    uk: "united kingdom",
    "u k": "united kingdom",
    "great britain": "united kingdom",
  };
  return aliases[n] || n;
}
function location(p: Party, h: Hit): Comparison {
  const customer = [p.address, p.country, p.associations]
      .filter(Boolean)
      .join(" · "),
    article = [h.address, h.country].filter(Boolean).join(" · ");
  let state: State = "unknown",
    reason =
      "Location must be attributed to the subject, not the publisher or event.";
  if (
    ["Residence / registered address", "Other subject association"].includes(
      h.locationRole,
    ) &&
    customer &&
    article
  ) {
    const aa = normalize(p.address),
      bb = normalize(h.address);
    if (aa && bb && aa === bb) {
      state = "match";
      reason =
        "Recorded addresses agree after basic normalization. Dates and occupancy are not verified.";
    } else {
      const country = countryKey(h.country),
        associations = [p.country, ...p.associations.split(";")]
          .map(countryKey)
          .filter(Boolean);
      if (country && associations.includes(country)) {
        state = "variant";
        reason =
          "Country or supplied association agrees. Country overlap alone is weak identity evidence.";
      } else if ((p.country && h.country) || (aa && bb)) {
        state = "conflict";
        reason =
          "Recorded locations differ. People move and businesses operate across borders; this alone cannot disprove identity.";
      } else
        reason = "The location details are too incomplete to compare reliably.";
    }
  }
  return {
    field: "Location / associations",
    customer: customer || "Not provided",
    article: article || "Not provided",
    state,
    reason,
  };
}
export function evaluate(p: Party, h: Hit) {
  const comparisons = [
    compareName(p, h),
    p.kind === "business" ? identifier(p, h) : dateComparison(p, h),
    location(p, h),
  ];
  const [n, id] = comparisons;
  let disposition = "Further information needed",
    priority = "Unresolved",
    rule = "R4",
    reason =
      "A name alone does not resolve identity. Obtain reliable identifiers and review the original article.";
  if ((n.state === "match" || n.state === "variant") && id.state === "match") {
    disposition = "Escalate";
    priority = "High";
    rule = "R1";
    reason =
      "Name and a strong identifier align. Location differences do not cancel this evidence; escalate as a potential identity match.";
  } else if (
    id.state === "conflict" &&
    h.verified &&
    h.excerpt.trim() &&
    safeUrl(h.url)
  ) {
    disposition = "Disprove candidate";
    priority = "Review exclusion";
    rule = "R2";
    reason =
      "A verified identifier conflict supports a false-positive disposition, subject to the analyst’s documented reasoning and QC.";
  } else if (n.state === "match" || n.state === "variant") {
    disposition = "Escalate";
    priority = id.state === "conflict" ? "Resolve conflict" : "Standard";
    rule = "R3";
    reason =
      id.state === "conflict"
        ? "The name aligns but the identifier conflicts. Verify the discrepancy; do not automatically exclude."
        : "The name aligns, but corroboration is incomplete. Escalation is a review queue, not confirmation of identity.";
  } else if (id.state === "match") {
    disposition = "Escalate";
    priority = "Resolve conflict";
    rule = "R5";
    reason =
      "A strong identifier agrees despite a different name. Check aliases, name changes and data quality.";
  }
  return {
    version: VERSION,
    comparisons,
    disposition,
    priority,
    rule,
    reason,
    recordContext: hitContext(h),
    identityBasis:
      id.state === "match" && (n.state === "match" || n.state === "variant")
        ? "Corroborated by a strong identifier"
        : id.state === "conflict"
          ? "Identifier conflict to resolve"
          : n.state === "match" || n.state === "variant"
            ? "Name lead; identity not established"
            : "Insufficient identity evidence",
    known: comparisons.filter((c) => c.state !== "unknown").length,
    limitations: [
      "Rule-based triage, not a calibrated probability or a finding of wrongdoing.",
      "No phonetic or multilingual entity-resolution model is used.",
      "Full article context, source reliability and procedural status require analyst review.",
    ],
  };
}
export const blankParty: Party = {
  kind: "individual",
  name: "",
  aliases: "",
  dob: "",
  address: "",
  country: "",
  associations: "",
  registration: "",
  registry: "",
};
export const blankHit: Hit = {
  name: "",
  dob: "",
  age: "",
  address: "",
  country: "",
  registration: "",
  registry: "",
  locationRole: "Unknown",
  title: "",
  url: "",
  published: "",
  excerpt: "",
  stage: "Unverified mention",
  category: "Unclassified",
  verified: false,
};
export const exampleParty: Party = {
  ...blankParty,
  name: "John Smith",
  dob: "1985-04-12",
  address: "1234 Brickell Avenue, Miami, FL",
  country: "United States",
  associations: "India",
};
export const exampleHit: Hit = {
  ...blankHit,
  name: "John Smith",
  dob: "1985-04-12",
  country: "United Kingdom",
  locationRole: "Residence / registered address",
  title: "Fictional exercise: identity corroboration across borders",
  published: "2026-08-20",
  excerpt:
    "FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.",
  stage: "Allegation",
  category: "Fraud",
};

export function hitContext(h: Hit) {
  if (h.recordType === "PEP / public role")
    return "This is a public-role / PEP record. PEP status alone is not an adverse allegation or evidence of wrongdoing. Verify identity and assess the role separately.";
  if (h.recordType === "Sanctions / watchlist")
    return "This is a list record, not a news allegation. Verify the original list entry and its scope separately.";
  if (
    h.stage === "Acquittal / dismissal" ||
    h.stage === "Correction / retraction"
  )
    return "Later case outcomes or corrections can change the relevance of earlier reporting. Preserve both the original allegation and the latest reliable outcome.";
  return "Identity similarity and adverse relevance are separate assessments. Confirm the subject’s role, source reliability and reported procedural status.";
}

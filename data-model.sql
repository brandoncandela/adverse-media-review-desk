-- Adverse Media Review Desk: training data + proposed case model.
-- Run locally with SQLite. Fictional examples only. No calibrated probabilities.
CREATE TABLE `comparison_examples` (
	`id` integer PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`field` text NOT NULL,
	`state` text NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `training_cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `training_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`party_json` text NOT NULL,
	`hit_json` text NOT NULL,
	`expected_disposition` text NOT NULL,
	`explanation` text NOT NULL
);

-- Independent fictional training examples. No employer policy or real allegations.
INSERT INTO training_cases VALUES ('01','Same name + DOB, different country','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"1985-04-12","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','Matching full DOB remains important when the subject has moved.');
INSERT INTO comparison_examples VALUES (1,'01','Name','match');
INSERT INTO comparison_examples VALUES (2,'01','Date of birth / age','match');
INSERT INTO comparison_examples VALUES (3,'01','Location / associations','conflict');
INSERT INTO training_cases VALUES ('02','Name only, no DOB or location','{"kind":"individual","name":"John Smith","aliases":"","dob":"","address":"","country":"","associations":"","registration":"","registry":""}','{"name":"John Smith","dob":"","age":"","address":"","country":"","registration":"","registry":"","locationRole":"Unknown","title":"","url":"","published":"","excerpt":"","stage":"Unverified mention","category":"Unclassified","verified":false}','Escalate','Missing identifiers leave identity unresolved, not disproved.');
INSERT INTO comparison_examples VALUES (4,'02','Name','match');
INSERT INTO comparison_examples VALUES (5,'02','Date of birth / age','unknown');
INSERT INTO comparison_examples VALUES (6,'02','Location / associations','unknown');
INSERT INTO training_cases VALUES ('03','Middle name missing at onboarding','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Andrew Smith","dob":"1985-04-12","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','Missing middle-name information is a possible variant.');
INSERT INTO comparison_examples VALUES (7,'03','Name','variant');
INSERT INTO comparison_examples VALUES (8,'03','Date of birth / age','match');
INSERT INTO comparison_examples VALUES (9,'03','Location / associations','conflict');
INSERT INTO training_cases VALUES ('04','Conflicting DOB, not verified','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"1970-02-10","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','A discrepancy needs source verification before an exclusion.');
INSERT INTO comparison_examples VALUES (10,'04','Name','match');
INSERT INTO comparison_examples VALUES (11,'04','Date of birth / age','conflict');
INSERT INTO comparison_examples VALUES (12,'04','Location / associations','conflict');
INSERT INTO training_cases VALUES ('05','Age compatible on article date','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"","age":"41","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','Age is weaker than an exact full date of birth.');
INSERT INTO comparison_examples VALUES (13,'05','Name','match');
INSERT INTO comparison_examples VALUES (14,'05','Date of birth / age','variant');
INSERT INTO comparison_examples VALUES (15,'05','Location / associations','conflict');
INSERT INTO training_cases VALUES ('06','Event country is not residence','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"","age":"","address":"","country":"India","registration":"","registry":"","locationRole":"Event location","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','A country mentioned in an event is not automatically a customer location.');
INSERT INTO comparison_examples VALUES (16,'06','Name','match');
INSERT INTO comparison_examples VALUES (17,'06','Date of birth / age','unknown');
INSERT INTO comparison_examples VALUES (18,'06','Location / associations','unknown');
INSERT INTO training_cases VALUES ('07','Business: matching registration','{"kind":"business","name":"Example Meridian Trading Ltd","aliases":"","dob":"","address":"","country":"United States","associations":"","registration":"DEMO-4481","registry":"Example registry"}','{"name":"Example Meridian Trading Ltd","dob":"","age":"","address":"","country":"United Kingdom","registration":"DEMO-4481","registry":"Example registry","locationRole":"Residence / registered address","title":"","url":"","published":"","excerpt":"","stage":"Unverified mention","category":"Unclassified","verified":false}','Escalate','A same-registry identifier can corroborate a business despite different operating locations.');
INSERT INTO comparison_examples VALUES (19,'07','Name','match');
INSERT INTO comparison_examples VALUES (20,'07','Business registration','match');
INSERT INTO comparison_examples VALUES (21,'07','Location / associations','conflict');
INSERT INTO training_cases VALUES ('08','Possible day/month input reversal','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"1985-12-04","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','Do not turn a plausible input error into an automatic exclusion.');
INSERT INTO comparison_examples VALUES (22,'08','Name','match');
INSERT INTO comparison_examples VALUES (23,'08','Date of birth / age','variant');
INSERT INTO comparison_examples VALUES (24,'08','Location / associations','conflict');

-- A normalized schema for a future authenticated case store.
CREATE TABLE customers (customer_id TEXT PRIMARY KEY, entity_type TEXT NOT NULL CHECK(entity_type IN ('individual','business')), name_raw TEXT NOT NULL, dob TEXT, registration_number TEXT, registry TEXT);
CREATE TABLE customer_locations (location_id INTEGER PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(customer_id), location_value TEXT NOT NULL, location_role TEXT NOT NULL, valid_from TEXT, valid_to TEXT, source_reference TEXT);
CREATE TABLE media_hits (hit_id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(customer_id), source_url TEXT NOT NULL, retrieved_at TEXT NOT NULL, published_at TEXT, source_excerpt TEXT, procedural_status TEXT, duplicate_group TEXT);
CREATE TABLE evidence_comparisons (comparison_id INTEGER PRIMARY KEY, hit_id TEXT NOT NULL REFERENCES media_hits(hit_id), field TEXT NOT NULL, customer_value TEXT, media_value TEXT, comparison_state TEXT NOT NULL CHECK(comparison_state IN ('match','variant','conflict','unknown')), evidence_reference TEXT, verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)), rule_version TEXT NOT NULL);
CREATE TABLE adjudications (adjudication_id INTEGER PRIMARY KEY, hit_id TEXT NOT NULL REFERENCES media_hits(hit_id), decision TEXT NOT NULL, rationale TEXT NOT NULL, analyst_id TEXT NOT NULL, decided_at TEXT NOT NULL, qc_outcome TEXT, qc_reviewer_id TEXT);

-- Completeness analysis: UNKNOWN must never be counted as conflict.
SELECT field, state, COUNT(*) AS hit_count FROM comparison_examples GROUP BY field, state ORDER BY field, state;
-- Case-level comparison audit: joins preserve the evidence context.
SELECT t.label, t.expected_disposition, c.field, c.state FROM training_cases t JOIN comparison_examples c ON c.case_id=t.id ORDER BY t.id,c.id;
-- Examples with missing identifiers: prioritise additional data collection.
SELECT t.id,t.label,COUNT(*) AS unknown_fields FROM training_cases t JOIN comparison_examples c ON c.case_id=t.id WHERE c.state='unknown' GROUP BY t.id,t.label;
-- Future labeled validation must group train/test splits by entity and event.
-- Escalated cases are not automatically positive training labels.

-- Additional exclusion example
INSERT INTO training_cases VALUES ('09','Verified DOB conflict with evidence','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"1970-02-10","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: verified DOB conflict","url":"https://brandon-adverse-media-review-desk.brandon-d-candela.chatgpt.site/fictional-record.html","published":"2026-08-20","excerpt":"FICTIONAL TRAINING RECORD. Source subject John Smith has DOB 10 February 1970. The training customer record has DOB 12 April 1985. For this exercise, both dates have been checked and an entry error excluded.","stage":"Allegation","category":"Fraud","verified":true}','Disprove candidate','A sourced and verified identity conflict supports disproof; location alone never does.');
INSERT INTO comparison_examples VALUES (25,'09','Name','match');
INSERT INTO comparison_examples VALUES (26,'09','Date of birth / age','conflict');
INSERT INTO comparison_examples VALUES (27,'09','Location / associations','conflict');

-- SQL triage for the curated training set. Production URL validation remains application-side.
CREATE VIEW training_triage AS
WITH evidence AS (
  SELECT t.id,
    MAX(CASE WHEN c.field='Name' THEN c.state END) AS name_state,
    MAX(CASE WHEN c.field IN ('Date of birth / age','Business registration') THEN c.state END) AS identifier_state,
    json_extract(t.hit_json,'$.verified') AS verified,
    json_extract(t.hit_json,'$.url') AS source_url,
    json_extract(t.hit_json,'$.excerpt') AS source_excerpt
  FROM training_cases t JOIN comparison_examples c ON c.case_id=t.id
  GROUP BY t.id
)
SELECT id,
  CASE
    WHEN name_state IN ('match','variant') AND identifier_state='match' THEN 'Escalate'
    WHEN identifier_state='conflict' AND verified=1 AND (source_url LIKE 'https://%' OR source_url LIKE 'http://%') AND LENGTH(TRIM(source_excerpt))>0 THEN 'Disprove candidate'
    WHEN name_state IN ('match','variant') THEN 'Escalate'
    WHEN identifier_state='match' THEN 'Escalate'
    ELSE 'Further information needed'
  END AS disposition
FROM evidence;

SELECT * FROM training_triage;

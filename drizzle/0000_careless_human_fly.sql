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

--> statement-breakpoint

-- Independent fictional training examples. No employer policy or real allegations.
INSERT INTO training_cases VALUES ('01','Same name + DOB, different country','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"1985-04-12","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','Matching full DOB remains important when the subject has moved.');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (1,'01','Name','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (2,'01','Date of birth / age','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (3,'01','Location / associations','conflict');
--> statement-breakpoint
INSERT INTO training_cases VALUES ('02','Name only, no DOB or location','{"kind":"individual","name":"John Smith","aliases":"","dob":"","address":"","country":"","associations":"","registration":"","registry":""}','{"name":"John Smith","dob":"","age":"","address":"","country":"","registration":"","registry":"","locationRole":"Unknown","title":"","url":"","published":"","excerpt":"","stage":"Unverified mention","category":"Unclassified","verified":false}','Escalate','Missing identifiers leave identity unresolved, not disproved.');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (4,'02','Name','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (5,'02','Date of birth / age','unknown');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (6,'02','Location / associations','unknown');
--> statement-breakpoint
INSERT INTO training_cases VALUES ('03','Middle name missing at onboarding','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Andrew Smith","dob":"1985-04-12","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','Missing middle-name information is a possible variant.');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (7,'03','Name','variant');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (8,'03','Date of birth / age','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (9,'03','Location / associations','conflict');
--> statement-breakpoint
INSERT INTO training_cases VALUES ('04','Conflicting DOB, not verified','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"1970-02-10","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','A discrepancy needs source verification before an exclusion.');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (10,'04','Name','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (11,'04','Date of birth / age','conflict');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (12,'04','Location / associations','conflict');
--> statement-breakpoint
INSERT INTO training_cases VALUES ('05','Age compatible on article date','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"","age":"41","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','Age is weaker than an exact full date of birth.');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (13,'05','Name','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (14,'05','Date of birth / age','variant');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (15,'05','Location / associations','conflict');
--> statement-breakpoint
INSERT INTO training_cases VALUES ('06','Event country is not residence','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"","age":"","address":"","country":"India","registration":"","registry":"","locationRole":"Event location","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','A country mentioned in an event is not automatically a customer location.');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (16,'06','Name','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (17,'06','Date of birth / age','unknown');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (18,'06','Location / associations','unknown');
--> statement-breakpoint
INSERT INTO training_cases VALUES ('07','Business: matching registration','{"kind":"business","name":"Example Meridian Trading Ltd","aliases":"","dob":"","address":"","country":"United States","associations":"","registration":"DEMO-4481","registry":"Example registry"}','{"name":"Example Meridian Trading Ltd","dob":"","age":"","address":"","country":"United Kingdom","registration":"DEMO-4481","registry":"Example registry","locationRole":"Residence / registered address","title":"","url":"","published":"","excerpt":"","stage":"Unverified mention","category":"Unclassified","verified":false}','Escalate','A same-registry identifier can corroborate a business despite different operating locations.');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (19,'07','Name','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (20,'07','Business registration','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (21,'07','Location / associations','conflict');
--> statement-breakpoint
INSERT INTO training_cases VALUES ('08','Possible day/month input reversal','{"kind":"individual","name":"John Smith","aliases":"","dob":"1985-04-12","address":"1234 Brickell Avenue, Miami, FL","country":"United States","associations":"India","registration":"","registry":""}','{"name":"John Smith","dob":"1985-12-04","age":"","address":"","country":"United Kingdom","registration":"","registry":"","locationRole":"Residence / registered address","title":"Fictional exercise: identity corroboration across borders","url":"","published":"2026-08-20","excerpt":"FICTIONAL TRAINING TEXT. John Smith, born 12 April 1985, is described as residing in the United Kingdom in a report alleging fraud. No real person or event is described.","stage":"Allegation","category":"Fraud","verified":false}','Escalate','Do not turn a plausible input error into an automatic exclusion.');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (22,'08','Name','match');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (23,'08','Date of birth / age','variant');
--> statement-breakpoint
INSERT INTO comparison_examples VALUES (24,'08','Location / associations','conflict');
--> statement-breakpoint

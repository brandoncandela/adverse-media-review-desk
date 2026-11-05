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

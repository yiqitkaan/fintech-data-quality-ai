/* =========================================================
   DQ DASHBOARD QUERIES
   These queries are used to analyze the results of the
   latest Data Quality (DQ) run.
   ========================================================= */


/* ---------------------------------------------------------
   DASHBOARD 1: Total failures in the latest DQ run
   Purpose:
   - High-level health check
   - Answers: "How many data quality issues exist in this run?"
   --------------------------------------------------------- */
SELECT
  r.runid,
  r.run_time,
  COUNT(f.failureid) AS total_failures
FROM dq_statistics.runs r
LEFT JOIN dq_statistics.failures f
  ON f.runid = r.runid
GROUP BY r.runid, r.run_time
ORDER BY r.runid DESC
LIMIT 1;



/* ---------------------------------------------------------
   DASHBOARD 2: Rule-based failure breakdown
   Purpose:
   - Identifies which DQ rules are failing
   - Answers: "Which data quality rules are causing issues?"
   --------------------------------------------------------- */
SELECT
  r.runid,
  r.run_time,
  f.ruleCode,
  COUNT(DISTINCT f.failureid) AS rule_failure_count
FROM dq_statistics.runs r
LEFT JOIN dq_statistics.failures f
  ON f.runid = r.runid
WHERE r.runid = (
  SELECT MAX(runid) FROM dq_statistics.runs
)
GROUP BY r.runid, r.run_time, f.ruleCode
ORDER BY r.runid DESC;



/* ---------------------------------------------------------
   DASHBOARD 3: Entity-based failure distribution
   Purpose:
   - Shows which entities are most affected
   - Answers: "Which domain (Transfer, Account, etc.) is problematic?"
   --------------------------------------------------------- */
SELECT
  r.runid,
  r.run_time,
  f.entityType,
  COUNT(DISTINCT f.failureId) AS entity_failure_count
FROM dq_statistics.runs r
INNER JOIN dq_statistics.failures f
  ON f.runid = r.runid
WHERE r.runid = (
  SELECT MAX(runid) FROM dq_statistics.runs
)
GROUP BY r.runid, r.run_time, f.entityType;



/* ---------------------------------------------------------
   DASHBOARD 4: Rule + Entity breakdown (root cause analysis)
   Purpose:
   - Combines rule and entity dimensions
   - Answers: "Which rule fails on which entity?"
   --------------------------------------------------------- */
SELECT
  r.runid,
  r.run_time,
  f.entityType,
  f.ruleCode,
  COUNT(DISTINCT f.failureId) AS failure_count
FROM dq_statistics.runs r
INNER JOIN dq_statistics.failures f
  ON f.runid = r.runid
WHERE r.runid = (
  SELECT MAX(runid) FROM dq_statistics.runs
)
GROUP BY r.runid, r.run_time, f.entityType, f.ruleCode
ORDER BY f.ruleCode;



/* ---------------------------------------------------------
   DASHBOARD 5: Drill-down view (detailed failure list)
   Purpose:
   - Operational and debugging view
   - Answers: "Exactly which records are invalid?"
   --------------------------------------------------------- */
SELECT
  f.failureid,
  f.rulecode,
  f.entitytype,
  f.entityid,
  f.createdat,
  r.runid,
  r.run_time
FROM dq_statistics.failures f
JOIN dq_statistics.runs r
  ON r.runid = f.runid
WHERE r.runid = (
  SELECT MAX(runid) FROM dq_statistics.runs
)
ORDER BY f.rulecode, f.createdat;
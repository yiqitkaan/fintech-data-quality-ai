SELECT
  f.ruleCode,
  COUNT(*) AS fail_count
FROM dq_statistics.failures f
WHERE f.runId = (SELECT MAX(runId) FROM dq_statistics.runs)
GROUP BY f.ruleCode
ORDER BY f.ruleCode;
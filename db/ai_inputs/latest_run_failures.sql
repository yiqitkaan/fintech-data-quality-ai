SELECT
  f.ruleCode,
  f.entityType,
  f.entityId
FROM dq_statistics.failures f
WHERE f.runId = (SELECT MAX(runId) FROM dq_statistics.runs)
ORDER BY f.ruleCode, f.failureId;
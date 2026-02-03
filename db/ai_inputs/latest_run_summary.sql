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

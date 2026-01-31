-- DQ-05: Currency mismatch 
-- Rule: Transfer.fromAccount and Transfer.toAccount must have the same currency.
-- This query returns transfers that violate the rule.
SELECT
  t.transferId,
  a.currency  AS fromCurrency,
  a2.currency AS toCurrency
FROM Transfer t
JOIN Account a  ON a.accountId  = t.fromAccount
JOIN Account a2 ON a2.accountId = t.toAccount
WHERE a.currency <> a2.currency;


-- DQ-04: Transfer amount mismatch
-- Rule: For any transaction linked to a transfer (transaction.transferId IS NOT NULL),
--       transaction.amount must match transfer.amount.
-- This query returns rows that violate the rule.
SELECT
  t.transferId,
  trc.transactionId,
  t.amount   AS transferAmount,
  trc.amount AS transactionAmount
FROM Transfer t
JOIN Transaction trc ON trc.transferId = t.transferId
WHERE t.amount <> trc.amount;


-- DQ-03: Transfer direction must match account role
-- Rule:
--   - If transaction.accountId = transfer.fromAccount  => direction must be 'OUT'
--   - If transaction.accountId = transfer.toAccount    => direction must be 'IN'
--   - transaction.accountId must be either fromAccount or toAccount for that transfer
SELECT
  t.transferId,
  trn.transactionId,
  trn.accountId,
  trn.direction,
  t.fromAccount,
  t.toAccount
FROM transfer t
JOIN transaction trn ON t.transferId = trn.transferId
WHERE trn.type = 'TRANSFER'
  AND (
    (trn.accountId = t.fromAccount AND trn.direction <> 'OUT')
    OR
    (trn.accountId = t.toAccount AND trn.direction <> 'IN')
    OR
    (trn.accountId NOT IN (t.fromAccount, t.toAccount))
  );


-- DQ-01: Transfer must have exactly 2 transactions
-- Rule: Each transferId should appear in exactly 2 rows in Transaction (IN + OUT).
-- This query returns transfers where the transaction count is not 2.

SELECT
  trn.transferId,
  COUNT(*) AS trn_count
FROM transaction trn
JOIN transfer t ON t.transferId = trn.transferId
GROUP BY trn.transferId
HAVING COUNT(*) <> 2;


-- DQ-02: Each transfer must have exactly 1 IN and 1 OUT transaction
-- This query returns transfers that violate the rule.
SELECT
  trn.transferId,
  SUM(CASE WHEN trn.direction = 'IN'  THEN 1 ELSE 0 END)  AS in_count,
  SUM(CASE WHEN trn.direction = 'OUT' THEN 1 ELSE 0 END)  AS out_count
FROM transaction trn
JOIN transfer t ON t.transferId = trn.transferId
GROUP BY trn.transferId
HAVING
  SUM(CASE WHEN trn.direction = 'IN'  THEN 1 ELSE 0 END) <> 1
  OR
  SUM(CASE WHEN trn.direction = 'OUT' THEN 1 ELSE 0 END) <> 1;


-- ============================
-- DQ RUNNER (v1)
-- Creates a new run and logs failures
-- ============================


-- DQ-01 :
WITH r AS (
  INSERT INTO dq_statistics.runs DEFAULT VALUES
  RETURNING runId
)
INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
SELECT
  r.runId,
  'DQ-01',
  'transfer',
  trn.transferId
FROM r
JOIN transaction trn ON trn.transferId IS NOT NULL
JOIN transfer t ON t.transferId = trn.transferId
GROUP BY r.runid, trn.transferId
HAVING COUNT(*) <> 2;

-- DQ-02 :
WITH r AS(
  INSERT INTO dq_statistics.runs DEFAULT VALUES
  RETURNING runId
)
INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
Select 
r.runId,
'DQ-02',
'Transfer',
trn.transferId
From r
INNER JOIN transaction trn on trn.transferId IS NOT NULL
where trn.transferId IS NOT NULL
GROUP BY r.runId , trn.transferId
HAVING
  SUM(CASE WHEN trn.direction = 'IN'  THEN 1 ELSE 0 END) <> 1
  OR
  SUM(CASE WHEN trn.direction = 'OUT' THEN 1 ELSE 0 END) <> 1;


-- DQ-03 :

WITH r AS (
  INSERT INTO dq_statistics.runs DEFAULT VALUES
  RETURNING runId 
)
INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
SELECT DISTINCT r.runId , 'DQ-03' , 'Transfer' , t.transferId 
FROM r 
INNER JOIN Transaction trn on trn.transferId IS NOT NULL 
INNER JOIN Transfer t on t.transferId = trn.transferId 
WHERE trn.type = 'TRANSFER'
  AND (
    (trn.accountId = t.fromAccount AND trn.direction <> 'OUT')
    OR
    (trn.accountId = t.toAccount   AND trn.direction <> 'IN')
    OR
    (trn.accountId NOT IN (t.fromAccount, t.toAccount))
  );

-- DQ-04 :

WITH r AS(
    INSERT INTO dq_statistics.runs DEFAULT VALUES
    RETURNING runId
)

INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
SELECT DISTINCT
r.runId , 'DQ-04', 'Transfer' , t.transferId
from r
INNER JOIN transfer t on true
INNER JOIN transaction trn on trn.transferId = t.transferId 
WHERE t.amount <> trn.amount ;


-- DQ-05 :

WITH r AS(
    INSERT INTO dq_statistics.runs DEFAULT VALUES
    RETURNING runId
)

INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
SELECT DISTINCT
r.runId , 'DQ-05', 'Transfer' , t.transferId
FROM r 
INNER JOIN transfer t on true 
INNER JOIN account a1 on a1.accountId = t.fromAccount
INNER JOIN account a2 on a2.accountId = t.toAccount
WHERE a1.currency <>a2.currency ;


SELECT *
FROM dq_statistics.runs
ORDER BY runid DESC
LIMIT 30;

SELECT *
FROM dq_statistics.failures
ORDER BY failureId DESC
LIMIT 20;

-- Single-run DQ runner: executes all DQ rules in one run and logs all detected data quality failures under the same runId.
-- Executes all data quality rules in a single run and records every violation in dq_statistics.failures for audit and reporting.
WITH r AS (
  INSERT INTO dq_statistics.runs DEFAULT VALUES
  RETURNING runid
),

dq01 AS (
  INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
  SELECT
    r.runid,
    'DQ-01',
    'Transfer',
    trn.transferId
  FROM r
  JOIN transaction trn ON trn.transferId IS NOT NULL
  JOIN transfer t ON t.transferId = trn.transferId
  GROUP BY r.runid, trn.transferId
  HAVING COUNT(*) <> 2
  RETURNING 1
),

dq02 AS (
  INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
  SELECT
    r.runid,
    'DQ-02',
    'Transfer',
    t.transferId
  FROM r
  JOIN transaction trn ON trn.transferId IS NOT NULL
  JOIN transfer t ON t.transferId = trn.transferId
  GROUP BY r.runid, t.transferId
  HAVING
    SUM(CASE WHEN trn.direction = 'OUT' THEN 1 ELSE 0 END) <> 1
    OR
    SUM(CASE WHEN trn.direction = 'IN'  THEN 1 ELSE 0 END) <> 1
  RETURNING 1
),

dq03 AS (
  INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
  SELECT DISTINCT
    r.runid,
    'DQ-03',
    'Transfer',
    t.transferId
  FROM r
  JOIN transaction trn ON trn.transferId IS NOT NULL
  JOIN transfer t ON t.transferId = trn.transferId
  WHERE trn.type = 'TRANSFER'
    AND (
      (trn.accountId = t.fromAccount AND trn.direction <> 'OUT')
      OR
      (trn.accountId = t.toAccount   AND trn.direction <> 'IN')
      OR
      (trn.accountId NOT IN (t.fromAccount, t.toAccount))
    )
  RETURNING 1
),

dq04 AS (
  INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
  SELECT DISTINCT
    r.runid,
    'DQ-04',
    'Transfer',
    t.transferId
  FROM r
  JOIN transaction trn ON trn.transferId IS NOT NULL
  JOIN transfer t ON t.transferId = trn.transferId
  WHERE trn.type = 'TRANSFER'
    AND t.amount <> trn.amount
  RETURNING 1
),

dq05 AS (
  INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
  SELECT DISTINCT
    r.runid,
    'DQ-05',
    'Transfer',
    t.transferId
  FROM r
  JOIN transfer t ON true
  JOIN account a_from ON a_from.accountId = t.fromAccount
  JOIN account a_to   ON a_to.accountId   = t.toAccount
  WHERE a_from.currency <> a_to.currency
  RETURNING 1
),
-- DQ-C01: Identifies ACTIVE customers without at least one linked account, indicating incomplete onboarding.
dqC01 AS (
  INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
  SELECT DISTINCT
    r.runid,
    'DQ-C01',
    'Customer',
    c.customerid
  FROM r
  INNER JOIN customer c ON TRUE
  LEFT JOIN account a ON a.customerid = c.customerid
  WHERE c.status = 'ACTIVE' AND a.accountid IS NULL
  RETURNING 1 

),
-- DQ-A01: Flags ACTIVE accounts that have no associated transactions, indicating unused or incorrectly activated accounts.
dqA01 AS (
  INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
  SELECT DISTINCT
    r.runid,
    'DQ-A01',
    'Account',
    a.accountid
  FROM r
  INNER JOIN account a ON TRUE
  LEFT JOIN transaction t ON a.accountid = t.accountid
  WHERE a.status = 'ACTIVE' AND t.accountid IS NULL
  RETURNING 1 

),
-- DQ-A02: Flags accounts involved in a transfer where the counterparty account has a different currency, indicating invalid cross-currency transfer activity.
dqA02 AS (
  INSERT INTO dq_statistics.failures (runId, ruleCode, entityType, entityId)
  SELECT DISTINCT
    r.runid,
    'DQ-A02',
    'Account',
    a.accountid
  FROM r
  JOIN account a ON TRUE
  JOIN transaction t
    ON t.accountid = a.accountid
  JOIN transfer tr
    ON tr.transferid = t.transferid
  JOIN account a2
    ON a2.accountid IN (tr.fromaccount, tr.toaccount)
   AND a2.accountid <> a.accountid
  WHERE a.currency <> a2.currency
  RETURNING 1
)

SELECT
  (SELECT runid FROM r) AS runid,
  (SELECT COUNT(*) FROM dq01) AS dq01_fail_count,
  (SELECT COUNT(*) FROM dq02) AS dq02_fail_count,
  (SELECT COUNT(*) FROM dq03) AS dq03_fail_count,
  (SELECT COUNT(*) FROM dq04) AS dq04_fail_count,
  (SELECT COUNT(*) FROM dq05) AS dq05_fail_count,
  (SELECT COUNT(*) FROM dqC01) AS dqC01_fail_count,
  (SELECT COUNT(*) FROM dqA01) AS dqA01_fail_count,
  (SELECT COUNT(*) FROM dqA02) AS dqA02_fail_count,

  (
    (SELECT COUNT(*) FROM dq01) +
    (SELECT COUNT(*) FROM dq02) +
    (SELECT COUNT(*) FROM dq03) +
    (SELECT COUNT(*) FROM dq04) +
    (SELECT COUNT(*) FROM dq05) +
    (SELECT COUNT(*) FROM dqC01)+
    (SELECT COUNT(*) FROM dqA01)+
    (SELECT COUNT(*) FROM dqA02)
  ) AS total_fail_count;

SELECT ruleCode, COUNT(*)
FROM dq_statistics.failures
WHERE runId = (SELECT runId FROM dq_statistics.runs ORDER BY runId DESC LIMIT 1)
GROUP BY ruleCode
ORDER BY ruleCode;



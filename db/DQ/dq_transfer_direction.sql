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
LIMIT 3;

SELECT *
FROM dq_statistics.failures
ORDER BY failureId DESC
LIMIT 20;


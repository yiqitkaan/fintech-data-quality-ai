-- =========================================
-- SEED DATA (valid + invalid) for DQ tests
-- Targets: DQ-01..DQ-05 + DQ-C01 + DQ-A01 should fail at least once
-- =========================================

BEGIN;

-- 0) Reset everything (so IDs are predictable)
TRUNCATE TABLE transaction, transfer, account, customer
RESTART IDENTITY CASCADE;
-- RESTART IDENTITY resets BIGSERIAL / auto-increment IDs back to 1.
-- CASCADE allows truncation even when foreign key dependencies exist.

-- 1) Customers
-- NOTE: CustomerId=4 is ACTIVE but will have NO accounts -> triggers DQ-C01
INSERT INTO customer (firstName, lastName, email, phone, status)
VALUES
  ('Ali',   'Yilmaz', 'ali@example.com',    '+905551110001', 'ACTIVE'),
  ('Ayse',  'Demir',  'ayse@example.com',   '+905551110002', 'ACTIVE'),
  ('Mehmet','Kaya',   'mehmet@example.com', '+905551110003', 'ACTIVE'),
  ('Zeynep','Acar',   'zeynep@example.com', '+905551110004', 'ACTIVE'); -- no account on purpose

-- 2) Accounts (TRY/EUR/USD mix)
-- NOTE: accountId=4 is set to ACTIVE and will have NO transactions -> triggers DQ-A01
-- After TRUNCATE RESTART IDENTITY, accountId will be 1..N in insert order.
INSERT INTO account (customerId, currency, status)
VALUES
  (1, 'TRY', 'OPEN'),    -- accountId=1  (Ali TRY)
  (1, 'USD', 'OPEN'),    -- accountId=2  (Ali USD)
  (2, 'TRY', 'OPEN'),    -- accountId=3  (Ayse TRY)
  (2, 'EUR', 'ACTIVE'),  -- accountId=4  (Ayse EUR)  <-- no transactions on purpose
  (3, 'USD', 'OPEN'),    -- accountId=5  (Mehmet USD)
  (3, 'TRY', 'OPEN');    -- accountId=6  (Mehmet TRY)

-- 3) Some non-transfer transactions (valid, transferId is NULL)
-- IMPORTANT: Do NOT reference accountId=4 here (we want it to have zero transactions for DQ-A01)
INSERT INTO transaction (accountId, transferId, type, direction, amount)
VALUES
  (1, NULL, 'DEPOSIT',  'IN',  500.00),
  (1, NULL, 'FEE',      'OUT',   10.00),
  (2, NULL, 'DEPOSIT',  'IN',  200.00),
  (3, NULL, 'WITHDRAW', 'OUT',   50.00);

-- =========================================
-- TRANSFER SCENARIOS
-- We will create 6 transfers:
--  T1: VALID (should pass DQ-01..DQ-05)
--  T2: DQ-05 Currency mismatch
--  T3: DQ-04 Amount mismatch
--  T4: DQ-01 Wrong txn count (only 1 txn)
--  T5: DQ-02 IN/OUT distribution wrong (2 IN)  (also triggers DQ-03)
--  T6: DQ-03 Role-direction wrong (swap roles, but counts OK)
-- =========================================

-- T1 (transferId=1): VALID
INSERT INTO transfer (fromAccount, toAccount, amount, status)
VALUES (1, 3, 100.00, 'POSTED');

INSERT INTO transaction (accountId, transferId, type, direction, amount)
VALUES
  (1, 1, 'TRANSFER', 'OUT', 100.00),
  (3, 1, 'TRANSFER', 'IN',  100.00);

-- T2 (transferId=2): DQ-05 Currency mismatch (USD -> TRY)
-- fromAccount=2 (USD), toAccount=3 (TRY)
INSERT INTO transfer (fromAccount, toAccount, amount, status)
VALUES (2, 3, 50.00, 'POSTED');

INSERT INTO transaction (accountId, transferId, type, direction, amount)
VALUES
  (2, 2, 'TRANSFER', 'OUT', 50.00),
  (3, 2, 'TRANSFER', 'IN',  50.00);

-- T3 (transferId=3): DQ-04 Amount mismatch
-- transfer.amount=70, but one txn uses 69
INSERT INTO transfer (fromAccount, toAccount, amount, status)
VALUES (1, 3, 70.00, 'POSTED');

INSERT INTO transaction (accountId, transferId, type, direction, amount)
VALUES
  (1, 3, 'TRANSFER', 'OUT', 70.00),
  (3, 3, 'TRANSFER', 'IN',  69.00);  -- mismatch

-- T4 (transferId=4): DQ-01 Wrong txn count (only 1 txn)
INSERT INTO transfer (fromAccount, toAccount, amount, status)
VALUES (6, 1, 25.00, 'POSTED');

INSERT INTO transaction (accountId, transferId, type, direction, amount)
VALUES
  (6, 4, 'TRANSFER', 'OUT', 25.00);  -- missing the IN txn

-- T5 (transferId=5): DQ-02 IN/OUT distribution wrong (2 IN)
-- This will also violate DQ-03 because fromAccount should be OUT.
INSERT INTO transfer (fromAccount, toAccount, amount, status)
VALUES (1, 3, 15.00, 'POSTED');

INSERT INTO transaction (accountId, transferId, type, direction, amount)
VALUES
  (1, 5, 'TRANSFER', 'IN', 15.00),   -- wrong: fromAccount but IN
  (3, 5, 'TRANSFER', 'IN', 15.00);   -- wrong: counts now 2 IN

-- T6 (transferId=6): DQ-03 Role-direction wrong (swap roles) but counts OK (1 IN + 1 OUT)
INSERT INTO transfer (fromAccount, toAccount, amount, status)
VALUES (1, 3, 33.00, 'POSTED');

INSERT INTO transaction (accountId, transferId, type, direction, amount)
VALUES
  (1, 6, 'TRANSFER', 'IN',  33.00),  -- wrong: fromAccount should be OUT
  (3, 6, 'TRANSFER', 'OUT', 33.00);  -- wrong: toAccount should be IN

COMMIT;
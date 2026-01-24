-- INT whole numbers
-- DECIMAL(M,N) decimal ama m virgül öncesi kaç basamak , n sonrası kaç basamak
--VARCHAR(1) String of text length 1 
--BLOB Binary large objects , img video vs
--DATE YYYY-MM-DD
--TIMESTAMP YYYY-MM-DD HH:MM:SS

--name VARCHAR(20) UNIQUE NOT NULL,
 


CREATE TABLE Customer (
  customerId BIGSERIAL PRIMARY KEY,
  firstName  VARCHAR(50) NOT NULL,
  lastName   VARCHAR(50) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  phone       VARCHAR(20)  NOT NULL UNIQUE,
  status      VARCHAR(20)  NOT NULL,
  createdAt  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE Account (
  accountId  BIGSERIAL PRIMARY KEY, --surrogate key (anlamsız)
  customerId BIGINT NOT NULL,
  currency   CHAR(3) NOT NULL,
  status     VARCHAR(20) NOT NULL,
  createdAt  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_account_customer_currency
    UNIQUE (customerId, currency),

  CONSTRAINT fk_account_customer
    FOREIGN KEY (customerId)
    REFERENCES customer(customerId),

  CONSTRAINT chk_account_currency
    CHECK (currency IN ('TRY','EUR','USD'))
);

CREATE TABLE Transfer(
 transferId BIGSERIAL PRIMARY KEY,
 fromAccount BIGINT NOT NULL,
 toAccount BIGINT NOT NULL,
 amount NUMERIC(18,2) NOT NULL,
 status VARCHAR(20) NOT NULL,
 time TIMESTAMPTZ NOT NULL DEFAULT now(),

 CONSTRAINT fk_transfer_fromAccount
 FOREIGN KEY (fromAccount)
 REFERENCES Account(accountId) ,

 CONSTRAINT fk_transfer_toAccount
 FOREIGN KEY (toAccount)
 REFERENCES Account(accountId) ,

 CONSTRAINT chk_transfer_amount
  CHECK (amount > 0) ,

 CONSTRAINT chk_transfer_accounts_equality
  CHECK (fromAccount <> toAccount) ,

 CONSTRAINT chk_transfer_status
  CHECK (status IN ('POSTED','REVERSED','CANCELLED'))
 

);


CREATE TABLE Transaction (
  transactionId BIGSERIAL PRIMARY KEY,
  accountId     BIGINT NOT NULL,
  transferId    BIGINT,
  type          VARCHAR(10) NOT NULL,
  direction     CHAR(3) NOT NULL,
  amount        NUMERIC(18,2) NOT NULL,
  time          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_transaction_accountId
    FOREIGN KEY (accountId)
    REFERENCES Account(accountId),

  CONSTRAINT fk_transaction_transferId
    FOREIGN KEY (transferId)
    REFERENCES Transfer(transferId),

  CONSTRAINT chk_transaction_amount
    CHECK (amount > 0),

  CONSTRAINT chk_transaction_type
    CHECK (type IN ('DEPOSIT','WITHDRAW','TRANSFER','FEE')),

  CONSTRAINT chk_transaction_direction
    CHECK (direction IN ('IN','OUT')),

  -- Eğer transferId doluysa: type TRANSFER olmalı
  CONSTRAINT chk_transaction_transfer_requires_type
    CHECK (transferId IS NULL OR type = 'TRANSFER'),

  -- Type ile direction uyumu (çok iyi bir fintech kuralı)
  CONSTRAINT chk_transaction_type_direction_consistency
    CHECK (
      (type = 'DEPOSIT'  AND direction = 'IN') OR
      (type = 'WITHDRAW' AND direction = 'OUT') OR
      (type = 'FEE'      AND direction = 'OUT') OR
      (type = 'TRANSFER' AND direction IN ('IN','OUT'))
    )
);
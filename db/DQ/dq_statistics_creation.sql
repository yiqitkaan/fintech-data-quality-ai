CREATE SCHEMA IF NOT EXISTS dq_statistics;
SET search_path TO dq_statistics;

CREATE TABLE Runs(
    runId BIGSERIAL Primary Key ,
    run_time TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO dq_statistics.Runs DEFAULT VALUES;
DELETE FROM dq_statistics.Runs ;


SELECT * FROM dq_statistics.Runs;

CREATE TABLE Failures(
    failureId BIGSERIAL Primary Key , 
    runId BIGINT NOT NULL  ,
    ruleCode VARCHAR(20) NOT NULL ,
    entityType VARCHAR(10) NOT NULL ,
    entityId BIGINT NOT NULL ,
    createdAt TIMESTAMPTZ  NOT NULL DEFAULT now() ,
   
    CONSTRAINT fk_failure_run FOREIGN KEY (runId) REFERENCES Runs(runId)
);

SELECT * 
FROM dq_statistics.failures
ORDER BY failureId DESC
LIMIT 20;

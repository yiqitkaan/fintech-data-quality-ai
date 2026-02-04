# Data Quality Run Report

## Executive Summary
The latest data quality pipeline run (runId: 14) conducted on January 31, 2026, has identified a total of 11 failures across various data quality rules. These violations pose significant risks to our financial reporting and AI-driven summaries, potentially leading to ledger imbalances, operational anomalies, and compliance issues. Immediate attention is required to address these findings and mitigate risks associated with dirty data propagation.

## Key Findings (by rule)
- **DQ-02 (2 failures)**: There are instances of transfers with either multiple IN or OUT transactions, leading to potential balance inaccuracies.
- **DQ-03 (2 failures)**: Transactions are recorded with incorrect directions relative to their associated transfer accounts, risking reversed accounting entries.
- **DQ-A02 (2 failures)**: Accounts involved in cross-currency transfers lack the necessary FX workflows, which could corrupt ledger integrity.
- **DQ-01 (1 failure)**: A transfer was found with an incorrect number of transaction rows, indicating potential ledger imbalances.
- **DQ-04 (1 failure)**: A mismatch was detected between transfer amounts and linked transaction amounts, jeopardizing financial reporting accuracy.
- **DQ-05 (1 failure)**: A transfer was flagged for involving accounts with different currencies, raising compliance concerns.
- **DQ-A01 (1 failure)**: An ACTIVE account was found with no transactions, indicating a potential ghost account.
- **DQ-C01 (1 failure)**: An ACTIVE customer lacks any associated accounts, suggesting onboarding issues.

## Example Violations
- **DQ-01**: Violation ID [4] indicates a transfer with missing transaction rows.
- **DQ-02**: Violation IDs [4, 5] show transfers with incorrect transaction counts.
- **DQ-03**: Violation IDs [5, 6] highlight mismatched transaction directions.
- **DQ-A02**: Violation IDs [2, 3] flag accounts involved in unauthorized cross-currency transfers.

## Recommended Actions
1. **Immediate Investigation**: Conduct a thorough review of the identified violations to understand root causes.
2. **Data Correction**: Implement corrective measures for the affected transfers and transactions to ensure compliance with data quality rules.
3. **Enhance Monitoring**: Strengthen monitoring mechanisms to catch similar violations in future runs.

## Quick Wins (1 day)
- Initiate a review of the transactions associated with the flagged violation IDs to identify and rectify obvious discrepancies.
- Communicate with relevant teams (Backend/Data Engineering, Ops) to ensure awareness and prompt action on critical violations.

## Next Steps (1-2 weeks)
- Develop a comprehensive action plan to address systemic issues contributing to the violations.
- Schedule a cross-functional meeting to discuss findings and align on strategies for improving data quality and compliance.
- Implement automated checks for the most critical data quality rules to prevent recurrence of similar issues in future runs.
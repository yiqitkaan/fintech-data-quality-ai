# Data Quality Run Report

## Executive Summary
The latest Data Quality (DQ) pipeline run (runId: 14) conducted on January 31, 2026, has identified a total of 11 failures across various rules. These violations pose significant risks to our financial reporting and AI-driven summaries, potentially leading to ledger imbalances, operational anomalies, and compliance issues. Immediate attention is required to address these discrepancies and ensure the integrity of our data.

## Key Findings (by rule)
- **DQ-02 (2 failures)**: Issues with transfers lacking the required one IN and one OUT transaction, indicating potential one-sided ledger entries.
- **DQ-03 (2 failures)**: Transactions where the direction does not align with the account role in the transfer, risking reversed accounting entries.
- **DQ-A02 (2 failures)**: Accounts involved in cross-currency transfers without an appropriate FX workflow, threatening ledger integrity.
- **DQ-01 (1 failure)**: A transfer missing the requisite two transaction rows, which can lead to reconciliation breaks.
- **DQ-04 (1 failure)**: Mismatch between transfer amounts and linked transaction amounts, jeopardizing financial reporting accuracy.
- **DQ-05 (1 failure)**: Transfer accounts with differing currencies, which could result in incorrect amounts and reporting errors.
- **DQ-A01 (1 failure)**: An active account without any transactions, indicating potential ghost accounts.
- **DQ-C01 (1 failure)**: An active customer lacking any associated accounts, leading to onboarding inconsistencies.

## Example Violations
- **DQ-01**: Violation ID [4]
- **DQ-02**: Violation IDs [4, 5]
- **DQ-03**: Violation IDs [5, 6]
- **DQ-04**: Violation ID [3]
- **DQ-05**: Violation ID [2]
- **DQ-A01**: Violation ID [4]
- **DQ-A02**: Violation IDs [2, 3]
- **DQ-C01**: Violation ID [4]

## Recommended Actions
1. **Immediate Investigation**: Engage the Backend/Data Engineering team to investigate the root causes of the failures, particularly for DQ-02 and DQ-03, which have the highest impact.
2. **Data Correction**: Implement corrective measures to rectify identified violations, especially those related to cross-currency transfers and transaction direction.
3. **Process Review**: Review and enhance the existing data validation processes to prevent future occurrences of similar issues.

## Quick Wins (1 day)
- Conduct a focused review of the accounts flagged under DQ-A01 and DQ-C01 to identify and deactivate ghost accounts and ensure active customers have associated accounts.
- Initiate a communication with the Data Engineering team to address the most critical violations (DQ-02 and DQ-03) immediately.

## Next Steps (1-2 weeks)
- Schedule a cross-functional meeting with Backend, Ops, and Product teams to discuss findings and collaboratively develop a comprehensive action plan.
- Implement a monitoring system to track data quality metrics and establish a feedback loop for continuous improvement in data governance practices.
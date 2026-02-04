// Central dictionary for DQ rules so the LLM doesn't guess what rules mean.

const RULES = {
  "DQ-01": {
    title: "Transfer must have exactly 2 transaction rows",
    meaning:
      "Each transferId must appear in exactly 2 rows in Transaction: one OUT from the fromAccount and one IN into the toAccount.",
    risk:
      "Ledger imbalance and reconciliation breaks (missing debit/credit). Can lead to incorrect balances and audit issues.",
    ownerHint: "Backend/Data Engineering",
  },

  "DQ-02": {
    title: "Transfer must have exactly 1 IN and 1 OUT",
    meaning:
      "For a given transferId, there must be exactly one IN transaction and exactly one OUT transaction (i.e., not 2 IN or 2 OUT).",
    risk:
      "One-sided or duplicated ledger entries (2 IN / 2 OUT) can create balance inaccuracies, reconciliation breaks, and high-severity financial correctness issues.",
    ownerHint: "Backend/Data Engineering",
  },

  "DQ-03": {
    title: "Transaction direction must match account role in transfer",
    meaning:
      "If transaction.accountId = transfer.fromAccount then direction must be OUT. If transaction.accountId = transfer.toAccount then direction must be IN. No other accountId is allowed for that transferId.",
    risk:
      "Reversed accounting entries and incorrect balance movement; can mask fraud or create disputes.",
    ownerHint: "Backend/Data Engineering",
  },

  "DQ-04": {
    title: "Transfer amount must match linked transaction amounts",
    meaning:
      "For transactions linked to a transfer (transaction.transferId IS NOT NULL), transaction.amount must equal transfer.amount.",
    risk:
      "Money mismatch between transfer record and ledger entries; breaks audit trail and financial reporting accuracy.",
    ownerHint: "Backend/Data Engineering",
  },

  "DQ-05": {
    title: "Transfer accounts must have the same currency",
    meaning:
      "transfer.fromAccount and transfer.toAccount must have the same account.currency (no implicit FX).",
    risk:
      "Cross-currency movement without FX engine/valuation. Causes incorrect amounts, reporting errors, and compliance risk.",
    ownerHint: "Backend/Data Engineering / Product",
  },

  "DQ-C01": {
    title: "ACTIVE customer must have at least one account",
    meaning:
      "If customer.status = ACTIVE, the customer must have at least one related Account row.",
    risk:
      "Broken onboarding / inconsistent customer state; downstream services assume accounts exist and may fail or mis-report.",
    ownerHint: "Backend / Product Ops",
  },

  "DQ-A01": {
    title: "ACTIVE account should have at least one transaction",
    meaning:
      "If account.status = ACTIVE, the account should have at least one Transaction row (otherwise it may be a ghost/unused account).",
    risk:
      "Operational anomalies (ghost accounts), potential fraud/abuse surface, and incorrect KPI reporting (active but unused).",
    ownerHint: "Backend / Ops / Fraud monitoring",
  },

  "DQ-A02": {
    title: "Account involved in cross-currency transfer context",
    meaning:
      "Flags accounts whose TRANSFER transactions imply a cross-currency movement: the counterparty account on the same transfer has a different currency (should not happen unless an FX workflow exists).",
    risk:
      "If FX is not supported, cross-currency transfers can corrupt ledger integrity, misstate amounts/reporting, and require manual remediation.",
    ownerHint: "Backend/Data Engineering / Product",
  },
};

module.exports = { RULES };
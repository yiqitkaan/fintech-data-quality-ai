const { RULES } = require("./ruleDictionary");

function asNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function formatByRule(byRule = []) {
  const sorted = [...byRule].sort(
    (a, b) => asNumber(b.failCount) - asNumber(a.failCount),
  );
  return sorted
    .map((r) => `- ${r.ruleCode}: ${asNumber(r.failCount)}`)
    .join("\n");
}

function formatSamples(samplesByRule = {}) {
  const keys = Object.keys(samplesByRule).sort();
  if (keys.length === 0) return "- (no samples)";
  return keys
    .map((k) => `- ${k} -> [${(samplesByRule[k] || []).join(", ")}]`)
    .join("\n");
}

function formatRuleDictionary(byRule = []) {
  // Only include rules that actually appear in the run to keep prompt short
  const ruleCodes = [...new Set(byRule.map((r) => r.ruleCode))].sort();
  if (ruleCodes.length === 0) return "- (no rules in this run)";

  return ruleCodes
    .map((code) => {
      const d = RULES[code];
      if (!d) return `- ${code}: (no definition found)`;
      return `- ${code} — ${d.title}
  - Meaning: ${d.meaning}
  - Risk: ${d.risk}
  - Owner: ${d.ownerHint}`;
    })
    .join("\n");
}
function buildCtoPrompt(report) {
  // 1) alanları çek
  const runId = report?.meta?.runId ?? null;
  const runTime = report?.meta?.runTime ?? null;
  const generatedAt = report?.meta?.generatedAt ?? null;
  const totalFailures = asNumber(report?.summary?.totalFailures, 0);

  const byRuleText = formatByRule(report?.byRule);
  const samplesText = formatSamples(report?.samplesByRule);
  const ruleDictText = formatRuleDictionary(report?.byRule);

  // 2) prompt'u üret
  const prompt = `
CONTEXT:
We will report the summary of the latest FinTech data quality pipeline run (DQ run) to the CTO.
Goal: Prevent dirty data from propagating into AI summaries and financial reports.

HOW TO READ VIOLATION IDS:
- For DQ-01..DQ-05: entityId refers to transferId.
- For DQ-A01..DQ-A02: entityId refers to accountId.
- For DQ-C01: entityId refers to customerId.

RULE DICTIONARY (GROUND TRUTH — use these exact meanings; do not guess):
${ruleDictText}

LATEST RUN INPUTS:
- runId: ${runId}
- runTime (UTC): ${runTime}
- generatedAt (UTC): ${generatedAt}
- totalFailures: ${totalFailures}

RESULTS BY RULE (sorted by failCount desc):
${byRuleText}

SAMPLE VIOLATION IDS (max 3 per rule):
${samplesText}

YOUR TASK:
Based on the data above, write a "Data Quality Run Report" addressed to a CTO.

OUTPUT FORMAT (REQUIRED):
- Language: English
- Format: Markdown
- 250-400 words
- Use the following section titles exactly:
  ## Executive Summary
  ## Key Findings (by rule)
  ## Example Violations
  ## Recommended Actions
  ## Quick Wins (1 day)
  ## Next Steps (1-2 weeks)

CONSTRAINTS:
- Do not write code.
- Use executive/business language.`.trim();

  return prompt;
}

module.exports = { buildCtoPrompt };

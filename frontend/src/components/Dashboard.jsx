import { useState } from 'react'
import EntityTypeDistribution from './EntityTypeDistribution.jsx'
import EntityHealthOverview from './EntityHealthOverview.jsx'
import SimpleBarChart from './SimpleBarChart.jsx'

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

const toNumber = (value) => (Number.isFinite(value) ? value : Number(value) || 0)
const toTitleCase = (value) => {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return ''
  return `${text[0].toUpperCase()}${text.slice(1)}`
}
const ruleDefinitions = [
  { code: 'DQ-01', description: 'Each transfer must have exactly two linked transactions.' },
  { code: 'DQ-02', description: 'Transfers must have one IN and one OUT transaction.' },
  { code: 'DQ-03', description: 'Transaction direction must match account role.' },
  { code: 'DQ-04', description: 'Transfer amount must equal linked transaction amounts.' },
  { code: 'DQ-05', description: 'Transfer accounts must use the same currency.' },
  { code: 'DQ-A01', description: 'ACTIVE accounts must have at least one transaction.' },
  { code: 'DQ-A02', description: 'Cross-currency transfers require FX workflow.' },
  { code: 'DQ-C01', description: 'ACTIVE customers must have at least one account.' },
]

export default function Dashboard({ data, onReload, children }) {
  const [activeSection, setActiveSection] = useState('summary')
  const meta = data?.meta || {}
  const summary = data?.summary || {}
  const byRule = Array.isArray(data?.byRule) ? data.byRule.slice() : []
  const failures = Array.isArray(data?.failures) ? data.failures : []

  byRule.sort((a, b) => toNumber(b?.failCount) - toNumber(a?.failCount))

  const displayedFailures = failures.slice(0, 20)
  const byRuleChartData = byRule.map((rule) => ({
    label: formatValue(rule.ruleCode),
    value: toNumber(rule.failCount),
  }))
  const entityTypeCounts = failures.reduce((acc, failure) => {
    const normalizedType = toTitleCase(failure?.entityType)
    if (!normalizedType) return acc
    acc[normalizedType] = (acc[normalizedType] || 0) + 1
    return acc
  }, {})
  const entityTypeChartData = Object.entries(entityTypeCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
  const entityTypeDonutCounts = {
    Transfer: entityTypeCounts.Transfer || 0,
    Account: entityTypeCounts.Account || 0,
    Customer: entityTypeCounts.Customer || 0,
  }
  const exampleViolations = Object.values(
    failures.reduce((acc, failure) => {
      const ruleCode = formatValue(failure?.ruleCode)
      const entityType = toTitleCase(failure?.entityType) || 'Entity'
      const rawEntityId = failure?.entityId

      if (!acc[ruleCode]) {
        acc[ruleCode] = {
          ruleCode,
          entityType,
          entityIds: new Set(),
        }
      }

      if (rawEntityId !== null && rawEntityId !== undefined && rawEntityId !== '') {
        acc[ruleCode].entityIds.add(String(rawEntityId))
      }

      return acc
    }, {}),
  )
    .map((item) => ({
      ruleCode: item.ruleCode,
      entityType: item.entityType,
      entityIds: Array.from(item.entityIds).sort((a, b) => toNumber(a) - toNumber(b)),
    }))
    .sort((a, b) => a.ruleCode.localeCompare(b.ruleCode))

  return (
    <div className="page">
      <section className="project-intro" aria-labelledby="project-intro-title">
        <header className="intro-hero">
          <p className="intro-kicker">Project Overview</p>
          <h1 id="project-intro-title">FinTech Data Quality + AI Dashboard</h1>
          <p className="intro-subtitle">
            A minimal end-to-end system that validates financial data before it reaches AI-generated executive reporting.
          </p>
          <p className="intro-description">
            This project demonstrates how SQL-based data quality rules, structured reporting, and AI-generated summaries can
            work together in a FinTech environment. The dashboard visualizes the latest DQ run and the resulting CTO-level
            report.
          </p>
        </header>

        <article className="intro-block">
          <h2>Why It Matters</h2>
          <p>
            In financial systems, invalid transfers, account inconsistencies, and customer data issues can propagate into
            reporting layers and AI outputs. This project adds a Data Quality gate before AI consumption.
          </p>
        </article>

        <div className="intro-grid">
          <article className="intro-block">
            <h2>Pipeline</h2>
            <ol className="intro-steps">
              <li>Seed &amp; store financial data</li>
              <li>Run SQL-based DQ checks</li>
              <li>Build structured JSON summary</li>
              <li>Generate CTO-friendly AI report</li>
            </ol>
          </article>

          <article className="intro-block">
            <h2>What You Will See Below</h2>
            <ul className="intro-list">
              <li>Run Summary → overall state of the latest DQ run</li>
              <li>Failures by Rule → which rules failed and how often</li>
              <li>Sample Violations → example entity IDs affected</li>
              <li>CTO Report → AI-generated executive summary</li>
            </ul>
          </article>
        </div>
      </section>

      <div className="header">
        <div className="hero-title">
          <h2>Dashboard Sections</h2>
          <p className="muted">Explore each part of the latest run in focused sections.</p>
        </div>
      </div>

      <div className="controls-wrap">
        <button className="reload-button" onClick={onReload} type="button">
          Reload
        </button>
        <div className="section-switcher">
          <button
            className={`section-button${activeSection === 'summary' ? ' active' : ''}`}
            onClick={() => setActiveSection('summary')}
            type="button"
          >
            Summary Section & Charts
          </button>
          <button
            className={`section-button${activeSection === 'report' ? ' active' : ''}`}
            onClick={() => setActiveSection('report')}
            type="button"
          >
            Data Quality Run Report By AI
          </button>
        </div>
      </div>

      {activeSection === 'summary' ? (
        <>
          <div className="section-caption">
            <h2>Summary Section</h2>
            <p className="muted small">Overview, failures by rule, example violations, and first 20 failure rows.</p>
          </div>

          <div className="grid">
            <div className="card">
              <h3>Summary</h3>
              <div className="kv">
                <div>
                  <span className="label">Run ID</span>
                  <span>{formatValue(meta.runId)}</span>
                </div>
                <div>
                  <span className="label">Run Time</span>
                  <span>{formatValue(meta.runTime)}</span>
                </div>
                <div>
                  <span className="label">Generated At</span>
                  <span>{formatValue(meta.generatedAt)}</span>
                </div>
                <div>
                  <span className="label">Total Failures</span>
                  <span>{formatValue(summary.totalFailures)}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Data Quality Rule Definitions</h3>
              <section className="rule-definitions" aria-labelledby="rule-definitions-title">
                <h4 id="rule-definitions-title">Business Rule Guide</h4>
                <ul className="rule-definition-grid">
                  {ruleDefinitions.map((rule) => (
                    <li key={rule.code}>
                      <span className="mono">[{rule.code}]</span> — {rule.description}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <div className="grid">
            <div className="card">
              <h3>Example Violations</h3>
              {exampleViolations.length === 0 ? (
                <p className="muted">No example violations available.</p>
              ) : (
                <div className="violation-grid">
                  {exampleViolations.map((violation) => (
                    <article className="violation-item" key={violation.ruleCode}>
                      <p className="violation-line">
                        <span className="mono">{violation.ruleCode}</span> → <strong>{violation.entityType} IDs:</strong>{' '}
                        {violation.entityIds.length > 0 ? violation.entityIds.join(', ') : '—'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3>Failures (first 20)</h3>
              {displayedFailures.length === 0 ? (
                <p className="muted">No failures listed.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Rule Code</th>
                      <th>Entity Type</th>
                      <th className="right">Entity ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedFailures.map((failure, index) => (
                      <tr key={`${failure.ruleCode}-${failure.entityId}-${index}`}>
                        <td>{formatValue(failure.ruleCode)}</td>
                        <td>{formatValue(failure.entityType)}</td>
                        <td className="right">{formatValue(failure.entityId)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <section className="charts-section" aria-labelledby="charts-section-title">
            <div className="section-caption">
              <h2 id="charts-section-title">Charts</h2>
              <p className="muted small">Visual summaries based on the latest run output.</p>
            </div>

            <div className="grid charts-grid">
              <article className="card chart-card">
                <h3>Failures by Rule</h3>
                <SimpleBarChart data={byRuleChartData} emptyMessage="No rule failures to visualize for this run." />
              </article>

              <article className="card chart-card">
                <h3>Failures by Entity Type</h3>
                <EntityTypeDistribution barData={entityTypeChartData} counts={entityTypeDonutCounts} />
              </article>
            </div>
          </section>
        </>
      ) : (
        <div className="report-wrapper">
          <div className="section-caption">
            <h2>Data Quality Run Report By AI</h2>
            <p className="muted small">Generated narrative report for stakeholders and decision makers.</p>
          </div>
          {children ? <div className="grid">{children}</div> : null}
          <EntityHealthOverview entityHealth={data?.entityHealth} />
        </div>
      )}

      <footer className="dashboard-footer">
        <p>FinTech Data Quality + AI Dashboard</p>
        <p>Designed &amp; Implemented by Yiğit Kaan Bilir</p>
        <a
          href="https://www.linkedin.com/in/yi%C4%9Fit-kaan-bilir-902698326"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      </footer>
    </div>
  )
}

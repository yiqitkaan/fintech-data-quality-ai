const toNumber = (value) => (Number.isFinite(value) ? value : Number(value) || 0)

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return '—'
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${formatter.format(value)}%`
}

export default function EntityHealthCard({ entityName, metrics }) {
  const hasMetrics = Boolean(metrics && typeof metrics === 'object' && Object.keys(metrics).length > 0)
  const passing = hasMetrics ? toNumber(metrics.passing) : 0
  const failing = hasMetrics ? toNumber(metrics.failing) : 0
  const rawTotal = hasMetrics ? toNumber(metrics.total) : 0
  const total = rawTotal > 0 ? rawTotal : passing + failing

  const passRate = hasMetrics
    ? Number.isFinite(metrics.passRate)
      ? metrics.passRate
      : total > 0
        ? (passing / total) * 100
        : 0
    : null

  const failureRate = hasMetrics
    ? Number.isFinite(metrics.failureRate)
      ? metrics.failureRate
      : total > 0
        ? (failing / total) * 100
        : 0
    : null

  const safePassRate = Number.isFinite(passRate) ? Math.max(0, Math.min(passRate, 100)) : 0
  const passDegrees = (safePassRate / 100) * 360

  const donutStyle =
    hasMetrics && total > 0
      ? {
          backgroundImage: `conic-gradient(var(--entity-health-pass) 0deg ${passDegrees}deg, var(--entity-health-fail) ${passDegrees}deg 360deg)`,
        }
      : undefined

  return (
    <article className="card entity-health-card">
      <h3>{entityName} Health</h3>

      <div className="entity-health-donut-wrap">
        <div
          className={`entity-health-donut${hasMetrics && total > 0 ? '' : ' empty'}`}
          style={donutStyle}
          role="img"
          aria-label={`${entityName} health split: ${formatPercent(passRate)} passed and ${formatPercent(failureRate)} failed`}
        >
          <div className="entity-health-donut-core">
            <strong>{hasMetrics ? formatPercent(passRate) : '—'}</strong>
            <span>Pass Rate</span>
          </div>
        </div>
      </div>

      <ul className="entity-health-stats" role="list">
        <li>
          <span className="metric-label">Passed</span>
          <span className="metric-value">{hasMetrics ? passing : '—'}</span>
        </li>
        <li>
          <span className="metric-label">Failed</span>
          <span className="metric-value">{hasMetrics ? failing : '—'}</span>
        </li>
        <li>
          <span className="metric-label">Pass Rate</span>
          <span className="metric-value">{hasMetrics ? formatPercent(passRate) : '—'}</span>
        </li>
        <li>
          <span className="metric-label">Failure Rate</span>
          <span className="metric-value">{hasMetrics ? formatPercent(failureRate) : '—'}</span>
        </li>
      </ul>
    </article>
  )
}

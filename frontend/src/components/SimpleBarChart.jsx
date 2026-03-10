const toNumber = (value) => (Number.isFinite(value) ? value : Number(value) || 0)

const formatLabel = (value) => {
  if (value === null || value === undefined || value === '') return 'Unknown'
  return String(value)
}

export default function SimpleBarChart({ data, emptyMessage }) {
  const items = Array.isArray(data)
    ? data
        .map((item) => ({
          label: formatLabel(item?.label),
          value: Math.max(0, toNumber(item?.value)),
        }))
        .filter((item) => item.value > 0)
    : []

  if (items.length === 0) {
    return <p className="muted">{emptyMessage}</p>
  }

  const maxValue = items.reduce((max, item) => Math.max(max, item.value), 0) || 1

  return (
    <ul className="bar-chart" role="list">
      {items.map((item, index) => {
        const ratio = item.value / maxValue
        const width = `${Math.max(6, ratio * 100)}%`

        return (
          <li className="bar-item" key={`${item.label}-${index}`}>
            <div className="bar-item-head">
              <span className="bar-label">{item.label}</span>
              <span className="bar-value">{item.value}</span>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span className="bar-fill" style={{ width }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

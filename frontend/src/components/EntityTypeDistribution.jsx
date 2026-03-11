import SimpleBarChart from './SimpleBarChart.jsx'

const typeOrder = ['Transfer', 'Account', 'Customer']

const formatPercent = (value) => `${value.toFixed(1)}%`

export default function EntityTypeDistribution({ barData, counts }) {
  const safeCounts = counts || {}
  const legendItems = typeOrder.map((type) => ({
    type,
    count: Number(safeCounts[type] || 0),
  }))
  const total = legendItems.reduce((sum, item) => sum + item.count, 0)

  const donutStops = legendItems
    .reduce(
      (acc, item) => {
        const ratio = total > 0 ? item.count / total : 0
        const span = ratio * 360
        const start = acc.currentDegree
        const end = start + span
        const colorVar = `var(--donut-${item.type.toLowerCase()})`

        return {
          currentDegree: end,
          stops: [...acc.stops, `${colorVar} ${start}deg ${end}deg`],
        }
      },
      { currentDegree: 0, stops: [] },
    )
    .stops.join(', ')

  return (
    <div className="entity-distribution">
      <SimpleBarChart data={barData} emptyMessage="No entity type failures to visualize for this run." />

      {total === 0 ? (
        <p className="muted entity-donut-empty">No entity data available for percentage distribution.</p>
      ) : (
        <div className="entity-donut-area">
          <div
            className="entity-donut"
            style={{ backgroundImage: `conic-gradient(${donutStops})` }}
            role="img"
            aria-label="Entity type failure percentage distribution"
          >
            <div className="entity-donut-core">
              <span className="label">Total</span>
              <strong>{total}</strong>
            </div>
          </div>

          <ul className="entity-legend">
            {legendItems.map((item) => {
              const percentage = total > 0 ? (item.count / total) * 100 : 0
              return (
                <li key={item.type}>
                  <span className={`legend-dot ${item.type.toLowerCase()}`} aria-hidden="true" />
                  <span className="legend-text">
                    {item.type} - {item.count} ({formatPercent(percentage)})
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

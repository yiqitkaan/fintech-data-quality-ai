import EntityHealthCard from './EntityHealthCard.jsx'

const ENTITY_ORDER = ['Transfer', 'Account', 'Customer']

export default function EntityHealthOverview({ entityHealth }) {
  const hasEntityHealth =
    entityHealth && typeof entityHealth === 'object' && Object.keys(entityHealth).length > 0

  return (
    <section className="entity-health-section" aria-labelledby="entity-health-title">
      <div className="section-caption">
        <h2 id="entity-health-title">Entity Health Overview</h2>
      </div>

      {!hasEntityHealth ? (
        <div className="card">
          <p className="muted small">
            Entity health metrics are not available yet. Re-run the pipeline and copy the updated latest_run.json.
          </p>
        </div>
      ) : (
        <div className="entity-health-grid">
          {ENTITY_ORDER.map((entityName) => (
            <EntityHealthCard key={entityName} entityName={entityName} metrics={entityHealth[entityName]} />
          ))}
        </div>
      )}
    </section>
  )
}

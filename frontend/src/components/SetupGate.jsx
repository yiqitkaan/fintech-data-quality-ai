const errorMessages = {
  not_found: 'The file was not found. Ensure it exists under frontend/public/latest_run.json.',
  parse: 'The file was found but could not be parsed as JSON.',
  network: 'A network error prevented loading the file.',
  http: 'The server returned an unexpected response.',
}

export default function SetupGate({ error, onRetry }) {
  const title = 'Setup Required'
  const errorType = error?.type
  const errorDetails = error?.message
  const friendlyError = errorType ? errorMessages[errorType] || errorMessages.http : null

  return (
    <div className="page">
      <div className="card">
        <h1>{title}</h1>
        <p className="muted">
          The dashboard needs the latest pipeline output to continue.
        </p>

        {(friendlyError || errorDetails) && (
          <div className="alert">
            <strong>Load error:</strong>
            <div>{friendlyError}</div>
            {errorDetails && <div className="muted small">{errorDetails}</div>}
          </div>
        )}

        <h2>Run the pipeline</h2>
        <pre>
          <code>cd ai && npm install</code>
          <code>node src/pipeline/runPipeline.js</code>
        </pre>

        <h2>Copy the generated file</h2>
        <pre>
          <code>From: ai/reports/latest_run.json</code>
          <code>To:   frontend/public/latest_run.json</code>
        </pre>

        <button className="primary" onClick={onRetry}>
          I have run the pipeline
        </button>

        <div className="note">
          Troubleshooting: If fetch returns 404, ensure the file exists under
          <span className="mono"> frontend/public/</span>.
        </div>
      </div>
    </div>
  )
}

const errorMessages = {
  not_found: 'The file was not found (404).',
  network: 'A network error prevented loading the file.',
  http: 'The server returned an unexpected response.',
}

export default function LoadState({ status, error, loadingText, errorContent, children }) {
  if (status === 'loading') {
    return (
      <div className="load-state">
        <p className="muted">{loadingText || 'Loading...'}</p>
        <div className="loader" />
      </div>
    )
  }

  if (status === 'error') {
    const errorType = error?.type
    const errorDetails = error?.message
    const friendlyError = errorType ? errorMessages[errorType] || errorMessages.http : errorMessages.http

    return (
      <div className="load-state">
        <div className="alert">
          <strong>Load error:</strong>
          <div>{friendlyError}</div>
          {errorDetails && <div className="muted small">{errorDetails}</div>}
        </div>
        {errorContent}
      </div>
    )
  }

  return <div className="load-state">{children}</div>
}

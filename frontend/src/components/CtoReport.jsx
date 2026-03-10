import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import LoadState from './LoadState.jsx'
import { loadCtoReport } from '../utils/loadCtoReport.js'

const initialState = {
  status: 'loading',
  data: '',
  error: null,
}

export default function CtoReport() {
  const [state, setState] = useState(initialState)

  const downloadReport = useCallback(() => {
    const link = document.createElement('a')
    link.href = '/cto_report.md'
    link.download = 'cto_report.md'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const fetchReport = useCallback(async () => {
    setState({ status: 'loading', data: '', error: null })
    const result = await loadCtoReport()
    if (result.ok) {
      setState({ status: 'ready', data: result.data, error: null })
    } else {
      setState({ status: 'error', data: '', error: result.error })
    }
  }, [])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  return (
    <div className="card">
      <div className="card-header">
        <div />
        <button className="button-small" onClick={downloadReport} type="button">
          Download .md
        </button>
      </div>

      <LoadState
        status={state.status}
        error={state.error}
        loadingText="Loading CTO report..."
        errorContent={
          <div>
            <p className="muted">Setup instructions:</p>
            <pre>
              <code>Run the pipeline: cd ai && node src/pipeline/runPipeline.js</code>
              <code>Copy: ai/reports/cto_report_run_&lt;runId&gt;_*.md -&gt; frontend/public/cto_report.md</code>
            </pre>
          </div>
        }
      >
        <div className="markdown">
          <ReactMarkdown>{state.data}</ReactMarkdown>
        </div>
      </LoadState>
    </div>
  )
}

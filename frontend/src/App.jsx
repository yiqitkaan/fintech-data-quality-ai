import { useCallback, useEffect, useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import CtoReport from './components/CtoReport.jsx'
import SetupGate from './components/SetupGate.jsx'
import { loadLatestRun } from './utils/loadLatestRun.js'

const initialState = {
  status: 'loading',
  data: null,
  error: null,
}

export default function App() {
  const [state, setState] = useState(initialState)

  const fetchLatest = useCallback(async () => {
    setState({ status: 'loading', data: null, error: null })
    const result = await loadLatestRun()
    if (result.ok) {
      setState({ status: 'ready', data: result.data, error: null })
    } else {
      setState({ status: 'error', data: null, error: result.error })
    }
  }, [])

  useEffect(() => {
    fetchLatest()
  }, [fetchLatest])

  if (state.status === 'loading') {
    return (
      <div className="page">
        <div className="card">
          <h1>Loading</h1>
          <p className="muted">Fetching the latest pipeline output...</p>
          <div className="loader" />
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return <SetupGate error={state.error} onRetry={fetchLatest} />
  }

  return (
    <Dashboard data={state.data} onReload={fetchLatest}>
      <CtoReport />
    </Dashboard>
  )
}

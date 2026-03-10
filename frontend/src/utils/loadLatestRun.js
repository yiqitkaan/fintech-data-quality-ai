export async function loadLatestRun() {
  let response

  try {
    response = await fetch('/latest_run.json', { cache: 'no-store' })
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'network',
        message: 'Network error while fetching /latest_run.json.',
        original: error,
      },
    }
  }

  if (!response.ok) {
    if (response.status === 404) {
      return {
        ok: false,
        error: {
          type: 'not_found',
          message: 'latest_run.json was not found (404).',
          status: response.status,
        },
      }
    }

    return {
      ok: false,
      error: {
        type: 'http',
        message: `Request failed with status ${response.status}.`,
        status: response.status,
      },
    }
  }

  let text
  try {
    text = await response.text()
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'network',
        message: 'Failed to read response body.',
        original: error,
      },
    }
  }

  try {
    const data = JSON.parse(text)
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'parse',
        message: 'latest_run.json is not valid JSON.',
        original: error,
      },
    }
  }
}

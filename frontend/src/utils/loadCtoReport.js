export async function loadCtoReport() {
  let response

  try {
    response = await fetch('/cto_report.md', { cache: 'no-store' })
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'network',
        message: 'Network error while fetching /cto_report.md.',
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
          message: 'cto_report.md was not found (404).',
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

  return { ok: true, data: text }
}

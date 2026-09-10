import { useState } from 'react'
import './App.css'

const API_URL = 'https://nd788ggkmj.execute-api.us-east-2.amazonaws.com/prod/aitool'

const EMPTY_FALLBACK = {
  fallback_used: false,
  relaxed_field: null,
  relaxed_fields: [],
  original_constraints: null,
  relaxed_constraints: null,
  retry_count: 0,
  retry_history: [],
}

const FIELD_LABELS = {
  functions: 'Functions',
  price_type: 'Price Type',
  language: 'Language',
  use_cases: 'Use Cases',
}

function formatFieldLabel(field) {
  return FIELD_LABELS[field] || field
}

function formatToolLanguages(tool) {
  const languages = Array.isArray(tool.languages)
    ? tool.languages
    : tool.language
      ? [tool.language]
      : []

  const labels = languages
    .map((language) => {
      if (typeof language === 'string') {
        return language.trim()
      }

      return language?.language || language?.name || ''
    })
    .filter(Boolean)

  return labels.length > 0 ? labels.join(', ') : 'N/A'
}

function formatTagValue(item) {
  if (!item) {
    return ''
  }

  if (typeof item === 'string') {
    return item
  }

  if (typeof item === 'object') {
    const parts = [item.core, item.sub].filter(Boolean)
    return parts.join(' / ')
  }

  return String(item)
}

function buildConstraintGroups(constraints) {
  if (!constraints) {
    return []
  }

  return Object.entries(constraints)
    .map(([field, value]) => {
      const items = Array.isArray(value)
        ? value.map(formatTagValue).filter(Boolean)
        : value
          ? [formatTagValue(value)]
          : []

      return {
        field,
        label: formatFieldLabel(field),
        items,
      }
    })
    .filter((group) => group.items.length > 0)
}

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [message, setMessage] = useState('Your recommendations will appear here.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fallbackInfo, setFallbackInfo] = useState(EMPTY_FALLBACK)

  const handleSearch = async () => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setError('Please enter your needs first.')
      setResults([])
      setFallbackInfo(EMPTY_FALLBACK)
      setMessage('Your recommendations will appear here.')
      return
    }

    setLoading(true)
    setError('')
    setResults([])
    setFallbackInfo(EMPTY_FALLBACK)
    setMessage('Searching for matching tools...')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmedQuery,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error?.detail || `HTTP error: ${response.status}`)
      }

      const tools =
        data.tools ||
        data.results ||
        data.recommendations ||
        data.items ||
        []

      setFallbackInfo({
        fallback_used: Boolean(data.fallback_used),
        relaxed_field: data.relaxed_field ?? null,
        relaxed_fields: Array.isArray(data.relaxed_fields) ? data.relaxed_fields : [],
        original_constraints: data.original_constraints ?? null,
        relaxed_constraints: data.relaxed_constraints ?? null,
        retry_count: Number(data.retry_count || 0),
        retry_history: Array.isArray(data.retry_history) ? data.retry_history : [],
      })

      if (Array.isArray(tools) && tools.length > 0) {
        setResults(tools)
        setMessage(data.message || 'Success')
      } else {
        setResults([])
        setMessage(data.message || 'No matching tools were found.')
      }
    } catch (err) {
      console.error('Search failed:', err)
      setError(err.message || 'Request failed. Please check the API or CORS configuration.')
      setResults([])
      setFallbackInfo(EMPTY_FALLBACK)
      setMessage('Your recommendations will appear here.')
    } finally {
      setLoading(false)
    }
  }

  const relaxedConstraintGroups = buildConstraintGroups(fallbackInfo.relaxed_constraints)
  const originalConstraintGroups = buildConstraintGroups(fallbackInfo.original_constraints)
  const hasFallbackDetails =
    fallbackInfo.fallback_used ||
    fallbackInfo.retry_history.length > 0 ||
    relaxedConstraintGroups.length > 0

  return (
    <div className="page">
      <div className="card">
        <h1>What's on your mind today?</h1>
        <p className="subtitle">
          Describe the AI tool you need, including its functions, use cases, language, or pricing preferences.
        </p>

        <div className="input-group">
          <textarea
            placeholder="For example: I need an AI tool for generating presentation slides from text."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="result-box">
          {error && <p className="error-text">{error}</p>}

          {!error && message && <p className="status-text">{message}</p>}

          {!error && hasFallbackDetails && (
            <section className="fallback-panel">
              <div className="fallback-header">
                <div>
                  <p className="fallback-eyebrow">Fallback Summary</p>
                  <h2>Constraint relaxation details</h2>
                </div>
                <span className="fallback-badge">
                  {fallbackInfo.retry_count} {fallbackInfo.retry_count === 1 ? 'retry' : 'retries'}
                </span>
              </div>

              {fallbackInfo.relaxed_fields.length > 0 && (
                <div className="fallback-block">
                  <p className="block-label">Relaxed fields</p>
                  <div className="tag-list">
                    {fallbackInfo.relaxed_fields.map((field) => (
                      <span className="tag" key={field}>
                        {formatFieldLabel(field)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {relaxedConstraintGroups.length > 0 && (
                <div className="fallback-block">
                  <p className="block-label">Final hard requirements kept</p>
                  <div className="constraint-grid">
                    {relaxedConstraintGroups.map((group) => (
                      <div className="constraint-card" key={group.field}>
                        <p className="constraint-label">{group.label}</p>
                        <div className="tag-list">
                          {group.items.map((item) => (
                            <span className="tag tag-muted" key={`${group.field}-${item}`}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fallbackInfo.retry_history.length > 0 && (
                <div className="fallback-block">
                  <p className="block-label">Retry history</p>
                  <div className="history-list">
                    {fallbackInfo.retry_history.map((step) => {
                      const activeGroups = buildConstraintGroups(step.active_constraints)

                      return (
                        <div className="history-card" key={`${step.step}-${step.relaxed_field}`}>
                          <div className="history-topline">
                            <span className="history-step">Step {step.step}</span>
                            <span className="history-result">{step.result_count} results</span>
                          </div>
                          <p className="history-text">
                            Relaxed <strong>{formatFieldLabel(step.relaxed_field)}</strong>
                          </p>
                          {activeGroups.length > 0 && (
                            <div className="history-groups">
                              {activeGroups.map((group) => (
                                <div className="history-group" key={`${step.step}-${group.field}`}>
                                  <span className="history-group-label">{group.label}</span>
                                  <span className="history-group-value">{group.items.join(', ')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {originalConstraintGroups.length > 0 && (
                <div className="fallback-block">
                  <p className="block-label">Original strict constraints</p>
                  <div className="tag-list">
                    {originalConstraintGroups.flatMap((group) =>
                      group.items.map((item) => (
                        <span className="tag tag-outline" key={`original-${group.field}-${item}`}>
                          {group.label}: {item}
                        </span>
                      )),
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {!error && results.length > 0 && (
            <div className="results-list">
              {results.map((tool, index) => (
                <article className="tool-card" key={tool.tool_id || tool.id || index}>
                  <div className="tool-card-body">
                    <p className="tool-rank">Top {tool.rank || index + 1}</p>
                    <h3 className="tool-name">{tool.name || tool.tool_name || 'Unnamed Tool'}</h3>

                    {(tool.description || tool.one_line_desc) && (
                      <p className="tool-description">
                        {tool.description || tool.one_line_desc}
                      </p>
                    )}

                    <div className="tool-meta-row">
                      <div className="meta-item">
                        <span className="meta-label">Category</span>
                        <span className="meta-value">{tool.category || tool.category_name || 'N/A'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Language</span>
                        <span className="meta-value">{formatToolLanguages(tool)}</span>
                      </div>
                    </div>
                  </div>

                  {(tool.url || tool.official_url) && (
                    <a
                      href={tool.url || tool.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="tool-link"
                    >
                      Visit Tool
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

import { useState } from 'react'
import './App.css'

const API_URL = 'https://nd788ggkmj.execute-api.us-east-2.amazonaws.com/prod/aitool'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [message, setMessage] = useState('Your recommendations will appear here.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setError('Please enter your needs first.')
      setResults([])
      setMessage('Your recommendations will appear here.')
      return
    }

    setLoading(true)
    setError('')
    setResults([])
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

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const data = await response.json()
      console.log('API response:', data)

      // 这里尽量兼容不同返回结构
      const tools =
        data.tools ||
        data.results ||
        data.recommendations ||
        data.items ||
        []

      if (Array.isArray(tools) && tools.length > 0) {
        setResults(tools)
        setMessage('')
      } else {
        setResults([])
        setMessage('No matching tools were found.')
      }
    } catch (err) {
      console.error('Search failed:', err)
      setError('Request failed. Please check the API or CORS configuration.')
      setResults([])
      setMessage('Your recommendations will appear here.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1>What’s on your mind today?</h1>
        <p className="subtitle">
          Please describe what you need from AI tools, such as functions and use cases.
        </p>

        <div className="input-group">
          <textarea
            placeholder="For example: I need an AI tool for generating presentation slides from text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="result-box">
          {error && <p className="error-text">{error}</p>}

          {!error && message && <p>{message}</p>}

          {!error && results.length > 0 && (
            <div className="results-list">
              {results.map((tool, index) => (
                <div className="tool-card" key={tool.tool_id || tool.id || index}>
                  <h3>{tool.name || tool.tool_name || 'Unnamed Tool'}</h3>

                  {(tool.description || tool.one_line_desc) && (
                    <p className="tool-description">
                      {tool.description || tool.one_line_desc}
                    </p>
                  )}

                  <div className="tool-meta">
                    {(tool.category || tool.category_name) && (
                      <span>Category: {tool.category || tool.category_name}</span>
                    )}
                    {tool.language && <span>Language: {tool.language}</span>}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
import { useState, useEffect, useRef } from 'react'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApiFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null })
  const fetcherRef = useRef(fetcher)

  // Update ref to latest fetcher only after render to avoid modifying refs during render
  useEffect(() => { fetcherRef.current = fetcher }, [fetcher])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setState(s => ({ ...s, loading: true, error: null }))
    })
    fetcherRef.current()
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }) })
      .catch(e => { if (!cancelled) setState({ data: null, loading: false, error: e.message }) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

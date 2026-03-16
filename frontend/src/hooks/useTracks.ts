import { useState, useEffect, useCallback } from 'react'
import { Track, TracksParams } from '../types/track'

const PAGE_SIZE = 100

async function getApiBase(): Promise<string> {
  if (window.electronAPI) {
    return window.electronAPI.getBackendUrl()
  }
  return 'http://localhost:8000'
}

export function useTracks(params: TracksParams) {
  const [tracks, setTracks]   = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(0)

  const buildFilterQuery = (p: TracksParams) => {
    const q = new URLSearchParams()
    if (p.search)  q.set('search',  p.search)
    if (p.genre)   q.set('genre',   p.genre)
    if (p.min_bpm) q.set('min_bpm', String(p.min_bpm))
    if (p.max_bpm) q.set('max_bpm', String(p.max_bpm))
    return q
  }

  // Fetch real total count whenever filters change
  const fetchCount = useCallback(async (fetchParams: TracksParams) => {
    const apiBase = await getApiBase()
    const query   = buildFilterQuery(fetchParams)
    try {
      const res  = await fetch(`${apiBase}/tracks/count?${query}`)
      const data = await res.json()
      setTotal(data.count)
    } catch {
      // Non-fatal — pagination just won't show correct page count
    }
  }, [])

  const fetchTracks = useCallback(async (fetchParams: TracksParams, pageIndex: number) => {
    setLoading(true)
    setError(null)

    const apiBase = await getApiBase()
    const query   = buildFilterQuery(fetchParams)
    query.set('limit',  String(PAGE_SIZE))
    query.set('offset', String(pageIndex * PAGE_SIZE))

    try {
      const res = await fetch(`${apiBase}/tracks?${query}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Failed to fetch tracks')
      }
      const data: Track[] = await res.json()
      setTracks(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset page + refresh count when filters change
  useEffect(() => {
    setPage(0)
    fetchCount(params)
    fetchTracks(params, 0)
  }, [params.search, params.genre, params.min_bpm, params.max_bpm])

  // Fetch tracks when page changes
  useEffect(() => {
    fetchTracks(params, page)
  }, [page])

  return { tracks, loading, error, page, setPage, total, pageSize: PAGE_SIZE }
}

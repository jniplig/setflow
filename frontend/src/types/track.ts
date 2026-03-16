export interface Track {
  id: number
  title: string | null
  artist: string | null
  bpm: number | null
  key: string | null          // Camelot notation e.g. "8A"
  duration_seconds: number | null
  duration_formatted: string | null
  genre: string | null
  filename: string | null
}

export type SortColumn = 'title' | 'artist' | 'genre' | 'bpm' | 'key' | 'duration'
export type SortDir = 'asc' | 'desc'

export interface TracksParams {
  search?: string
  genre?: string
  min_bpm?: number
  max_bpm?: number
  limit?: number
  offset?: number
  sort_by?: SortColumn
  sort_dir?: SortDir
}

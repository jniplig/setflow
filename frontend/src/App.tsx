import { useState, useDeferredValue, useEffect } from 'react'
import { SearchBar } from './components/SearchBar'
import { TrackTable } from './components/TrackTable'
import { Pagination } from './components/Pagination'
import { SetlistPanel } from './components/SetlistPanel'
import { MiniPlayer } from './components/MiniPlayer'
import { useTracks } from './hooks/useTracks'
import { useSetlists } from './hooks/useSetlists'
import { Track, SortColumn, SortDir } from './types/track'

async function getApiBase(): Promise<string> {
  if (window.electronAPI) return window.electronAPI.getBackendUrl()
  return 'http://localhost:8000'
}

export default function App() {
  const [search, setSearch] = useState('')
  const [genre, setGenre]   = useState('')
  const [minBpm, setMinBpm] = useState<number | undefined>()
  const [maxBpm, setMaxBpm] = useState<number | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [previewTrack, setPreviewTrack] = useState<Track | null>(null)
  const [apiBase, setApiBase] = useState('http://localhost:8000')
  useEffect(() => { getApiBase().then(setApiBase) }, [])
  const [sortBy, setSortBy]   = useState<SortColumn>('artist')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const deferredSearch = useDeferredValue(search)
  const deferredGenre  = useDeferredValue(genre)

  const { tracks, loading, error, page, setPage, total, pageSize } = useTracks({
    search: deferredSearch || undefined,
    genre:  deferredGenre  || undefined,
    min_bpm: minBpm,
    max_bpm: maxBpm,
    sort_by: sortBy,
    sort_dir: sortDir,
  })

  const handleSort = (col: SortColumn) => {
    if (col === sortBy) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
    setPage(0)
    setSelectedIds(new Set())
  }

  const {
    setlists, activeSetlist, activeId,
    setActiveId, createSetlist, renameSetlist, deleteSetlist,
    addTrack, removeTrack, reorderTracks,
  } = useSetlists()

  const ensureActiveSet = () => { if (!activeId) createSetlist('Set 1') }

  const handleToggleTrack = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const handleToggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(tracks.map(t => t.id)) : new Set())

  const handleSearch = (v: string) => { setSearch(v); setSelectedIds(new Set()) }
  const handleGenre  = (v: string) => { setGenre(v);  setSelectedIds(new Set()) }
  const handleBpm    = (min?: number, max?: number) => { setMinBpm(min); setMaxBpm(max); setSelectedIds(new Set()) }

  const handleAddSelected = () => {
    ensureActiveSet()
    tracks.filter(t => selectedIds.has(t.id)).forEach(t => addTrack(t))
    setSelectedIds(new Set())
  }
  const handleAddToSetlist = (track: Track) => {
    ensureActiveSet()
    addTrack(track)
  }

  const handleExportToEngine = async () => {
    if (!activeSetlist || activeSetlist.tracks.length === 0) return
    const apiBase = await getApiBase()
    const res = await fetch(`${apiBase}/playlists/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: activeSetlist.name,
        tracks: activeSetlist.tracks.map(t => ({ id: t.id })),
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail ?? `HTTP ${res.status}`)
    }
  }

  const selectedCount = selectedIds.size

  return (
    <div className="h-screen bg-surface-900 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="border-b border-surface-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-xl font-medium tracking-widest text-accent uppercase">
            Setflow
          </h1>
          <p className="text-muted text-xs mt-0.5 font-display">Engine DJ Library</p>
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-surface-700 bg-surface-800 shrink-0">
        <SearchBar
          onSearch={handleSearch}
          onGenre={handleGenre}
          onBpmRange={handleBpm}
        />
      </div>

      {/* Toolbar */}
      <div className="px-6 py-2 flex items-center justify-between border-b border-surface-700 bg-surface-800 shrink-0">
        <span className="text-muted font-display text-xs">
          {loading ? 'Loading...' : `${total} tracks`}
          {selectedCount > 0 && (
            <span className="text-accent ml-2">· {selectedCount} selected</span>
          )}
        </span>
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <button
              onClick={handleAddSelected}
              className="text-xs border border-accent text-accent px-2.5 py-1 rounded font-display hover:bg-accent hover:text-white transition-colors"
            >
              + Add {selectedCount} to set
            </button>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={p => { setPage(p); setSelectedIds(new Set()) }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-4 bg-red-950 border border-red-800 text-red-400 font-display text-sm m-4 rounded shrink-0">
          {error}
        </div>
      )}

      {/* Main split layout — shrink bottom when player is open */}
      <div className={`flex flex-1 overflow-hidden ${previewTrack ? 'mb-16' : ''}`}>
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <TrackTable
              tracks={tracks}
              selectedIds={selectedIds}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              onToggleTrack={handleToggleTrack}
              onToggleAll={handleToggleAll}
              onAddToSetlist={handleAddToSetlist}
              onPreview={setPreviewTrack}
            />
          </div>
        </main>

        <SetlistPanel
          setlists={setlists}
          activeSetlist={activeSetlist}
          activeId={activeId}
          onSelect={setActiveId}
          onCreate={createSetlist}
          onRename={renameSetlist}
          onDelete={deleteSetlist}
          onRemoveTrack={removeTrack}
          onReorder={reorderTracks}
          onExportToEngine={handleExportToEngine}
        />
      </div>

      {/* Mini player — fixed to bottom */}
      {previewTrack && (
        <MiniPlayer
          track={previewTrack}
          apiBase={apiBase}
          onClose={() => setPreviewTrack(null)}
        />
      )}
    </div>
  )
}

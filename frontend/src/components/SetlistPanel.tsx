import { useRef } from 'react'
import { Setlist } from '../types/setlist'
import { Track } from '../types/track'
import { SetlistSelector } from './SetlistSelector'
import { SetlistTrackRow } from './SetlistTrackRow'
import { SetStats } from './SetStats'

interface Props {
  setlists: Setlist[]
  activeSetlist: Setlist | null
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onRemoveTrack: (trackId: number) => void
  onReorder: (from: number, to: number) => void
}

function exportAsText(setlist: Setlist): string {
  const lines = [
    `SETLIST: ${setlist.name}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    `Tracks: ${setlist.tracks.length}`,
    '',
    ...setlist.tracks.map((t, i) =>
      `${String(i + 1).padStart(2, '0')}. ${t.artist ?? '—'} — ${t.title ?? 'Unknown'}` +
      `  [${t.bpm ? t.bpm.toFixed(0) + ' BPM' : '—'}  ${t.key ?? '—'}  ${t.duration_formatted ?? '—'}]`
    )
  ]
  return lines.join('\n')
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function SetlistPanel({
  setlists, activeSetlist, activeId,
  onSelect, onCreate, onRename, onDelete,
  onRemoveTrack, onReorder,
}: Props) {
  const dragIndex = useRef<number | null>(null)
  const tracks: Track[] = activeSetlist?.tracks ?? []

  const handleDragStart = (index: number) => { dragIndex.current = index }
  const handleDrop = (toIndex: number) => {
    if (dragIndex.current === null || dragIndex.current === toIndex) return
    onReorder(dragIndex.current, toIndex)
    dragIndex.current = null
  }

  const handleExportText = () => {
    if (!activeSetlist) return
    downloadFile(
      `${activeSetlist.name.replace(/\s+/g, '_')}.txt`,
      exportAsText(activeSetlist),
      'text/plain'
    )
  }

  const handleExportPdf = () => {
    if (!activeSetlist) return
    // Build a minimal print page and trigger browser PDF
    const content = exportAsText(activeSetlist)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>${activeSetlist.name}</title>
      <style>
        body { font-family: monospace; font-size: 13px; padding: 2rem; white-space: pre; }
        @media print { body { padding: 1cm; } }
      </style></head>
      <body>${content.replace(/</g, '&lt;')}</body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <aside className="w-80 shrink-0 flex flex-col border-l border-surface-600 bg-surface-800">

      {/* Panel header */}
      <div className="px-4 pt-4 pb-3 border-b border-surface-600">
        <h2 className="font-display text-xs uppercase tracking-widest text-accent mb-3">
          My Sets
        </h2>
        <SetlistSelector
          setlists={setlists}
          activeId={activeId}
          onSelect={onSelect}
          onCreate={onCreate}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>

      {/* Set stats */}
      {tracks.length > 0 && <SetStats tracks={tracks} />}

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {!activeSetlist ? (
          <div className="text-center text-muted font-display text-xs py-12 px-4">
            Create a set above to get started
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center text-muted font-display text-xs py-12 px-4">
            Click <span className="text-accent">+ Set</span> on any track to add it here
          </div>
        ) : (
          tracks.map((track, i) => (
            <SetlistTrackRow
              key={track.id}
              track={track}
              index={i}
              prevTrack={i > 0 ? tracks[i - 1] : undefined}
              onRemove={onRemoveTrack}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>

      {/* Export footer */}
      {tracks.length > 0 && (
        <div className="px-4 py-3 border-t border-surface-600 flex gap-2">
          <button
            onClick={handleExportText}
            className="flex-1 text-xs border border-surface-600 text-muted px-2 py-1.5 rounded font-display hover:border-accent hover:text-accent transition-colors"
          >
            Export .txt
          </button>
          <button
            onClick={handleExportPdf}
            className="flex-1 text-xs border border-surface-600 text-muted px-2 py-1.5 rounded font-display hover:border-accent hover:text-accent transition-colors"
          >
            Export PDF
          </button>
        </div>
      )}
    </aside>
  )
}

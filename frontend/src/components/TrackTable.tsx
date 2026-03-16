import { Track } from '../types/track'
import { useColumnWidths } from '../hooks/useColumnWidths'

interface Props {
  tracks: Track[]
  selectedIds: Set<number>
  onToggleTrack: (id: number) => void
  onToggleAll: (checked: boolean) => void
  onAddToSetlist: (track: Track) => void
  onPreview: (track: Track) => void
}

const keyColour = (key: string | null): string => {
  if (!key) return 'text-muted'
  return key.endsWith('A') ? 'text-amber-400' : 'text-sky-400'
}

const bpmColour = (bpm: number | null): string => {
  if (!bpm) return 'text-muted'
  if (bpm < 100) return 'text-blue-400'
  if (bpm < 128) return 'text-green-400'
  if (bpm < 140) return 'text-amber-400'
  return 'text-red-400'
}

// Resize handle shown on hover at right edge of each resizable header cell
function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 h-full w-2 cursor-col-resize flex items-center justify-center group/handle z-10"
      title="Drag to resize"
    >
      <div className="w-px h-4 bg-surface-600 group-hover/handle:bg-accent transition-colors" />
    </div>
  )
}

export function TrackTable({ tracks, selectedIds, onToggleTrack, onToggleAll, onAddToSetlist, onPreview }: Props) {
  const { widths, tableRef, startResize, resetWidths } = useColumnWidths()

  const allSelected  = tracks.length > 0 && tracks.every(t => selectedIds.has(t.id))
  const someSelected = tracks.some(t => selectedIds.has(t.id)) && !allSelected

  if (tracks.length === 0) {
    return (
      <div className="text-center text-muted font-display py-16 text-sm">
        No tracks found
      </div>
    )
  }

  return (
    <div className="overflow-hidden" ref={tableRef}>
      <table className="w-full text-sm font-display table-fixed">
        <colgroup>
          <col style={{ width: `${widths.checkbox}%` }} />
          <col style={{ width: `${widths.title}%` }} />
          <col style={{ width: `${widths.artist}%` }} />
          <col style={{ width: `${widths.genre}%` }} />
          <col style={{ width: `${widths.bpm}%` }} />
          <col style={{ width: `${widths.key}%` }} />
          <col style={{ width: `${widths.duration}%` }} />
          <col style={{ width: `${widths.actions}%` }} />
        </colgroup>

        <thead className="sticky top-0 bg-surface-800 z-10">
          <tr className="border-b border-surface-600 text-muted text-xs uppercase tracking-widest">

            {/* Checkbox */}
            <th className="py-3 px-3 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected }}
                onChange={e => onToggleAll(e.target.checked)}
                className="accent-orange-500 cursor-pointer"
              />
            </th>

            {/* Resizable headers */}
            {([
              ['title',    'Title',    'text-left',   'artist'],
              ['artist',   'Artist',   'text-left',   'genre'],
              ['genre',    'Genre',    'text-left',   'bpm'],
              ['bpm',      'BPM',      'text-right',  'key'],
              ['key',      'Key',      'text-center', 'duration'],
              ['duration', 'Duration', 'text-right',  'actions'],
            ] as [string, string, string, string][]).map(([col, label, align, next]) => (
              <th key={col} className={`relative py-3 px-3 ${align} select-none`}>
                <span className="flex items-center gap-1 justify-between">
                  <span>{label}</span>
                </span>
                <ResizeHandle onMouseDown={startResize(col as any, next as any)} />
              </th>
            ))}

            {/* Actions — with reset button */}
            <th className="py-3 px-3 text-right">
              <button
                onClick={resetWidths}
                title="Reset column widths"
                className="text-muted hover:text-accent transition-colors text-xs font-display normal-case tracking-normal"
              >
                ↺
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          {tracks.map((track, i) => {
            const selected = selectedIds.has(track.id)
            return (
              <tr
                key={track.id}
                onClick={() => onToggleTrack(track.id)}
                className={`
                  border-b border-surface-700 cursor-pointer
                  hover:bg-surface-700 transition-colors
                  ${selected
                    ? 'bg-surface-700 border-l-2 border-l-accent'
                    : i % 2 === 0 ? 'bg-surface-800' : 'bg-surface-900'}
                `}
              >
                <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleTrack(track.id)}
                    className="accent-orange-500 cursor-pointer"
                  />
                </td>
                <td className="py-2.5 px-3 text-gray-200">
                  <span className="block truncate">{track.title ?? <span className="text-muted">Unknown</span>}</span>
                </td>
                <td className="py-2.5 px-3 text-gray-400">
                  <span className="block truncate">{track.artist ?? <span className="text-muted">—</span>}</span>
                </td>
                <td className="py-2.5 px-3 text-gray-500">
                  <span className="block truncate">{track.genre ?? <span className="text-muted">—</span>}</span>
                </td>
                <td className={`py-2.5 px-3 text-right font-medium ${bpmColour(track.bpm)}`}>
                  {track.bpm ? track.bpm.toFixed(1) : '—'}
                </td>
                <td className={`py-2.5 px-3 text-center font-medium ${keyColour(track.key)}`}>
                  {track.key ?? '—'}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-500">
                  {track.duration_formatted ?? '—'}
                </td>
                <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onPreview(track)}
                      className="text-xs border border-surface-600 text-muted px-2 py-1 rounded whitespace-nowrap hover:border-sky-400 hover:text-sky-400 transition-colors"
                      title="Preview track"
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => onAddToSetlist(track)}
                      className="text-xs border border-surface-600 text-muted px-2 py-1 rounded whitespace-nowrap hover:border-accent hover:text-accent transition-colors"
                    >
                      + Set
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

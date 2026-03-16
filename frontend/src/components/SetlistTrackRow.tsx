import { useRef } from 'react'
import { Track } from '../types/track'
import {
  getKeyCompatibility,
  getCompatibilityColour,
  getCompatibilityDot,
  isBpmWarning,
} from '../utils/camelot'

interface Props {
  track: Track
  index: number
  prevTrack?: Track       // track above in the setlist for transition analysis
  onRemove: (id: number) => void
  onDragStart: (index: number) => void
  onDrop: (toIndex: number) => void
}

const keyColour = (key: string | null) =>
  !key ? 'text-muted' : key.endsWith('A') ? 'text-amber-400' : 'text-sky-400'

export function SetlistTrackRow({ track, index, prevTrack, onRemove, onDragStart, onDrop }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)

  const keyCompat = prevTrack
    ? getKeyCompatibility(prevTrack.key, track.key)
    : null

  const bpmWarn = prevTrack
    ? isBpmWarning(prevTrack.bpm, track.bpm)
    : false

  const bpmDelta = prevTrack?.bpm && track.bpm
    ? track.bpm - prevTrack.bpm
    : null

  return (
    <div ref={rowRef}>
      {/* Transition indicator — shown between tracks (not before first) */}
      {index > 0 && (keyCompat || bpmWarn) && (
        <div className="flex items-center gap-3 px-3 py-1 bg-surface-900 border-b border-surface-700 text-xs font-display">
          {/* Key compatibility */}
          {keyCompat && (
            <span
              className={`flex items-center gap-1 ${getCompatibilityColour(keyCompat.level)}`}
              title={keyCompat.label}
            >
              <span>{getCompatibilityDot(keyCompat.level)}</span>
              <span>{keyCompat.label}</span>
            </span>
          )}

          {/* BPM warning */}
          {bpmWarn && bpmDelta !== null && (
            <span className="flex items-center gap-1 text-amber-400" title="Large BPM jump">
              <span>⚡</span>
              <span>{bpmDelta > 0 ? '+' : ''}{bpmDelta.toFixed(0)} BPM</span>
            </span>
          )}
        </div>
      )}

      {/* Track row */}
      <div
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onDrop(index) }}
        className="
          flex items-center gap-2 px-3 py-2.5
          border-b border-surface-700
          hover:bg-surface-700 transition-colors
          cursor-grab active:cursor-grabbing
          group
        "
      >
        {/* Drag handle */}
        <span className="text-muted text-xs select-none opacity-40 group-hover:opacity-100">⠿</span>

        {/* Track number */}
        <span className="text-muted font-display text-xs w-5 text-right shrink-0">
          {index + 1}
        </span>

        {/* Title + artist */}
        <div className="flex-1 min-w-0">
          <div className="text-gray-200 text-xs font-display truncate">
            {track.title ?? 'Unknown'}
          </div>
          <div className="text-muted text-xs truncate">
            {track.artist ?? '—'}
          </div>
        </div>

        {/* BPM */}
        <span className={`font-display text-xs shrink-0 ${bpmWarn ? 'text-amber-400' : 'text-gray-400'}`}>
          {track.bpm ? track.bpm.toFixed(0) : '—'}
        </span>

        {/* Key */}
        <span className={`font-display text-xs w-7 text-center shrink-0 ${keyColour(track.key)}`}>
          {track.key ?? '—'}
        </span>

        {/* Duration */}
        <span className="text-muted font-display text-xs shrink-0">
          {track.duration_formatted ?? '—'}
        </span>

        {/* Remove */}
        <button
          onClick={() => onRemove(track.id)}
          className="text-muted hover:text-red-400 text-xs ml-1 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
          title="Remove from set"
        >
          ×
        </button>
      </div>
    </div>
  )
}

import { Track } from '../types/track'

interface Props {
  tracks: Track[]
}

function formatTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0
    ? `${h}h ${m}m`
    : `${m}m ${s.toString().padStart(2, '0')}s`
}

export function SetStats({ tracks }: Props) {
  if (tracks.length === 0) return null

  const totalSeconds = tracks.reduce((acc, t) => acc + (t.duration_seconds ?? 0), 0)
  const bpms = tracks.map(t => t.bpm).filter(Boolean) as number[]
  const avgBpm = bpms.length ? bpms.reduce((a, b) => a + b, 0) / bpms.length : null

  return (
    <div className="flex gap-4 px-3 py-2 bg-surface-700 border-b border-surface-600 font-display text-xs">
      <div>
        <span className="text-muted">Tracks </span>
        <span className="text-gray-200">{tracks.length}</span>
      </div>
      <div>
        <span className="text-muted">Duration </span>
        <span className="text-gray-200">{formatTotal(totalSeconds)}</span>
      </div>
      {avgBpm && (
        <div>
          <span className="text-muted">Avg BPM </span>
          <span className="text-gray-200">{avgBpm.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}

import { useRef, useState, useEffect, useCallback } from 'react'
import { Track } from '../types/track'

interface Props {
  track: Track
  apiBase: string
  onClose: () => void
}

const NUM_PEAKS = 1000

export function MiniPlayer({ track, apiBase, onClose }: Props) {
  const audioRef   = useRef<HTMLAudioElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)

  const [playing, setPlaying]   = useState(false)
  const [current, setCurrent]   = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume]     = useState(1)
  const [loading, setLoading]   = useState(true)
  const [audioError, setAudioError] = useState(false)
  const [peaks, setPeaks]       = useState<number[]>([])
  const [peaksLoading, setPeaksLoading] = useState(true)

  const src = `${apiBase}/tracks/${track.id}/audio`

  // ── Fetch waveform peaks ─────────────────────────────────────────────────
  useEffect(() => {
    setPeaks([])
    setPeaksLoading(true)
    fetch(`${apiBase}/tracks/${track.id}/waveform`)
      .then(r => r.json())
      .then(d => { setPeaks(d.peaks ?? []); setPeaksLoading(false) })
      .catch(() => setPeaksLoading(false))
  }, [track.id])

  // ── Audio setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    setLoading(true)
    setAudioError(false)
    setPlaying(false)
    setCurrent(0)

    const onLoaded = () => { setLoading(false); setDuration(el.duration) }
    const onTime   = () => setCurrent(el.currentTime)
    const onEnded  = () => setPlaying(false)
    const onError  = () => { setLoading(false); setAudioError(true) }

    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate',     onTime)
    el.addEventListener('ended',          onEnded)
    el.addEventListener('error',          onError)
    el.load()
    el.play().then(() => setPlaying(true)).catch(() => {})

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate',     onTime)
      el.removeEventListener('ended',          onEnded)
      el.removeEventListener('error',          onError)
      el.pause()
    }
  }, [track.id])

  // ── Canvas waveform renderer ─────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || peaks.length === 0) return

    const ctx    = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const progress = duration > 0 ? current / duration : 0
    const playedPeaks = Math.floor(progress * NUM_PEAKS)

    ctx.clearRect(0, 0, W, H)

    const barW   = W / NUM_PEAKS
    const centerY = H / 2

    peaks.forEach((peak, i) => {
      const x       = i * barW
      const barH    = Math.max(2, peak * (H * 0.85))
      const played  = i < playedPeaks

      // Played portion: accent orange; unplayed: muted grey
      ctx.fillStyle = played ? '#f97316' : '#4a4a55'
      ctx.fillRect(x, centerY - barH / 2, Math.max(1, barW - 0.5), barH)
    })

    // Playhead line
    if (duration > 0) {
      const px = progress * W
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(px - 1, 0, 2, H)
    }
  }, [peaks, current, duration])

  useEffect(() => { drawWaveform() }, [drawWaveform])

  // ── Waveform click to seek ───────────────────────────────────────────────
  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const el     = audioRef.current
    if (!canvas || !el || !duration) return
    const rect   = canvas.getBoundingClientRect()
    const ratio  = (e.clientX - rect.left) / rect.width
    el.currentTime = ratio * duration
    setCurrent(el.currentTime)
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else         { el.play();  setPlaying(true)  }
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  const keyColour = track.key?.endsWith('A') ? 'text-amber-400' : 'text-sky-400'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface-800 border-t border-surface-600 z-50 font-display">
      <audio ref={audioRef} src={src} preload="auto" />

      {/* Waveform canvas */}
      <div className="px-6 pt-2 relative">
        {peaksLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-xs">
            Analysing waveform…
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={1200}
          height={48}
          onClick={handleWaveformClick}
          className="w-full h-12 cursor-crosshair"
          style={{ display: peaks.length > 0 ? 'block' : 'none' }}
        />
        {!peaksLoading && peaks.length === 0 && (
          <div className="h-12 flex items-center justify-center text-muted text-xs">
            Waveform unavailable
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4 px-6 py-2">

        {/* Track info */}
        <div className="min-w-0 w-52 shrink-0">
          <div className="text-gray-200 text-xs truncate">{track.title ?? 'Unknown'}</div>
          <div className="text-muted text-xs truncate">{track.artist ?? '—'}</div>
        </div>

        {/* Play/pause */}
        <button
          onClick={togglePlay}
          disabled={loading || audioError}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full border border-surface-600 text-gray-200 hover:border-accent hover:text-accent transition-colors disabled:opacity-30"
        >
          <span className="text-xs leading-none select-none w-3 text-center inline-block">{loading ? '…' : audioError ? '!' : playing ? '❙❙' : '▶'}</span>
        </button>

        {/* Timestamps */}
        <div className="flex items-center gap-2 shrink-0 text-xs text-muted">
          <span className="w-8 text-right">{fmt(current)}</span>
          <span>/</span>
          <span className="w-8">{fmt(duration)}</span>
        </div>

        {/* BPM + Key */}
        <div className="flex items-center gap-3 shrink-0 text-xs">
          {track.bpm && <span className="text-gray-400">{track.bpm.toFixed(0)} BPM</span>}
          {track.key && <span className={keyColour}>{track.key}</span>}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Volume */}
        <div className="flex items-center gap-2 w-28 shrink-0">
          <span className="text-muted text-xs">🔊</span>
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={handleVolume}
            className="flex-1 accent-orange-500 cursor-pointer"
          />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-muted hover:text-gray-200 text-lg transition-colors shrink-0 leading-none"
        >
          ×
        </button>
      </div>

      {audioError && (
        <p className="px-6 pb-2 text-red-400 text-xs">
          Could not load audio — file may be on an unplugged drive.
        </p>
      )}
    </div>
  )
}

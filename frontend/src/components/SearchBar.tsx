import { useState } from 'react'

interface Props {
  onSearch: (search: string) => void
  onGenre: (genre: string) => void
  onBpmRange: (min?: number, max?: number) => void
}

export function SearchBar({ onSearch, onGenre, onBpmRange }: Props) {
  const [bpmMin, setBpmMin] = useState('')
  const [bpmMax, setBpmMax] = useState('')

  const handleBpmApply = () => {
    onBpmRange(
      bpmMin ? parseFloat(bpmMin) : undefined,
      bpmMax ? parseFloat(bpmMax) : undefined
    )
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="text"
        placeholder="Search title or artist..."
        onChange={e => onSearch(e.target.value)}
        className="
          bg-surface-700 border border-surface-600 rounded px-3 py-2
          text-sm text-gray-200 placeholder-muted
          focus:outline-none focus:border-accent w-64
          font-display
        "
      />

      {/* Genre */}
      <input
        type="text"
        placeholder="Genre..."
        onChange={e => onGenre(e.target.value)}
        className="
          bg-surface-700 border border-surface-600 rounded px-3 py-2
          text-sm text-gray-200 placeholder-muted
          focus:outline-none focus:border-accent w-36
          font-display
        "
      />

      {/* BPM range */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="BPM min"
          value={bpmMin}
          onChange={e => setBpmMin(e.target.value)}
          className="
            bg-surface-700 border border-surface-600 rounded px-3 py-2
            text-sm text-gray-200 placeholder-muted
            focus:outline-none focus:border-accent w-24
            font-display
          "
        />
        <span className="text-muted text-sm">—</span>
        <input
          type="number"
          placeholder="BPM max"
          value={bpmMax}
          onChange={e => setBpmMax(e.target.value)}
          className="
            bg-surface-700 border border-surface-600 rounded px-3 py-2
            text-sm text-gray-200 placeholder-muted
            focus:outline-none focus:border-accent w-24
            font-display
          "
        />
        <button
          onClick={handleBpmApply}
          className="
            bg-surface-700 border border-accent text-accent
            px-3 py-2 rounded text-sm font-display
            hover:bg-accent hover:text-white transition-colors
          "
        >
          Apply
        </button>
      </div>
    </div>
  )
}

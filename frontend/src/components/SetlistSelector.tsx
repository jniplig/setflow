import { useState } from 'react'
import { Setlist } from '../types/setlist'

interface Props {
  setlists: Setlist[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function SetlistSelector({
  setlists, activeId, onSelect, onCreate, onRename, onDelete
}: Props) {
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreate(newName.trim())
    setNewName('')
    setCreating(false)
  }

  const handleRename = (id: string) => {
    if (!renameVal.trim()) return
    onRename(id, renameVal.trim())
    setRenamingId(null)
  }

  return (
    <div className="border-b border-surface-600 pb-3 mb-3">
      {/* Setlist tabs */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {setlists.map(s => (
          <div key={s.id} className="flex items-center gap-1">
            {renamingId === s.id ? (
              <input
                autoFocus
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={() => handleRename(s.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename(s.id)
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                className="bg-surface-700 border border-accent text-gray-200 text-xs px-2 py-1 rounded font-display w-28 focus:outline-none"
              />
            ) : (
              <button
                onClick={() => onSelect(s.id)}
                onDoubleClick={() => { setRenamingId(s.id); setRenameVal(s.name) }}
                title="Double-click to rename"
                className={`
                  text-xs px-2.5 py-1 rounded font-display transition-colors
                  ${s.id === activeId
                    ? 'bg-accent text-white'
                    : 'bg-surface-700 text-muted hover:text-gray-200 border border-surface-600'}
                `}
              >
                {s.name}
              </button>
            )}
            {s.id === activeId && renamingId !== s.id && (
              <button
                onClick={() => onDelete(s.id)}
                title="Delete setlist"
                className="text-muted hover:text-red-400 text-xs transition-colors"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* New setlist */}
        {creating ? (
          <input
            autoFocus
            placeholder="Set name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={handleCreate}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setCreating(false)
            }}
            className="bg-surface-700 border border-accent text-gray-200 text-xs px-2 py-1 rounded font-display w-28 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="text-xs px-2 py-1 rounded border border-dashed border-muted text-muted hover:border-accent hover:text-accent font-display transition-colors"
          >
            + New
          </button>
        )}
      </div>
    </div>
  )
}

import { useState, useCallback, useRef } from 'react'

export interface ColumnWidths {
  checkbox: number
  title: number
  artist: number
  genre: number
  bpm: number
  key: number
  duration: number
  actions: number
}

const DEFAULTS: ColumnWidths = {
  checkbox:  4,
  title:     26,
  artist:    19,
  genre:     15,
  bpm:       10,
  key:        8,
  duration:  10,
  actions:   14,
}

const STORAGE_KEY = 'setflow:columnWidths'
const MIN_WIDTH = 4   // minimum % per column

function load(): ColumnWidths {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

export function useColumnWidths() {
  const [widths, setWidths] = useState<ColumnWidths>(load)
  const tableRef = useRef<HTMLDivElement>(null)

  const startResize = useCallback((col: keyof ColumnWidths, nextCol: keyof ColumnWidths) => {
    return (e: React.MouseEvent) => {
      e.preventDefault()
      const startX     = e.clientX
      const startW     = widths[col]
      const startNextW = widths[nextCol]
      const tableWidth = tableRef.current?.offsetWidth ?? 1000

      const onMove = (ev: MouseEvent) => {
        const deltaX   = ev.clientX - startX
        const deltaPct = (deltaX / tableWidth) * 100
        const newW     = Math.max(MIN_WIDTH, startW + deltaPct)
        const newNextW = Math.max(MIN_WIDTH, startNextW - deltaPct)

        setWidths(prev => {
          const updated = { ...prev, [col]: newW, [nextCol]: newNextW }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
      }

      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
  }, [widths])

  const resetWidths = () => {
    setWidths(DEFAULTS)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { widths, tableRef, startResize, resetWidths }
}

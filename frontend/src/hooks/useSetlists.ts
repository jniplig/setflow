import { useState, useEffect } from 'react'
import { Setlist } from '../types/setlist'
import { Track } from '../types/track'

const STORAGE_KEY = 'setflow:setlists'
const ACTIVE_KEY  = 'setflow:activeSetlist'

function load(): Setlist[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(setlists: Setlist[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(setlists))
}

export function useSetlists() {
  const [setlists, setSetlists] = useState<Setlist[]>(load)
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY)
  )

  // Persist whenever setlists change
  useEffect(() => { save(setlists) }, [setlists])
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId)
  }, [activeId])

  const activeSetlist = setlists.find(s => s.id === activeId) ?? null

  // --- Setlist CRUD ---

  const createSetlist = (name: string): Setlist => {
    const newSet: Setlist = {
      id: crypto.randomUUID(),
      name,
      tracks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSetlists(prev => [...prev, newSet])
    setActiveId(newSet.id)
    return newSet
  }

  const renameSetlist = (id: string, name: string) => {
    setSetlists(prev =>
      prev.map(s => s.id === id ? { ...s, name, updatedAt: Date.now() } : s)
    )
  }

  const deleteSetlist = (id: string) => {
    setSetlists(prev => {
      const remaining = prev.filter(s => s.id !== id)
      if (activeId === id) setActiveId(remaining[0]?.id ?? null)
      return remaining
    })
  }

  // --- Track operations on active setlist ---

  const addTrack = (track: Track) => {
    if (!activeId) return
    setSetlists(prev => prev.map(s => {
      if (s.id !== activeId) return s
      if (s.tracks.find(t => t.id === track.id)) return s  // no duplicates
      return { ...s, tracks: [...s.tracks, track], updatedAt: Date.now() }
    }))
  }

  const removeTrack = (trackId: number) => {
    if (!activeId) return
    setSetlists(prev => prev.map(s =>
      s.id !== activeId ? s : {
        ...s,
        tracks: s.tracks.filter(t => t.id !== trackId),
        updatedAt: Date.now()
      }
    ))
  }

  const reorderTracks = (fromIndex: number, toIndex: number) => {
    if (!activeId) return
    setSetlists(prev => prev.map(s => {
      if (s.id !== activeId) return s
      const tracks = [...s.tracks]
      const [moved] = tracks.splice(fromIndex, 1)
      tracks.splice(toIndex, 0, moved)
      return { ...s, tracks, updatedAt: Date.now() }
    }))
  }

  return {
    setlists,
    activeSetlist,
    activeId,
    setActiveId,
    createSetlist,
    renameSetlist,
    deleteSetlist,
    addTrack,
    removeTrack,
    reorderTracks,
  }
}

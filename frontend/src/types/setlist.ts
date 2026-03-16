import { Track } from './track'

export interface Setlist {
  id: string
  name: string
  tracks: Track[]
  createdAt: number
  updatedAt: number
}

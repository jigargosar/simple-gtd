import { create } from 'zustand'
import type { DragState } from './useDrag'

type DragStore = {
    drag: DragState | null
    setDrag: (drag: DragState | null) => void
}

export const useDragStore = create<DragStore>((set) => ({
    drag: null,
    setDrag: (drag) => set({ drag }),
}))

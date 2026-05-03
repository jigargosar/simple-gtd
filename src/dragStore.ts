import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DragState } from './useDrag'

type DragStore = {
    drag: DragState | null
    setDrag: (drag: DragState | null) => void
}

export const useDragStore = create<DragStore>()(devtools((set) => ({
    drag: null,
    setDrag: (drag) => set({ drag }),
}), { name: 'drag' }))

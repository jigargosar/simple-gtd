import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DragStore } from './dragStore'

export const useDragStore = create<DragStore>()(
    devtools(
        (set) => ({
            drag: null,
            actions: {
                setDrag: (drag) => set({ drag }),
            },
        }),
        { name: 'drag' },
    ),
)

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { SectionId } from './section'
import type { TaskId } from './task'

export type BeaconPosition = {
    beaconId: string
    sectionId: SectionId
    beforeId: TaskId | null
    afterId: TaskId | null
}

export type DragState = {
    taskId: TaskId
    sectionId: SectionId
    activeBeacon: BeaconPosition | null
}

type DragStore = {
    drag: DragState | null
    actions: {
        setDrag: (drag: DragState | null) => void
    }
}

export const useDragStore = create<DragStore>()(
    devtools(
        (set) => ({
            drag: null,
            actions: { setDrag: (drag) => set({ drag }) },
        }),
        { name: 'drag' },
    ),
)

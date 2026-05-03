import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DragState } from './useDrag'

type DragStoreState = {
    drag: DragState | null
}

type DragStoreActions = {
    actions: {
        setDrag: (drag: DragState | null) => void
    }
}

type DragStore = DragStoreState & DragStoreActions

export function isActiveBeacon(s: DragStoreState, beaconId: string): boolean {
    return s.drag !== null && s.drag.activeBeacon?.beaconId === beaconId
}

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

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DropResult, SectionId, TaskId } from '../useApp'

// Types

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

export type StartDragArgs = {
    taskId: TaskId
    sectionId: SectionId
    startX: number
    startY: number
    onDrop: (result: DropResult) => void
}

// Helpers

const DRAG_THRESHOLD_PX = 5

function distanceY(el: HTMLElement, y: number): number {
    const rect = el.getBoundingClientRect()
    return Math.abs(y - (rect.top + rect.height / 2))
}

function nearestBeacon(y: number): BeaconPosition | null {
    const beacons = Array.from(document.querySelectorAll<HTMLElement>('[data-beacon]'))
    if (beacons.length === 0) return null

    let nearest = beacons[0]
    let minDist = distanceY(nearest, y)
    for (let i = 1; i < beacons.length; i++) {
        const d = distanceY(beacons[i], y)
        if (d < minDist) {
            minDist = d
            nearest = beacons[i]
        }
    }

    const beaconId = nearest.dataset.beacon
    const sectionId = nearest.dataset.beaconSection
    if (beaconId === undefined || sectionId === undefined) return null

    return {
        beaconId,
        sectionId,
        beforeId: nearest.dataset.beaconBefore ?? null,
        afterId: nearest.dataset.beaconAfter ?? null,
    }
}

// Store

type DragStore = {
    drag: DragState | null
    floatEl: HTMLElement | null
    actions: {
        setFloatEl: (el: HTMLElement | null) => void
        startDrag: (args: StartDragArgs) => void
    }
}

export const useDragStore = create<DragStore>()(
    devtools(
        (set, get) => ({
            drag: null,
            floatEl: null,
            actions: {
                setFloatEl: (floatEl) => set({ floatEl }),
                startDrag: ({ taskId, sectionId, startX, startY, onDrop }) => {
                    let started = false

                    function onPointerMove(e: PointerEvent) {
                        const dx = e.clientX - startX
                        const dy = e.clientY - startY

                        if (!started) {
                            if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD_PX) return
                            started = true
                            set({
                                drag: {
                                    taskId,
                                    sectionId,
                                    activeBeacon: nearestBeacon(e.clientY),
                                },
                            })
                        }

                        const floatEl = get().floatEl
                        if (floatEl !== null) {
                            floatEl.style.left = `${e.clientX}px`
                            floatEl.style.top = `${e.clientY}px`
                        }

                        const next = nearestBeacon(e.clientY)
                        const currentBeaconId = get().drag?.activeBeacon?.beaconId ?? null
                        if (next?.beaconId !== currentBeaconId) {
                            set({
                                drag: { taskId, sectionId, activeBeacon: next },
                            })
                        }
                    }

                    function onPointerUp() {
                        const current = get().drag
                        if (current !== null && current.activeBeacon !== null) {
                            onDrop({
                                taskId: current.taskId,
                                sourceSectionId: current.sectionId,
                                targetSectionId: current.activeBeacon.sectionId,
                                beforeId: current.activeBeacon.beforeId,
                                afterId: current.activeBeacon.afterId,
                            })
                        }
                        set({ drag: null })
                        document.removeEventListener('pointermove', onPointerMove)
                    }

                    document.addEventListener('pointermove', onPointerMove)
                    document.addEventListener('pointerup', onPointerUp, { once: true })
                },
            },
        }),
        { name: 'drag' },
    ),
)

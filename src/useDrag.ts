import { useCallback, useRef } from 'react'
import { useDragStore } from './dragStore'
import type { BeaconPosition } from './dragStore'
import type { SectionId } from './section'
import type { TaskId } from './task'
import type { DropResult } from './app'

const DRAG_THRESHOLD_PX = 5

export type StartDragArgs = {
    taskId: TaskId
    sectionId: SectionId
    startX: number
    startY: number
}

function distanceY(el: HTMLElement, y: number): number {
    const rect = el.getBoundingClientRect()
    return Math.abs(y - (rect.top + rect.height / 2))
}

function nearestBeacon(y: number): BeaconPosition | null {
    const beacons = Array.from(
        document.querySelectorAll<HTMLElement>('[data-beacon]'),
    )
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

export function useDrag(onDrop: (result: DropResult) => void): {
    floatRef: React.RefObject<HTMLDivElement | null>
    startDrag: (args: StartDragArgs) => void
} {
    const setDrag = useDragStore((s) => s.actions.setDrag)
    const floatRef = useRef<HTMLDivElement | null>(null)

    const startDrag = useCallback(
        ({ taskId, sectionId, startX, startY }: StartDragArgs) => {
            let started = false

            function onPointerMove(e: PointerEvent) {
                const dx = e.clientX - startX
                const dy = e.clientY - startY

                if (!started) {
                    if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD_PX) return
                    started = true
                    setDrag({
                        taskId,
                        sectionId,
                        activeBeacon: nearestBeacon(e.clientY),
                    })
                }

                if (floatRef.current !== null) {
                    floatRef.current.style.left = `${e.clientX}px`
                    floatRef.current.style.top = `${e.clientY}px`
                }

                const next = nearestBeacon(e.clientY)
                const currentBeaconId =
                    useDragStore.getState().drag?.activeBeacon?.beaconId ?? null
                if (next?.beaconId !== currentBeaconId) {
                    setDrag({ taskId, sectionId, activeBeacon: next })
                }
            }

            function onPointerUp() {
                const current = useDragStore.getState().drag
                if (current !== null && current.activeBeacon !== null) {
                    onDrop({
                        taskId: current.taskId,
                        sourceSectionId: current.sectionId,
                        targetSectionId: current.activeBeacon.sectionId,
                        beforeId: current.activeBeacon.beforeId,
                        afterId: current.activeBeacon.afterId,
                    })
                }
                setDrag(null)
                document.removeEventListener('pointermove', onPointerMove)
            }

            document.addEventListener('pointermove', onPointerMove)
            document.addEventListener('pointerup', onPointerUp, { once: true })
        },
        [onDrop, setDrag],
    )

    return { floatRef, startDrag }
}

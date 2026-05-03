import { useCallback, useEffect, useRef } from 'react'
import { useDragStore } from './dragStore'
import type { SectionId } from './section'
import type { TaskId } from './task'

const DRAG_THRESHOLD_PX = 5

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
}

export type DropResult = {
    taskId: TaskId
    sourceSectionId: SectionId
    targetSectionId: SectionId
    beforeId: TaskId | null
    afterId: TaskId | null
}

function nearestBeacon(y: number): BeaconPosition | null {
    const beacons = document.querySelectorAll<HTMLElement>('[data-beacon]')
    let nearest: HTMLElement | null = null
    let minDist = Infinity

    beacons.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const dist = Math.abs(y - (rect.top + rect.height / 2))
        if (dist < minDist) {
            minDist = dist
            nearest = el
        }
    })

    if (nearest === null) return null
    const el = nearest as HTMLElement
    const beaconId = el.dataset.beacon ?? null
    const sectionId = el.dataset.beaconSection ?? null
    if (beaconId === null || sectionId === null) return null

    return {
        beaconId,
        sectionId,
        beforeId: el.dataset.beaconBefore ?? null,
        afterId: el.dataset.beaconAfter ?? null,
    }
}

function beaconsEqual(a: BeaconPosition | null, b: BeaconPosition | null): boolean {
    if (a === null && b === null) return true
    if (a === null || b === null) return false
    return a.beaconId === b.beaconId
}

export function useDrag(onDrop: (result: DropResult) => void): {
    floatRef: React.RefObject<HTMLDivElement | null>
    startDrag: (args: StartDragArgs) => void
} {
    const setDrag = useDragStore((s) => s.actions.setDrag)

    // dragRef mirrors drag state synchronously — readable inside event handlers
    // without stale closure risk
    const dragRef = useRef<DragState | null>(null)

    const floatRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        return useDragStore.subscribe((s) => {
            dragRef.current = s.drag
        })
    }, [])

    const startDrag = useCallback(
        ({ taskId, sectionId, startX, startY }: StartDragArgs) => {
            let thresholdCrossed = false

            function onPointerMove(e: PointerEvent) {
                const dx = e.clientX - startX
                const dy = e.clientY - startY

                if (!thresholdCrossed) {
                    if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD_PX) return
                    thresholdCrossed = true
                    const initial: DragState = {
                        taskId,
                        sectionId,
                        activeBeacon: nearestBeacon(e.clientY),
                    }
                    dragRef.current = initial
                    setDrag(initial)
                }

                // Move floating element directly — no React re-render
                if (floatRef.current !== null) {
                    floatRef.current.style.left = `${e.clientX}px`
                    floatRef.current.style.top = `${e.clientY}px`
                }

                // Only update store when beacon changes — drives highlight re-render
                const next = nearestBeacon(e.clientY)
                if (!beaconsEqual(next, dragRef.current?.activeBeacon ?? null)) {
                    const updated: DragState = { taskId, sectionId, activeBeacon: next }
                    dragRef.current = updated
                    setDrag(updated)
                }
            }

            function onPointerUp() {
                const current = dragRef.current
                if (current !== null && current.activeBeacon !== null) {
                    onDrop({
                        taskId: current.taskId,
                        sourceSectionId: current.sectionId,
                        targetSectionId: current.activeBeacon.sectionId,
                        beforeId: current.activeBeacon.beforeId,
                        afterId: current.activeBeacon.afterId,
                    })
                }
                dragRef.current = null
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

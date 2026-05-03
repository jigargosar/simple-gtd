import { useCallback, useEffect, useRef, useState } from 'react'
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
    drag: DragState | null
    floatRef: React.RefObject<HTMLDivElement | null>
    startDrag: (args: StartDragArgs) => void
} {
    // drag holds only what drives React rendering: taskId, sectionId, activeBeacon
    const [drag, setDrag] = useState<DragState | null>(null)

    // dragRef mirrors drag synchronously — readable inside event handlers without
    // stale closure risk
    const dragRef = useRef<DragState | null>(null)

    // floatRef points to the floating element; we move it via style directly to
    // avoid re-rendering the whole tree on every pointermove
    const floatRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        dragRef.current = drag
    })

    const startDrag = useCallback(({ taskId, sectionId, startX, startY }: StartDragArgs) => {
        let thresholdCrossed = false

        function onPointerMove(e: PointerEvent) {
            const dx = e.clientX - startX
            const dy = e.clientY - startY

            if (!thresholdCrossed) {
                if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD_PX) return
                thresholdCrossed = true
                setDrag({ taskId, sectionId, activeBeacon: nearestBeacon(e.clientY) })
                dragRef.current = { taskId, sectionId, activeBeacon: dragRef.current?.activeBeacon ?? null }
            }

            // Move floating element directly — no React re-render
            if (floatRef.current !== null) {
                floatRef.current.style.left = `${e.clientX}px`
                floatRef.current.style.top = `${e.clientY}px`
            }

            // Only update state when beacon changes — drives highlight re-render
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
    }, [onDrop])

    return { drag, floatRef, startDrag }
}

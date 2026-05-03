import type { TaskId } from './task'
import type { SectionId } from './section'
import { useDragStore } from './dragStore'

export function Beacon({
    id,
    sectionId,
    beforeId,
    afterId,
}: {
    id: string
    sectionId: SectionId
    beforeId: TaskId | null
    afterId: TaskId | null
}) {
    const active = useDragStore(
        (s) => s.drag !== null && s.drag.activeBeacon?.beaconId === id,
    )

    return (
        <div
            data-beacon={id}
            data-beacon-section={sectionId}
            {...(beforeId !== null ? { 'data-beacon-before': beforeId } : {})}
            {...(afterId !== null ? { 'data-beacon-after': afterId } : {})}
            style={{
                position: 'relative',
                height: 8,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    left: 8,
                    right: 8,
                    height: 2,
                    background: 'dodgerblue',
                    borderRadius: 1,
                    opacity: active ? 1 : 0,
                    transition: 'opacity 80ms ease',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    left: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'dodgerblue',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: active ? 1 : 0,
                    transition: 'opacity 80ms ease',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    right: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'dodgerblue',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: active ? 1 : 0,
                    transition: 'opacity 80ms ease',
                }}
            />
        </div>
    )
}

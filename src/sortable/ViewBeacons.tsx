import type { TaskId } from '../useApp'
import type { SectionId } from '../useApp'
import { useDragStore } from './useSortable'

function Dot({ side }: { side: 'left' | 'right' }) {
    return (
        <div
            className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[dodgerblue] ${side === 'left' ? 'left-0.5' : 'right-0.5'}`}
        />
    )
}

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
    const active = useDragStore((s) => s.drag?.activeBeacon?.beaconId === id)
    const visibility = active ? 'opacity-100' : 'opacity-0'

    return (
        <div
            data-beacon={id}
            data-beacon-section={sectionId}
            data-beacon-before={beforeId ?? undefined}
            data-beacon-after={afterId ?? undefined}
            className="relative flex h-2 items-center"
        >
            <div
                className={`absolute inset-x-2 h-px bg-[dodgerblue] transition-opacity duration-75 ${visibility}`}
            />
            <div className={`transition-opacity duration-75 ${visibility}`}>
                <Dot side="left" />
                <Dot side="right" />
            </div>
        </div>
    )
}

import { Fragment, type RefObject } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import {
    useApp,
    useTasksIn,
    useIsEditingTask,
    useIsEditingSection,
    addTask,
    startEditTask,
    commitEditTask,
    cancelEditTask,
    toggleDone,
    moveTask,
    startEditSection,
    commitEditSection,
    cancelEditSection,
} from './useApp'
import type { Task, TaskId, Section, SectionId } from './useApp'
import { useDragStore, useSortable } from './sortable/useSortable'
import { Beacon } from './sortable/ViewBeacons'

type StartDragHandler = (
    e: PointerEvent<HTMLButtonElement>,
    taskId: TaskId,
    sectionId: SectionId,
) => void

function editKeyDown(onCancel: () => void) {
    return (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') onCancel()
    }
}

function EditableTaskTitle({ task }: { task: Task }) {
    const isEditing = useIsEditingTask(task.id)
    if (isEditing) {
        return (
            <input
                autoFocus
                defaultValue={task.title}
                onBlur={(e) => commitEditTask(task.id, e.currentTarget.value)}
                onKeyDown={editKeyDown(() => cancelEditTask(task.id))}
                className="text-task flex-1 bg-transparent text-sm leading-relaxed tracking-wide outline-none"
            />
        )
    }
    return (
        <span
            onClick={() => startEditTask(task.id)}
            className={`flex-1 cursor-text text-sm leading-relaxed tracking-wide ${
                task.done ? 'text-task-muted line-through' : 'text-task'
            }`}
        >
            {task.title || (
                <span className="text-label-muted italic">empty — click to edit</span>
            )}
        </span>
    )
}

function EditableSectionTitle({ section }: { section: Section }) {
    const isEditing = useIsEditingSection(section.id)
    if (isEditing) {
        return (
            <input
                autoFocus
                defaultValue={section.title}
                onBlur={(e) => commitEditSection(section.id, e.currentTarget.value)}
                onKeyDown={editKeyDown(() => cancelEditSection(section.id))}
                className="text-blue w-full bg-transparent text-xs font-semibold tracking-[0.2em] uppercase outline-none"
            />
        )
    }
    return (
        <h2
            onClick={() => startEditSection(section.id)}
            className="text-blue cursor-text text-xs font-semibold tracking-[0.2em] uppercase"
        >
            {section.title || (
                <span className="text-label-muted normal-case italic">
                    empty — click to edit
                </span>
            )}
        </h2>
    )
}

function FloatingTask({ floatRef }: { floatRef: RefObject<HTMLDivElement | null> }) {
    const dragTaskId = useDragStore((s) => s.drag?.taskId ?? null)
    const draggedTask = useApp((s) =>
        dragTaskId === null ? null : (s.tasks.find((t) => t.id === dragTaskId) ?? null),
    )

    if (draggedTask === null) return null

    return (
        <div
            ref={floatRef}
            className="bg-page pointer-events-none fixed top-0 left-0 z-50 flex min-w-60 -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-md px-4 py-2 opacity-90 shadow-2xl"
        >
            <input
                type="checkbox"
                checked={draggedTask.done}
                readOnly
                className="accent-blue h-4 w-4"
            />
            <span
                className={`flex-1 text-sm leading-relaxed tracking-wide ${draggedTask.done ? 'text-task-muted line-through' : 'text-task'}`}
            >
                {draggedTask.title}
            </span>
        </div>
    )
}

function TaskView({
    task,
    sectionId,
    onStartDrag,
}: {
    task: Task
    sectionId: SectionId
    onStartDrag: StartDragHandler
}) {
    const isDragging = useDragStore((s) => s.drag?.taskId === task.id)

    if (isDragging) {
        return (
            <div className="bg-page-subtle h-10 rounded border border-dashed border-gray-300 opacity-50" />
        )
    }

    return (
        <div className="group/task bg-page relative flex items-center gap-3 rounded px-4 py-2">
            <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/task:opacity-100">
                <button
                    onPointerDown={(e) => onStartDrag(e, task.id, sectionId)}
                    className="text-label-muted hover:text-label cursor-grab touch-none rounded p-2 transition-colors active:cursor-grabbing"
                >
                    <GripVerticalIcon size={20} />
                </button>
                <button
                    onClick={() => addTask(sectionId, task.id)}
                    className="text-label-muted hover:text-blue rounded p-2 transition-colors"
                >
                    <PlusIcon size={20} />
                </button>
            </div>
            <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task.id)}
                className="accent-blue h-4 w-4 cursor-pointer"
            />
            <EditableTaskTitle task={task} />
        </div>
    )
}

function beaconNeighbours(
    tasks: readonly Task[],
    beaconIdx: number,
    excludeId: TaskId | null,
): { beforeId: TaskId | null; afterId: TaskId | null } {
    const visible = (t: Task) => t.id !== excludeId
    const before = tasks.slice(0, beaconIdx).findLast(visible)
    const after = tasks.slice(beaconIdx).find(visible)
    return { beforeId: before?.id ?? null, afterId: after?.id ?? null }
}

function SectionHeader({ section }: { section: Section }) {
    return (
        <div className="group/section relative">
            <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/section:opacity-100">
                <button
                    onClick={() => addTask(section.id, null)}
                    className="text-label-muted hover:text-blue rounded p-2 transition-colors"
                >
                    <PlusIcon size={20} />
                </button>
            </div>
            <div className="flex items-center px-4 py-3">
                <EditableSectionTitle section={section} />
            </div>
        </div>
    )
}

function SectionView({
    section,
    onStartDrag,
}: {
    section: Section
    onStartDrag: StartDragHandler
}) {
    const tasks = useTasksIn(section.id)
    const draggingId = useDragStore((s) => s.drag?.taskId ?? null)
    const tail = beaconNeighbours(tasks, tasks.length, draggingId)

    return (
        <section>
            <SectionHeader section={section} />
            <div className="flex min-h-2 flex-col">
                {tasks.map((task, i) => {
                    const { beforeId, afterId } = beaconNeighbours(tasks, i, draggingId)
                    return (
                        <Fragment key={task.id}>
                            <Beacon
                                id={`${section.id}:${i}`}
                                sectionId={section.id}
                                beforeId={beforeId}
                                afterId={afterId}
                            />
                            <TaskView
                                task={task}
                                sectionId={section.id}
                                onStartDrag={onStartDrag}
                            />
                        </Fragment>
                    )
                })}
                <Beacon
                    id={`${section.id}:${tasks.length}`}
                    sectionId={section.id}
                    beforeId={tail.beforeId}
                    afterId={tail.afterId}
                />
            </div>
        </section>
    )
}

function AppHeader() {
    return (
        <header className="mx-auto flex max-w-2xl items-baseline gap-3 px-8 py-5">
            <h1 className="text-title text-2xl font-semibold">SimpleGTD</h1>
            <span className="text-blue text-xs tracking-widest uppercase">
                Getting Things Done
            </span>
        </header>
    )
}

export default function App() {
    const sections = useApp((s) => s.sections)
    const { floatRef, startDrag } = useSortable(moveTask)

    function handleStartDrag(
        e: PointerEvent<HTMLButtonElement>,
        taskId: TaskId,
        sectionId: SectionId,
    ) {
        startDrag({ taskId, sectionId, startX: e.clientX, startY: e.clientY })
    }

    return (
        <div className="bg-page text-task min-h-screen">
            <AppHeader />
            <main className="mx-auto flex max-w-2xl flex-col gap-8 px-8 py-10">
                {sections.map((section) => (
                    <SectionView
                        key={section.id}
                        section={section}
                        onStartDrag={handleStartDrag}
                    />
                ))}
            </main>
            <FloatingTask floatRef={floatRef} />
        </div>
    )
}

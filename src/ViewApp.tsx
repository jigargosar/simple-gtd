import { Fragment, type RefObject } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { App as AppModel, useAppStore } from './useApp'
import type { Task, TaskId, Section, SectionId, DropResult } from './useApp'
import { useDragStore, useSortable } from './sortable/useSortable'
import { Beacon } from './sortable/ViewBeacons'

type StartDragHandler = (
    e: PointerEvent<HTMLButtonElement>,
    taskId: TaskId,
    sectionId: SectionId,
) => void

function FloatingTask({ floatRef }: { floatRef: RefObject<HTMLDivElement | null> }) {
    const dragTaskId = useDragStore((s) => s.drag?.taskId ?? null)
    const draggedTask = useAppStore((s) =>
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
    const isEditing = useAppStore((s) => AppModel.isEditingTask(s, task.id))
    const isDragging = useDragStore((s) => s.drag?.taskId === task.id)
    const { addTask, startEditTask, commitEditTask, cancelEditTask, toggleDone } =
        useAppStore((s) => s.actions)

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') cancelEditTask(task.id)
    }

    if (isDragging) {
        return (
            <div className="bg-page-subtle h-10 rounded border border-dashed border-gray-300 opacity-50" />
        )
    }

    return (
        <div className="group/task bg-page relative flex items-center gap-3 rounded px-4 py-2">
            <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/task:opacity-100">
                <button
                    className="text-label-muted hover:text-label cursor-grab touch-none rounded p-2 transition-colors active:cursor-grabbing"
                    onPointerDown={(e) => onStartDrag(e, task.id, sectionId)}
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
            {isEditing ? (
                <input
                    autoFocus
                    defaultValue={task.title}
                    onBlur={(e) => commitEditTask(task.id, e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    className="text-task flex-1 bg-transparent text-sm leading-relaxed tracking-wide outline-none"
                />
            ) : (
                <span
                    onClick={() => startEditTask(task.id)}
                    className={`flex-1 cursor-text text-sm leading-relaxed tracking-wide ${
                        task.done ? 'text-task-muted line-through' : 'text-task'
                    }`}
                >
                    {task.title || (
                        <span className="text-label-muted italic">
                            empty — click to edit
                        </span>
                    )}
                </span>
            )}
        </div>
    )
}

function adjacentVisibleIds(
    tasks: readonly Task[],
    aroundIdx: number,
    excludeId: TaskId | null,
): { beforeId: TaskId | null; afterId: TaskId | null } {
    const visible = (t: Task) => t.id !== excludeId
    const before = tasks
        .slice(0, aroundIdx + 1)
        .filter(visible)
        .at(-1)
    const after = tasks.slice(aroundIdx + 1).find(visible)
    return { beforeId: before?.id ?? null, afterId: after?.id ?? null }
}

function SectionView({
    section,
    onStartDrag,
}: {
    section: Section
    onStartDrag: StartDragHandler
}) {
    const tasks = useAppStore(useShallow((s) => AppModel.tasksIn(s, section.id)))
    const isEditing = useAppStore((s) => AppModel.isEditingSection(s, section.id))
    const { addTask, startEditSection, commitEditSection, cancelEditSection } =
        useAppStore((s) => s.actions)
    const draggingId = useDragStore((s) => s.drag?.taskId ?? null)

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') cancelEditSection(section.id)
    }

    const top = adjacentVisibleIds(tasks, -1, draggingId)

    return (
        <section>
            <div className="group/section relative">
                <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/section:opacity-100">
                    <button className="text-label-muted hover:text-label touch-none rounded p-2 transition-colors">
                        <GripVerticalIcon size={20} />
                    </button>
                    <button
                        onClick={() => addTask(section.id, null)}
                        className="text-label-muted hover:text-blue rounded p-2 transition-colors"
                    >
                        <PlusIcon size={20} />
                    </button>
                </div>
                <div className="flex items-center px-4 py-3">
                    {isEditing ? (
                        <input
                            autoFocus
                            defaultValue={section.title}
                            onBlur={(e) =>
                                commitEditSection(section.id, e.currentTarget.value)
                            }
                            onKeyDown={handleKeyDown}
                            className="text-blue w-full bg-transparent text-xs font-semibold tracking-[0.2em] uppercase outline-none"
                        />
                    ) : (
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
                    )}
                </div>
            </div>
            <div className="flex min-h-2 flex-col">
                <Beacon
                    id={`${section.id}:0`}
                    sectionId={section.id}
                    beforeId={top.beforeId}
                    afterId={top.afterId}
                />
                {tasks.map((task, i) => {
                    const { beforeId, afterId } = adjacentVisibleIds(tasks, i, draggingId)
                    return (
                        <Fragment key={task.id}>
                            <TaskView
                                task={task}
                                sectionId={section.id}
                                onStartDrag={onStartDrag}
                            />
                            <Beacon
                                id={`${section.id}:${i + 1}`}
                                sectionId={section.id}
                                beforeId={beforeId}
                                afterId={afterId}
                            />
                        </Fragment>
                    )
                })}
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
    const sections = useAppStore((s) => s.sections)
    const { moveTask } = useAppStore((s) => s.actions)
    const isDragging = useDragStore((s) => s.drag !== null)

    const { floatRef, startDrag } = useSortable((drop: DropResult) => moveTask(drop))

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
            {isDragging && <FloatingTask floatRef={floatRef} />}
        </div>
    )
}

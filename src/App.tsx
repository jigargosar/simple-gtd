import { Fragment, type RefObject } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { App as AppModel } from './app'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType, SectionId } from './section'
import { useAppStore } from './appStore'
import { useDragStore } from './dragStore'
import { Beacon } from './Beacon'
import { useDrag } from './useDrag'
import type { DropResult } from './useDrag'
import { useShallow } from 'zustand/react/shallow'

// ─── FloatingTask ─────────────────────────────────────────────────────────────

function FloatingTask({ floatRef }: { floatRef: RefObject<HTMLDivElement | null> }) {
    const dragTaskId = useDragStore((s) => s.drag?.taskId ?? null)
    const tasks = useAppStore((s) => s.tasks)
    const draggedTask =
        dragTaskId !== null ? (tasks.find((t) => t.id === dragTaskId) ?? null) : null

    if (draggedTask === null) return null

    return (
        <div
            ref={floatRef}
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 9999,
                opacity: 0.9,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                borderRadius: 6,
                minWidth: 240,
            }}
            className="bg-page flex items-center gap-3 rounded px-4 py-2"
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

// ─── TaskView ─────────────────────────────────────────────────────────────────

function TaskView({
    task,
    sectionId,
    onStartDrag,
}: {
    task: TaskType
    sectionId: SectionId
    onStartDrag: (
        e: PointerEvent<HTMLButtonElement>,
        taskId: TaskId,
        sectionId: SectionId,
    ) => void
}) {
    const isEditing = useAppStore((s) => AppModel.isEditingTask(s, sectionId, task.id))
    const isDragging = useDragStore((s) => s.drag?.taskId === task.id)
    const { addTask, startEditTask, commitEditTask, cancelEditTask, toggleDone } =
        useAppStore((s) => s.actions)

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') cancelEditTask(sectionId, task.id)
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
                onChange={() => toggleDone(sectionId, task.id)}
                className="accent-blue h-4 w-4 cursor-pointer"
            />
            {isEditing ? (
                <input
                    autoFocus
                    defaultValue={task.title}
                    onBlur={(e) =>
                        commitEditTask(sectionId, task.id, e.currentTarget.value)
                    }
                    onKeyDown={handleKeyDown}
                    className="text-task flex-1 bg-transparent text-sm leading-relaxed tracking-wide outline-none"
                />
            ) : (
                <span
                    onClick={() => startEditTask(sectionId, task.id)}
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

// ─── SectionView ──────────────────────────────────────────────────────────────

function SectionView({
    section,
    onStartDrag,
}: {
    section: SectionType
    onStartDrag: (
        e: PointerEvent<HTMLButtonElement>,
        taskId: TaskId,
        sectionId: SectionId,
    ) => void
}) {
    const tasks = useAppStore(useShallow((s) => AppModel.tasksIn(s, section.id)))
    const isSectionEditing = useAppStore((s) =>
        AppModel.isEditingSection(s, section.id),
    )
    const { addTask, startEditSection, commitEditSection, cancelEditSection } =
        useAppStore((s) => s.actions)
    const draggingTaskId = useDragStore((s) => s.drag?.taskId ?? null)

    function handleSectionKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') cancelEditSection(section.id)
    }

    // Exclude the dragged task from beacon neighbour computation so its own id
    // is never passed as beforeId/afterId at its original position.
    const visibleTasks = tasks.filter((t) => t.id !== draggingTaskId)

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
                    {isSectionEditing ? (
                        <input
                            autoFocus
                            defaultValue={section.title}
                            onBlur={(e) =>
                                commitEditSection(section.id, e.currentTarget.value)
                            }
                            onKeyDown={handleSectionKeyDown}
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
                    beforeId={null}
                    afterId={visibleTasks[0]?.id ?? null}
                />
                {tasks.map((task, i) => {
                    const isDraggedSlot = task.id === draggingTaskId
                    const beaconBeforeId = isDraggedSlot
                        ? (visibleTasks
                              .filter((_, vi) => tasks.indexOf(visibleTasks[vi]) < i)
                              .at(-1)?.id ?? null)
                        : task.id
                    const beaconAfterId =
                        visibleTasks.find((t) => tasks.indexOf(t) > i)?.id ?? null

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
                                beforeId={beaconBeforeId}
                                afterId={beaconAfterId}
                            />
                        </Fragment>
                    )
                })}
            </div>
        </section>
    )
}

// ─── App ──────────────────────────────────────────────────────────────────────

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

    const { floatRef, startDrag } = useDrag((drop: DropResult) => moveTask(drop))

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

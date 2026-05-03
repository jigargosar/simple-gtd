import { Fragment, type RefObject } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { Board } from './board'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType, SectionId } from './section'
import { useBoard } from './useBoard'
import { useDrag } from './useDrag'
import type { DropResult } from './useDrag'

// ─── Beacon ──────────────────────────────────────────────────────────────────

function Beacon({
    id,
    sectionId,
    beforeId,
    afterId,
    active,
}: {
    id: string
    sectionId: string
    beforeId: string | null
    afterId: string | null
    active: boolean
}) {
    return (
        <div
            data-beacon={id}
            data-beacon-section={sectionId}
            {...(beforeId !== null ? { 'data-beacon-before': beforeId } : {})}
            {...(afterId !== null ? { 'data-beacon-after': afterId } : {})}
            style={{ position: 'relative', height: 8, display: 'flex', alignItems: 'center' }}
        >
            <div style={{
                position: 'absolute', left: 8, right: 8, height: 2,
                background: 'dodgerblue', borderRadius: 1,
                opacity: active ? 1 : 0, transition: 'opacity 80ms ease',
            }} />
            <div style={{
                position: 'absolute', left: 2, width: 8, height: 8,
                borderRadius: '50%', background: 'dodgerblue',
                top: '50%', transform: 'translateY(-50%)',
                opacity: active ? 1 : 0, transition: 'opacity 80ms ease',
            }} />
            <div style={{
                position: 'absolute', right: 2, width: 8, height: 8,
                borderRadius: '50%', background: 'dodgerblue',
                top: '50%', transform: 'translateY(-50%)',
                opacity: active ? 1 : 0, transition: 'opacity 80ms ease',
            }} />
        </div>
    )
}

// ─── FloatingTask ─────────────────────────────────────────────────────────────

function FloatingTask({ task, floatRef }: { task: TaskType; floatRef: RefObject<HTMLDivElement | null> }) {
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
            <input type="checkbox" checked={task.done} readOnly className="accent-blue h-4 w-4" />
            <span className={`flex-1 text-sm leading-relaxed tracking-wide ${task.done ? 'text-task-muted line-through' : 'text-task'}`}>
                {task.title}
            </span>
        </div>
    )
}

// ─── TaskView ─────────────────────────────────────────────────────────────────

type TaskViewProps = {
    task: TaskType
    sectionId: SectionId
    isEditing: boolean
    isDragging: boolean
    onAdd: (sectionId: SectionId, afterId: TaskId) => void
    onStartEdit: (sectionId: SectionId, taskId: TaskId) => void
    onCommitEdit: (sectionId: SectionId, taskId: TaskId, title: string) => void
    onCancelEdit: (sectionId: SectionId, taskId: TaskId) => void
    onToggleDone: (sectionId: SectionId, taskId: TaskId) => void
    onStartDrag: (e: PointerEvent<HTMLButtonElement>, taskId: TaskId, sectionId: SectionId) => void
}

function TaskView({
    task, sectionId, isEditing, isDragging,
    onAdd, onStartEdit, onCommitEdit, onCancelEdit, onToggleDone, onStartDrag,
}: TaskViewProps) {
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') onCancelEdit(sectionId, task.id)
    }

    if (isDragging) {
        return <div className="bg-page-subtle h-10 rounded border border-dashed border-gray-300 opacity-50" />
    }

    return (
        <div className="group/task bg-page relative flex items-center gap-3 rounded px-4 py-2">
            <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/task:opacity-100">
                <button
                    className="text-label-muted hover:text-label touch-none cursor-grab rounded p-2 transition-colors active:cursor-grabbing"
                    onPointerDown={(e) => onStartDrag(e, task.id, sectionId)}
                >
                    <GripVerticalIcon size={20} />
                </button>
                <button
                    onClick={() => onAdd(sectionId, task.id)}
                    className="text-label-muted hover:text-blue rounded p-2 transition-colors"
                >
                    <PlusIcon size={20} />
                </button>
            </div>
            <input
                type="checkbox"
                checked={task.done}
                onChange={() => onToggleDone(sectionId, task.id)}
                className="accent-blue h-4 w-4 cursor-pointer"
            />
            {isEditing ? (
                <input
                    autoFocus
                    defaultValue={task.title}
                    onBlur={(e) => onCommitEdit(sectionId, task.id, e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    className="text-task flex-1 bg-transparent text-sm leading-relaxed tracking-wide outline-none"
                />
            ) : (
                <span
                    onClick={() => onStartEdit(sectionId, task.id)}
                    className={`flex-1 cursor-text text-sm leading-relaxed tracking-wide ${
                        task.done ? 'text-task-muted line-through' : 'text-task'
                    }`}
                >
                    {task.title || <span className="text-label-muted italic">empty — click to edit</span>}
                </span>
            )}
        </div>
    )
}

// ─── SectionView ──────────────────────────────────────────────────────────────

type SectionViewProps = {
    section: SectionType
    tasks: TaskType[]
    draggingTaskId: TaskId | null
    isSectionEditing: boolean
    isTaskEditing: (taskId: TaskId) => boolean
    activeBeaconId: string | null
    isDragging: boolean
    onAddTask: (sectionId: SectionId, afterId: TaskId | null) => void
    onStartEditSection: (sectionId: SectionId) => void
    onCommitEditSection: (sectionId: SectionId, title: string) => void
    onCancelEditSection: (sectionId: SectionId) => void
    onAdd: TaskViewProps['onAdd']
    onStartEdit: TaskViewProps['onStartEdit']
    onCommitEdit: TaskViewProps['onCommitEdit']
    onCancelEdit: TaskViewProps['onCancelEdit']
    onToggleDone: TaskViewProps['onToggleDone']
    onStartDrag: TaskViewProps['onStartDrag']
}

function SectionView({
    section, tasks, draggingTaskId, isSectionEditing, isTaskEditing, activeBeaconId, isDragging,
    onAddTask, onStartEditSection, onCommitEditSection, onCancelEditSection,
    onAdd, onStartEdit, onCommitEdit, onCancelEdit, onToggleDone, onStartDrag,
}: SectionViewProps) {
    function handleSectionKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') onCancelEditSection(section.id)
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
                        onClick={() => onAddTask(section.id, null)}
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
                            onBlur={(e) => onCommitEditSection(section.id, e.currentTarget.value)}
                            onKeyDown={handleSectionKeyDown}
                            className="text-blue w-full bg-transparent text-xs font-semibold tracking-[0.2em] uppercase outline-none"
                        />
                    ) : (
                        <h2
                            onClick={() => onStartEditSection(section.id)}
                            className="text-blue cursor-text text-xs font-semibold tracking-[0.2em] uppercase"
                        >
                            {section.title || <span className="text-label-muted italic normal-case">empty — click to edit</span>}
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
                    active={isDragging && activeBeaconId === `${section.id}:0`}
                />
                {tasks.map((task, i) => {
                    const isDraggedSlot = task.id === draggingTaskId
                    // Beacon sits below this task. Its neighbours are the nearest
                    // non-dragged tasks on either side in the visible list.
                    // Find the last visible task at or before i, and first visible task after i.
                    const beaconBeforeId = isDraggedSlot
                        ? (visibleTasks.filter((_, vi) => tasks.indexOf(visibleTasks[vi]) < i).at(-1)?.id ?? null)
                        : task.id
                    const beaconAfterId = visibleTasks.find((t) => tasks.indexOf(t) > i)?.id ?? null

                    return (
                        <Fragment key={task.id}>
                            <TaskView
                                task={task}
                                sectionId={section.id}
                                isEditing={isTaskEditing(task.id)}
                                isDragging={isDraggedSlot}
                                onAdd={onAdd}
                                onStartEdit={onStartEdit}
                                onCommitEdit={onCommitEdit}
                                onCancelEdit={onCancelEdit}
                                onToggleDone={onToggleDone}
                                onStartDrag={onStartDrag}
                            />
                            <Beacon
                                id={`${section.id}:${i + 1}`}
                                sectionId={section.id}
                                beforeId={beaconBeforeId}
                                afterId={beaconAfterId}
                                active={isDragging && activeBeaconId === `${section.id}:${i + 1}`}
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
            <span className="text-blue text-xs tracking-widest uppercase">Getting Things Done</span>
        </header>
    )
}

export default function App() {
    const { board, actions } = useBoard()

    const { drag, floatRef, startDrag } = useDrag((drop: DropResult) => actions.moveTask(drop))

    const activeBeaconId = drag?.activeBeacon?.beaconId ?? null
    const draggingTaskId = drag?.taskId ?? null
    const draggedTask = draggingTaskId !== null ? board.tasks.find((t) => t.id === draggingTaskId) ?? null : null

    function handleStartDrag(e: PointerEvent<HTMLButtonElement>, taskId: TaskId, sectionId: SectionId) {
        startDrag({ taskId, sectionId, startX: e.clientX, startY: e.clientY })
    }

    return (
        <div className="bg-page text-task min-h-screen">
            <AppHeader />
            <main className="mx-auto flex max-w-2xl flex-col gap-8 px-8 py-10">
                {board.sections.map((section) => (
                    <SectionView
                        key={section.id}
                        section={section}
                        tasks={Board.tasksIn(board, section.id)}
                        draggingTaskId={draggingTaskId}
                        isSectionEditing={Board.isEditingSection(board, section.id)}
                        isTaskEditing={(taskId) => Board.isEditingTask(board, section.id, taskId)}
                        activeBeaconId={activeBeaconId}
                        isDragging={drag !== null}
                        onAddTask={actions.addTask}
                        onStartEditSection={actions.startEditSection}
                        onCommitEditSection={actions.commitEditSection}
                        onCancelEditSection={actions.cancelEditSection}
                        onAdd={actions.addTask}
                        onStartEdit={actions.startEditTask}
                        onCommitEdit={actions.commitEditTask}
                        onCancelEdit={actions.cancelEditTask}
                        onToggleDone={actions.toggleDone}
                        onStartDrag={handleStartDrag}
                    />
                ))}
            </main>
            {drag !== null && draggedTask !== null && (
                <FloatingTask task={draggedTask} floatRef={floatRef} />
            )}
        </div>
    )
}

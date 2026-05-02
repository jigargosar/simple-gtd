import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, KeyboardEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { CollisionPriority } from '@dnd-kit/abstract'
import { move } from '@dnd-kit/helpers'
import { v4 as uuidv4 } from 'uuid'

type Task = {
    id: string
    title: string
    done: boolean
}

type Section = {
    id: string
    title: string
}

type BoardState = {
    sections: Section[]
    tasksBySection: Record<string, Task[]>
}

const STORAGE_KEY = 'simple-gtd:v2'

const S_INBOX = uuidv4()
const S_NEXT = uuidv4()
const S_PROJECTS = uuidv4()
const S_WAITING = uuidv4()
const S_SOMEDAY = uuidv4()

const INITIAL_SECTIONS: Section[] = [
    { id: S_INBOX, title: 'Inbox' },
    { id: S_NEXT, title: 'Next Actions' },
    { id: S_PROJECTS, title: 'Projects' },
    { id: S_WAITING, title: 'Waiting For' },
    { id: S_SOMEDAY, title: 'Someday / Maybe' },
]

const INITIAL_TASKS_BY_SECTION: Record<string, Task[]> = {
    [S_INBOX]: [
        { id: uuidv4(), title: 'Read article on deep work', done: false },
        { id: uuidv4(), title: "Reply to Sarah's email", done: false },
        { id: uuidv4(), title: 'Look into new invoicing tool', done: false },
    ],
    [S_NEXT]: [
        { id: uuidv4(), title: 'Write project proposal', done: false },
        { id: uuidv4(), title: 'Book dentist appointment', done: true },
        { id: uuidv4(), title: 'Review pull request #42', done: false },
    ],
    [S_PROJECTS]: [
        { id: uuidv4(), title: 'Launch SimpleGTD v1', done: false },
        { id: uuidv4(), title: 'Migrate database to Postgres', done: false },
        { id: uuidv4(), title: 'Redesign onboarding flow', done: true },
    ],
    [S_WAITING]: [
        { id: uuidv4(), title: 'Contract signature from client', done: false },
        { id: uuidv4(), title: 'Design assets from Priya', done: false },
    ],
    [S_SOMEDAY]: [
        { id: uuidv4(), title: 'Learn Rust', done: false },
        { id: uuidv4(), title: 'Build a keyboard', done: false },
        { id: uuidv4(), title: 'Read Thinking Fast and Slow', done: false },
    ],
}

function isTask(v: unknown): v is Task {
    return (
        v !== null &&
        typeof v === 'object' &&
        'id' in v &&
        typeof v.id === 'string' &&
        'title' in v &&
        typeof v.title === 'string' &&
        'done' in v &&
        typeof v.done === 'boolean'
    )
}

function isSection(v: unknown): v is Section {
    return (
        v !== null &&
        typeof v === 'object' &&
        'id' in v &&
        typeof v.id === 'string' &&
        'title' in v &&
        typeof v.title === 'string'
    )
}

function isBoardState(v: unknown): v is BoardState {
    if (v === null || typeof v !== 'object') return false
    if (!('sections' in v) || !('tasksBySection' in v)) return false
    const { sections, tasksBySection } = v
    if (!Array.isArray(sections) || !sections.every(isSection)) return false
    if (tasksBySection === null || typeof tasksBySection !== 'object') return false
    return Object.values(tasksBySection).every(
        (list) => Array.isArray(list) && list.every(isTask),
    )
}

function loadInitialBoard(): BoardState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed: unknown = JSON.parse(raw)
            if (isBoardState(parsed)) return parsed
        }
    } catch {
        // ignore parse / storage errors
    }
    return {
        sections: INITIAL_SECTIONS,
        tasksBySection: INITIAL_TASKS_BY_SECTION,
    }
}


function DragHandleButton(props: ComponentProps<'button'>) {
    return (
        <button
            {...props}
            className="touch-none rounded p-2 text-label-muted transition-colors hover:text-label"
        >
            <GripVerticalIcon size={20} />
        </button>
    )
}

function AddButton(props: ComponentProps<'button'>) {
    return (
        <button
            {...props}
            className="rounded p-2 text-label-muted transition-colors hover:text-blue"
        >
            <PlusIcon size={20} />
        </button>
    )
}

function SortableTask({
    task,
    index,
    sectionId,
    isEditing,
    onStartEdit,
    onCommitEdit,
    onCancelEdit,
    onToggleDone,
    onAddBelow,
}: {
    task: Task
    index: number
    sectionId: string
    isEditing: boolean
    onStartEdit: () => void
    onCommitEdit: (title: string) => void
    onCancelEdit: () => void
    onToggleDone: () => void
    onAddBelow: () => void
}) {
    const { ref, handleRef, isDragging } = useSortable({
        id: task.id,

        index,
        type: 'task',
        accept: 'task',
        group: sectionId,
    })

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.currentTarget.blur()
        } else if (e.key === 'Escape') {
            onCancelEdit()
        }
    }

    return (
        <div
            ref={ref}
            data-dragging={isDragging}
            className="group/task relative flex items-center gap-3 rounded bg-page px-4 py-2 data-[dragging=true]:opacity-30"
        >
            <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/task:opacity-100">
                <DragHandleButton ref={handleRef} />
                <AddButton onClick={onAddBelow} />
            </div>
            <input
                type="checkbox"
                checked={task.done}
                onChange={onToggleDone}
                className="h-4 w-4 cursor-pointer accent-blue"
            />
            {isEditing ? (
                <input
                    autoFocus
                    defaultValue={task.title}
                    onBlur={(e) => onCommitEdit(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-sm leading-relaxed tracking-wide text-task outline-none"
                />
            ) : (
                <span
                    onClick={onStartEdit}
                    className={`flex-1 cursor-text text-sm leading-relaxed tracking-wide ${
                        task.done
                            ? 'text-task-muted line-through'
                            : 'text-task'
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

function SortableSection({
    section,
    index,
    tasks,
    editingId,
    onStartEdit,
    onCommitEdit,
    onCancelEdit,
    onToggleDone,
    onAddTask,
    onAddTaskBelow,
}: {
    section: Section
    index: number
    tasks: Task[]
    editingId: string | null
    onStartEdit: (taskId: string) => void
    onCommitEdit: (taskId: string, title: string) => void
    onCancelEdit: () => void
    onToggleDone: (taskId: string) => void
    onAddTask: () => void
    onAddTaskBelow: (taskIndex: number) => void
}) {
    const { ref, handleRef } = useSortable({
        id: section.id,
        index,
        type: 'section',
        accept: ['task', 'section'],
        collisionPriority: CollisionPriority.Low,
    })

    return (
        <section ref={ref}>
            <div className="group/section-header relative">
                <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/section-header:opacity-100">
                    <DragHandleButton ref={handleRef} />
                    <AddButton onClick={onAddTask} />
                </div>
                <div className="flex items-center px-4 py-3">
                    <h2 className="text-xs font-semibold tracking-[0.2em] text-blue uppercase">
                        {section.title}
                    </h2>
                </div>
            </div>
            <div className="flex min-h-2 flex-col">
                {tasks.map((task, taskIndex) => (
                    <SortableTask
                        key={task.id}
                        task={task}
                        index={taskIndex}
                        sectionId={section.id}
                        isEditing={editingId === task.id}
                        onStartEdit={() => onStartEdit(task.id)}
                        onCommitEdit={(title) => onCommitEdit(task.id, title)}
                        onCancelEdit={onCancelEdit}
                        onToggleDone={() => onToggleDone(task.id)}
                        onAddBelow={() => onAddTaskBelow(taskIndex)}
                    />
                ))}
            </div>
        </section>
    )
}

function AppHeader() {
    return (
        <header className="px-8 py-5">
            <div className="mx-auto flex max-w-2xl items-baseline gap-3">
                <h1 className="text-2xl font-semibold text-title">
                    SimpleGTD
                </h1>
                <span className="text-xs tracking-widest text-blue uppercase">
                    Getting Things Done
                </span>
            </div>
        </header>
    )
}

function TaskBoard() {
    const [board, setBoard] = useState<BoardState>(loadInitialBoard)
    const [editingId, setEditingId] = useState<string | null>(null)
    const previousBoard = useRef(board)

    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
            } catch {
                // ignore quota / privacy mode errors
            }
        }, 100)
        return () => clearTimeout(timer)
    }, [board])

    function findSectionId(taskId: string): string | undefined {
        for (const [sid, list] of Object.entries(board.tasksBySection)) {
            if (list.some((t) => t.id === taskId)) return sid
        }
        return undefined
    }

    function addTask(sectionId: string, afterIndex?: number) {
        const newTask: Task = { id: uuidv4(), title: '', done: false }
        setBoard((prev) => {
            const list = prev.tasksBySection[sectionId] ?? []
            const insertAt = afterIndex === undefined ? list.length : afterIndex + 1
            const next = [...list]
            next.splice(insertAt, 0, newTask)
            return {
                ...prev,
                tasksBySection: { ...prev.tasksBySection, [sectionId]: next },
            }
        })
        setEditingId(newTask.id)
    }

    function commitEdit(taskId: string, title: string) {
        const trimmed = title.trim()
        const sid = findSectionId(taskId)
        if (sid === undefined) {
            setEditingId(null)
            return
        }
        setBoard((prev) => {
            const list = prev.tasksBySection[sid] ?? []
            const nextList = trimmed
                ? list.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t))
                : list.filter((t) => t.id !== taskId)
            return {
                ...prev,
                tasksBySection: { ...prev.tasksBySection, [sid]: nextList },
            }
        })
        setEditingId(null)
    }

    function cancelEdit() {
        if (editingId !== null) {
            const sid = findSectionId(editingId)
            const task = sid
                ? (board.tasksBySection[sid] ?? []).find((t) => t.id === editingId)
                : undefined
            if (sid && task && task.title.trim() === '') {
                setBoard((prev) => ({
                    ...prev,
                    tasksBySection: {
                        ...prev.tasksBySection,
                        [sid]: (prev.tasksBySection[sid] ?? []).filter(
                            (t) => t.id !== editingId,
                        ),
                    },
                }))
            }
        }
        setEditingId(null)
    }

    function toggleDone(taskId: string) {
        const sid = findSectionId(taskId)
        if (sid === undefined) return
        setBoard((prev) => ({
            ...prev,
            tasksBySection: {
                ...prev.tasksBySection,
                [sid]: (prev.tasksBySection[sid] ?? []).map((t) =>
                    t.id === taskId ? { ...t, done: !t.done } : t,
                ),
            },
        }))
    }

    return (
        <main className="mx-auto max-w-2xl px-8 py-10">
            <DragDropProvider
                onDragStart={() => {
                    previousBoard.current = board
                }}
                onDragOver={(event) => {
                    const { source } = event.operation
                    if (source?.type === 'section') return
                    setBoard((prev) => ({
                        ...prev,
                        tasksBySection: move(prev.tasksBySection, event),
                    }))
                }}
                onDragEnd={(event) => {
                    const { source } = event.operation
                    if (event.canceled) {
                        setBoard(previousBoard.current)
                        return
                    }
                    if (source?.type === 'section') {
                        setBoard((prev) => ({
                            ...prev,
                            sections: move(prev.sections, event),
                        }))
                    }
                }}
            >
                <div className="flex flex-col gap-8">
                    {board.sections.map((section, index) => (
                        <SortableSection
                            key={section.id}
                            section={section}
                            index={index}
                            tasks={board.tasksBySection[section.id] ?? []}
                            editingId={editingId}
                            onStartEdit={setEditingId}
                            onCommitEdit={commitEdit}
                            onCancelEdit={cancelEdit}
                            onToggleDone={toggleDone}
                            onAddTask={() => addTask(section.id)}
                            onAddTaskBelow={(taskIndex) =>
                                addTask(section.id, taskIndex)
                            }
                        />
                    ))}
                </div>
            </DragDropProvider>
        </main>
    )
}

export default function App() {
    return (
        <div className="min-h-screen bg-page text-task">
            <AppHeader />
            <TaskBoard />
        </div>
    )
}

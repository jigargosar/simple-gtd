import { useEffect, useState } from 'react'
import type { ComponentProps, KeyboardEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import type { Task, Section, BoardState, Id } from './model'
import { STORAGE_KEY, loadInitialBoard, makeId, makeTitle, orderBetween } from './model'


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
    isEditing,
    onStartEdit,
    onCommitEdit,
    onCancelEdit,
    onToggleDone,
    onAddBelow,
}: {
    task: Task
    isEditing: boolean
    onStartEdit: () => void
    onCommitEdit: (title: string) => void
    onCancelEdit: () => void
    onToggleDone: () => void
    onAddBelow: () => void
}) {
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.currentTarget.blur()
        } else if (e.key === 'Escape') {
            onCancelEdit()
        }
    }

    return (
        <div className="group/task relative flex items-center gap-3 rounded bg-page px-4 py-2">
            <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/task:opacity-100">
                <DragHandleButton />
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
    tasks: readonly Task[]
    editingId: Id | null
    onStartEdit: (taskId: Id) => void
    onCommitEdit: (taskId: Id, title: string) => void
    onCancelEdit: () => void
    onToggleDone: (taskId: Id) => void
    onAddTask: () => void
    onAddTaskBelow: (taskIndex: number) => void
}) {
    return (
        <section>
            <div className="group/section-header relative">
                <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/section-header:opacity-100">
                    <DragHandleButton />
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
    const [editingId, setEditingId] = useState<Id | null>(null)

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

    function findSectionId(taskId: Id): Id | undefined {
        for (const [sid, list] of Object.entries(board.tasksBySection)) {
            if (list.some((t) => t.id === taskId)) return sid as Id
        }
        return undefined
    }

    function addTask(sectionId: Id, afterIndex?: number) {
        const newId = makeId()
        setBoard((prev) => {
            const list = prev.tasksBySection[sectionId] ?? []
            const insertAt = afterIndex === undefined ? list.length : afterIndex + 1
            const prev_ = list[insertAt - 1]?.order ?? null
            const next_ = list[insertAt]?.order ?? null
            const newTask: Task = { id: newId, title: makeTitle(''), done: false, order: orderBetween(prev_, next_) }
            const next = [
                ...list.slice(0, insertAt),
                newTask,
                ...list.slice(insertAt),
            ]
            return {
                ...prev,
                tasksBySection: { ...prev.tasksBySection, [sectionId]: next },
            }
        })
        setEditingId(newId)
    }

    function commitEdit(taskId: Id, title: string) {
        const trimmed = title.trim()
        const sid = findSectionId(taskId)
        if (sid === undefined) {
            setEditingId(null)
            return
        }
        setBoard((prev) => {
            const list = prev.tasksBySection[sid] ?? []
            const nextList = trimmed
                ? list.map((t) => (t.id === taskId ? { ...t, title: makeTitle(trimmed) } : t))
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

    function toggleDone(taskId: Id) {
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
            <div className="flex flex-col gap-8">
                {board.sections.map((section) => (
                    <SortableSection
                        key={section.id}
                        section={section}
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

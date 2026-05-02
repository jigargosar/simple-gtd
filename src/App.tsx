import { Fragment, useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { Board } from './board'
import type { Board as BoardType, EditingTask } from './board'
import { Task } from './task'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType, SectionId } from './section'

function Controls({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1">
            <button className="text-label-muted hover:text-label touch-none rounded p-2 transition-colors">
                <GripVerticalIcon size={20} />
            </button>
            <button
                onClick={onAdd}
                className="text-label-muted hover:text-blue rounded p-2 transition-colors"
            >
                <PlusIcon size={20} />
            </button>
        </div>
    )
}

function Beacon() {
    return <div style={{ height: 1, backgroundColor: 'dodgerblue' }} />
}

type TaskViewProps = {
    task: TaskType
    editing: EditingTask | null
    onAdd: (afterId: TaskId | null) => void
    onStartEdit: () => void
    onCommitEdit: (title: string) => void
    onCancelEdit: () => void
    onToggleDone: () => void
}

function TaskView({ task, editing, onAdd, onStartEdit, onCommitEdit, onCancelEdit, onToggleDone }: TaskViewProps) {
    const isEditing = editing?.taskId === task.id

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') onCancelEdit()
    }

    return (
        <div className="group/task bg-page relative flex items-center gap-3 rounded px-4 py-2">
            <div className="opacity-0 transition-opacity group-hover/task:opacity-100">
                <Controls onAdd={() => onAdd(task.id)} />
            </div>
            <input
                type="checkbox"
                checked={task.done}
                onChange={onToggleDone}
                className="accent-blue h-4 w-4 cursor-pointer"
            />
            {isEditing ? (
                <input
                    autoFocus
                    defaultValue={task.title}
                    onBlur={(e) => onCommitEdit(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    className="text-task flex-1 bg-transparent text-sm leading-relaxed tracking-wide outline-none"
                />
            ) : (
                <span
                    onClick={onStartEdit}
                    className={`flex-1 cursor-text text-sm leading-relaxed tracking-wide ${
                        task.done ? 'text-task-muted line-through' : 'text-task'
                    }`}
                >
                    {task.title || (
                        <span className="text-label-muted italic">empty — click to edit</span>
                    )}
                </span>
            )}
        </div>
    )
}

type SectionViewProps = {
    section: SectionType
    board: BoardType
    editing: EditingTask | null
    onAdd: (sectionId: SectionId, afterId: TaskId | null) => void
    onStartEdit: (sectionId: SectionId, taskId: TaskId) => void
    onCommitEdit: (sectionId: SectionId, taskId: TaskId, title: string) => void
    onCancelEdit: () => void
    onToggleDone: (sectionId: SectionId, taskId: TaskId) => void
}

function SectionView({ section, board, editing, onAdd, onStartEdit, onCommitEdit, onCancelEdit, onToggleDone }: SectionViewProps) {
    const tasks = Board.tasksIn(board, section.id)

    return (
        <section>
            <div className="group/section relative">
                <div className="opacity-0 transition-opacity group-hover/section:opacity-100">
                    <Controls onAdd={() => onAdd(section.id, null)} />
                </div>
                <div className="flex items-center px-4 py-3">
                    <h2 className="text-blue text-xs font-semibold tracking-[0.2em] uppercase">
                        {section.title}
                    </h2>
                </div>
            </div>
            <div className="flex min-h-2 flex-col">
                <Beacon />
                {tasks.map((task) => (
                    <Fragment key={task.id}>
                        <TaskView
                            task={task}
                            editing={editing}
                            onAdd={(afterId) => onAdd(section.id, afterId)}
                            onStartEdit={() => onStartEdit(section.id, task.id)}
                            onCommitEdit={(title) => onCommitEdit(section.id, task.id, title)}
                            onCancelEdit={onCancelEdit}
                            onToggleDone={() => onToggleDone(section.id, task.id)}
                        />
                        <Beacon />
                    </Fragment>
                ))}
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
    const [board, setBoard] = useState<BoardType>(() => Board.load())
    const [editing, setEditing] = useState<EditingTask | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => Board.save(board), 100)
        return () => clearTimeout(timer)
    }, [board])

    function addTask(sectionId: SectionId, afterId: TaskId | null) {
        const result = Task.addNew(Board.tasksIn(board, sectionId), afterId)
        if (result === null) return
        setBoard(Board.updateTasks(board, sectionId, result.tasks))
        setEditing({ sectionId, taskId: result.newTaskId })
    }

    function startEdit(sectionId: SectionId, taskId: TaskId) {
        setEditing({ sectionId, taskId })
    }

    function commitEdit(sectionId: SectionId, taskId: TaskId, title: string) {
        const list = Board.tasksIn(board, sectionId)
        setBoard(Board.updateTasks(board, sectionId, Task.updateTitle(list, taskId, title)))
        setEditing(null)
    }

    function cancelEdit() {
        if (editing === null) return
        const { sectionId, taskId } = editing
        const list = Board.tasksIn(board, sectionId)
        setBoard(Board.updateTasks(board, sectionId, Task.removeIfBlank(list, taskId)))
        setEditing(null)
    }

    function toggleDone(sectionId: SectionId, taskId: TaskId) {
        const list = Board.tasksIn(board, sectionId)
        setBoard(Board.updateTasks(board, sectionId, Task.toggleDone(list, taskId)))
    }

    return (
        <div className="bg-page text-task min-h-screen">
            <AppHeader />
            <main className="mx-auto flex max-w-2xl flex-col gap-8 px-8 py-10">
                {board.sections.map((section) => (
                    <SectionView
                        key={section.id}
                        section={section}
                        board={board}
                        editing={editing}
                        onAdd={addTask}
                        onStartEdit={startEdit}
                        onCommitEdit={commitEdit}
                        onCancelEdit={cancelEdit}
                        onToggleDone={toggleDone}
                    />
                ))}
            </main>
        </div>
    )
}

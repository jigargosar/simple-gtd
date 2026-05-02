import { Fragment } from 'react'
import type { KeyboardEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import type { Task, Section, Id } from './model'
import { useBoardState } from './model'

function Controls({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1">
            <button className="touch-none rounded p-2 text-label-muted transition-colors hover:text-label">
                <GripVerticalIcon size={20} />
            </button>
            <button onClick={onAdd} className="rounded p-2 text-label-muted transition-colors hover:text-blue">
                <PlusIcon size={20} />
            </button>
        </div>
    )
}

function Beacon() {
    return <div style={{ height: 1, backgroundColor: 'dodgerblue' }} />
}

function TaskView({
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
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') onCancelEdit()
    }

    return (
        <div className="group/task relative flex items-center gap-3 rounded bg-page px-4 py-2">
            <div className="opacity-0 transition-opacity group-hover/task:opacity-100">
                <Controls onAdd={onAddBelow} />
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
                        task.done ? 'text-task-muted line-through' : 'text-task'
                    }`}
                >
                    {task.title || <span className="italic text-label-muted">empty — click to edit</span>}
                </span>
            )}
        </div>
    )
}

function SectionView({
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
            <div className="group/section relative">
                <div className="opacity-0 transition-opacity group-hover/section:opacity-100">
                    <Controls onAdd={onAddTask} />
                </div>
                <div className="flex items-center px-4 py-3">
                    <h2 className="text-xs font-semibold tracking-[0.2em] text-blue uppercase">
                        {section.title}
                    </h2>
                </div>
            </div>
            <div className="flex min-h-2 flex-col">
                <Beacon />
                {tasks.map((task, taskIndex) => (
                    <Fragment key={task.id}>
                        <TaskView
                            task={task}
                            isEditing={editingId === task.id}
                            onStartEdit={() => onStartEdit(task.id)}
                            onCommitEdit={(title) => onCommitEdit(task.id, title)}
                            onCancelEdit={onCancelEdit}
                            onToggleDone={() => onToggleDone(task.id)}
                            onAddBelow={() => onAddTaskBelow(taskIndex)}
                        />
                        <Beacon />
                    </Fragment>
                ))}
            </div>
        </section>
    )
}


function BoardView() {
    const { board, editingId, startEdit, addTask, commitEdit, cancelEdit, toggleDone } = useBoardState()

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-8 px-8 py-10">
            {board.sections.map((section) => (
                <SectionView
                    key={section.id}
                    section={section}
                    tasks={board.tasksBySection[section.id] ?? []}
                    editingId={editingId}
                    onStartEdit={startEdit}
                    onCommitEdit={commitEdit}
                    onCancelEdit={cancelEdit}
                    onToggleDone={toggleDone}
                    onAddTask={() => addTask(section.id)}
                    onAddTaskBelow={(taskIndex) => addTask(section.id, taskIndex)}
                />
            ))}
        </main>
    )
}

function AppHeader() {
    return (
        <header className="mx-auto flex max-w-2xl items-baseline gap-3 px-8 py-5">
            <h1 className="text-2xl font-semibold text-title">SimpleGTD</h1>
            <span className="text-xs tracking-widest text-blue uppercase">Getting Things Done</span>
        </header>
    )
}

export default function App() {
    return (
        <div className="min-h-screen bg-page text-task">
            <AppHeader />
            <BoardView />
        </div>
    )
}

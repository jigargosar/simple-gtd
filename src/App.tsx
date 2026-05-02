import { Fragment } from 'react'
import type { KeyboardEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import type { Task, Section, SectionId } from './model'
import { BoardProvider, useBoard, Task as TaskOps } from './model'

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

function TaskView({
    task,
    sectionId,
}: {
    task: Task
    sectionId: SectionId
}) {
    const board = useBoard()
    const isEditing = board.isEditing(task)

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') board.cancelEdit()
    }

    return (
        <div className="group/task bg-page relative flex items-center gap-3 rounded px-4 py-2">
            <div className="opacity-0 transition-opacity group-hover/task:opacity-100">
                <Controls onAdd={() => board.addTask(sectionId, TaskOps.after(task.id))} />
            </div>
            <input
                type="checkbox"
                checked={task.done}
                onChange={() => board.toggleDone(sectionId, task)}
                className="accent-blue h-4 w-4 cursor-pointer"
            />
            {isEditing ? (
                <input
                    autoFocus
                    defaultValue={task.title}
                    onBlur={(e) => board.commitEdit(sectionId, task, e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    className="text-task flex-1 bg-transparent text-sm leading-relaxed tracking-wide outline-none"
                />
            ) : (
                <span
                    onClick={() => board.startEdit(sectionId, task)}
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

function SectionView({ section }: { section: Section }) {
    const board = useBoard()
    const tasks = board.tasksIn(section.id)

    return (
        <section>
            <div className="group/section relative">
                <div className="opacity-0 transition-opacity group-hover/section:opacity-100">
                    <Controls onAdd={() => board.addTask(section.id, TaskOps.noId)} />
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
                        <TaskView task={task} sectionId={section.id} />
                        <Beacon />
                    </Fragment>
                ))}
            </div>
        </section>
    )
}

function BoardView() {
    const board = useBoard()

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-8 px-8 py-10">
            {board.sections.map((section) => (
                <SectionView key={section.id} section={section} />
            ))}
        </main>
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
    return (
        <BoardProvider>
            <div className="bg-page text-task min-h-screen">
                <AppHeader />
                <BoardView />
            </div>
        </BoardProvider>
    )
}

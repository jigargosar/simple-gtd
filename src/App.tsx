import { Fragment } from 'react'
import type { KeyboardEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { Board } from './board'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType, SectionId } from './section'
import { useBoard } from './useBoard'

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
    isEditing: boolean
    onAdd: (afterId: TaskId) => void
    onStartEdit: () => void
    onCommitEdit: (title: string) => void
    onCancelEdit: () => void
    onToggleDone: () => void
}

function TaskView({ task, isEditing, onAdd, onStartEdit, onCommitEdit, onCancelEdit, onToggleDone }: TaskViewProps) {
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
    tasks: TaskType[]
    isSectionEditing: boolean
    isTaskEditing: (taskId: TaskId) => boolean
    onAdd: (sectionId: SectionId, afterId: TaskId | null) => void
    onStartEditSection: (sectionId: SectionId) => void
    onCommitEditSection: (sectionId: SectionId, title: string) => void
    onCancelEditSection: (sectionId: SectionId) => void
    onStartEditTask: (sectionId: SectionId, taskId: TaskId) => void
    onCommitEditTask: (sectionId: SectionId, taskId: TaskId, title: string) => void
    onCancelEditTask: (sectionId: SectionId, taskId: TaskId) => void
    onToggleDone: (sectionId: SectionId, taskId: TaskId) => void
}

function SectionView({
    section, tasks, isSectionEditing, isTaskEditing,
    onAdd,
    onStartEditSection, onCommitEditSection, onCancelEditSection,
    onStartEditTask, onCommitEditTask, onCancelEditTask,
    onToggleDone,
}: SectionViewProps) {

    function handleSectionKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') onCancelEditSection(section.id)
    }

    return (
        <section>
            <div className="group/section relative">
                <div className="opacity-0 transition-opacity group-hover/section:opacity-100">
                    <Controls onAdd={() => onAdd(section.id, null)} />
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
                            {section.title || (
                                <span className="text-label-muted italic normal-case">empty — click to edit</span>
                            )}
                        </h2>
                    )}
                </div>
            </div>
            <div className="flex min-h-2 flex-col">
                <Beacon />
                {tasks.map((task) => (
                    <Fragment key={task.id}>
                        <TaskView
                            task={task}
                            isEditing={isTaskEditing(task.id)}
                            onAdd={(afterId) => onAdd(section.id, afterId)}
                            onStartEdit={() => onStartEditTask(section.id, task.id)}
                            onCommitEdit={(title) => onCommitEditTask(section.id, task.id, title)}
                            onCancelEdit={() => onCancelEditTask(section.id, task.id)}
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
    const { board, actions } = useBoard()

    return (
        <div className="bg-page text-task min-h-screen">
            <AppHeader />
            <main className="mx-auto flex max-w-2xl flex-col gap-8 px-8 py-10">
                {board.sections.map((section) => (
                    <SectionView
                        key={section.id}
                        section={section}
                        tasks={Board.tasksIn(board, section.id)}
                        isSectionEditing={Board.isEditingSection(board, section.id)}
                        isTaskEditing={(taskId) => Board.isEditingTask(board, section.id, taskId)}
                        onAdd={actions.addTask}
                        onStartEditSection={actions.startEditSection}
                        onCommitEditSection={actions.commitEditSection}
                        onCancelEditSection={actions.cancelEditSection}
                        onStartEditTask={actions.startEditTask}
                        onCommitEditTask={actions.commitEditTask}
                        onCancelEditTask={actions.cancelEditTask}
                        onToggleDone={actions.toggleDone}
                    />
                ))}
            </main>
        </div>
    )
}

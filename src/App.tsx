import { Fragment } from 'react'
import type { KeyboardEvent } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { Board } from './board'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType } from './section'
import { useBoard } from './useBoard'

function Controls({ onAddTask }: { onAddTask: () => void }) {
    return (
        <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1">
            <button className="text-label-muted hover:text-label touch-none rounded p-2 transition-colors">
                <GripVerticalIcon size={20} />
            </button>
            <button
                onClick={onAddTask}
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

type TaskActions = {
    add: (afterId: TaskId) => void
    startEdit: () => void
    commitEdit: (title: string) => void
    cancelEdit: () => void
    toggleDone: () => void
}

type TaskViewProps = {
    task: TaskType
    isEditing: boolean
    actions: TaskActions
}

function TaskView({ task, isEditing, actions }: TaskViewProps) {
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') actions.cancelEdit()
    }

    return (
        <div className="group/task bg-page relative flex items-center gap-3 rounded px-4 py-2">
            <div className="opacity-0 transition-opacity group-hover/task:opacity-100">
                <Controls onAddTask={() => actions.add(task.id)} />
            </div>
            <input
                type="checkbox"
                checked={task.done}
                onChange={actions.toggleDone}
                className="accent-blue h-4 w-4 cursor-pointer"
            />
            {isEditing ? (
                <input
                    autoFocus
                    defaultValue={task.title}
                    onBlur={(e) => actions.commitEdit(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    className="text-task flex-1 bg-transparent text-sm leading-relaxed tracking-wide outline-none"
                />
            ) : (
                <span
                    onClick={actions.startEdit}
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

type SectionActions = {
    addTask: (afterId: TaskId | null) => void
    startEdit: () => void
    commitEdit: (title: string) => void
    cancelEdit: () => void
}

type SectionViewProps = {
    section: SectionType
    tasks: TaskType[]
    isSectionEditing: boolean
    isTaskEditing: (taskId: TaskId) => boolean
    sectionActions: SectionActions
    taskActions: (taskId: TaskId) => TaskActions
}

function SectionView({ section, tasks, isSectionEditing, isTaskEditing, sectionActions, taskActions }: SectionViewProps) {
    function handleSectionKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') sectionActions.cancelEdit()
    }

    return (
        <section>
            <div className="group/section relative">
                <div className="opacity-0 transition-opacity group-hover/section:opacity-100">
                    <Controls onAddTask={() => sectionActions.addTask(null)} />
                </div>
                <div className="flex items-center px-4 py-3">
                    {isSectionEditing ? (
                        <input
                            autoFocus
                            defaultValue={section.title}
                            onBlur={(e) => sectionActions.commitEdit(e.currentTarget.value)}
                            onKeyDown={handleSectionKeyDown}
                            className="text-blue w-full bg-transparent text-xs font-semibold tracking-[0.2em] uppercase outline-none"
                        />
                    ) : (
                        <h2
                            onClick={sectionActions.startEdit}
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
                            actions={taskActions(task.id)}
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
                        sectionActions={{
                            addTask: (afterId) => actions.addTask(section.id, afterId),
                            startEdit: () => actions.startEditSection(section.id),
                            commitEdit: (title) => actions.commitEditSection(section.id, title),
                            cancelEdit: () => actions.cancelEditSection(section.id),
                        }}
                        taskActions={(taskId) => ({
                            add: (afterId) => actions.addTask(section.id, afterId),
                            startEdit: () => actions.startEditTask(section.id, taskId),
                            commitEdit: (title) => actions.commitEditTask(section.id, taskId, title),
                            cancelEdit: () => actions.cancelEditTask(section.id, taskId),
                            toggleDone: () => actions.toggleDone(section.id, taskId),
                        })}
                    />
                ))}
            </main>
        </div>
    )
}

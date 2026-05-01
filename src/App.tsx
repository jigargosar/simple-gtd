import { useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { CollisionPriority } from '@dnd-kit/abstract'
import { move } from '@dnd-kit/helpers'

type Task = {
    id: number
    title: string
    done: boolean
}

type SectionMeta = {
    id: string
    title: string
}

const INITIAL_SECTION_ORDER: string[] = [
    'inbox',
    'next',
    'projects',
    'waiting',
    'someday',
]

const SECTION_META: Record<string, SectionMeta> = {
    inbox: { id: 'inbox', title: 'Inbox' },
    next: { id: 'next', title: 'Next Actions' },
    projects: { id: 'projects', title: 'Projects' },
    waiting: { id: 'waiting', title: 'Waiting For' },
    someday: { id: 'someday', title: 'Someday / Maybe' },
}

const INITIAL_TASKS_BY_SECTION: Record<string, Task[]> = {
    inbox: [
        { id: 1, title: 'Read article on deep work', done: false },
        { id: 2, title: "Reply to Sarah's email", done: false },
        { id: 3, title: 'Look into new invoicing tool', done: false },
    ],
    next: [
        { id: 4, title: 'Write project proposal', done: false },
        { id: 5, title: 'Book dentist appointment', done: true },
        { id: 6, title: 'Review pull request #42', done: false },
    ],
    projects: [
        { id: 7, title: 'Launch SimpleGTD v1', done: false },
        { id: 8, title: 'Migrate database to Postgres', done: false },
        { id: 9, title: 'Redesign onboarding flow', done: true },
    ],
    waiting: [
        { id: 10, title: 'Contract signature from client', done: false },
        { id: 11, title: 'Design assets from Priya', done: false },
    ],
    someday: [
        { id: 12, title: 'Learn Rust', done: false },
        { id: 13, title: 'Build a keyboard', done: false },
        { id: 14, title: 'Read Thinking Fast and Slow', done: false },
    ],
}

function DragHandleButton(props: ComponentProps<'button'>) {
    return (
        <button
            {...props}
            className="touch-none rounded p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
            <GripVerticalIcon size={16} />
        </button>
    )
}

function AddButton() {
    return (
        <button className="rounded p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-amber-bright)]">
            <PlusIcon size={16} />
        </button>
    )
}

function SortableTask({
    task,
    index,
    sectionId,
}: {
    task: Task
    index: number
    sectionId: string
}) {
    const { ref, handleRef, isDragging } = useSortable({
        id: task.id,
        index,
        type: 'task',
        accept: 'task',
        group: sectionId,
    })

    return (
        <div
            ref={ref}
            data-dragging={isDragging}
            className="group/task relative flex items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 transition-colors hover:border-[var(--color-border-strong)] data-[dragging=true]:opacity-30"
        >
            <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover/task:opacity-100">
                <DragHandleButton ref={handleRef} />
                <AddButton />
            </div>
            <span
                className={`flex-1 text-sm leading-relaxed tracking-wide ${
                    task.done
                        ? 'text-[var(--color-text-done)] line-through decoration-[var(--color-text-done)]'
                        : 'text-[var(--color-text-primary)]'
                }`}
            >
                {task.title}
            </span>
        </div>
    )
}

function SortableSection({
    section,
    index,
    tasks,
}: {
    section: SectionMeta
    index: number
    tasks: Task[]
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
                    <AddButton />
                </div>
                <div className="flex items-center gap-3 px-2 py-3">
                    <span className="h-px flex-1 bg-[var(--color-border)]" />
                    <h2 className="text-xs font-semibold tracking-[0.2em] text-[var(--color-amber)] uppercase">
                        {section.title}
                    </h2>
                    <span className="h-px flex-1 bg-[var(--color-border)]" />
                </div>
            </div>
            <div className="flex min-h-2 flex-col gap-2">
                {tasks.map((task, taskIndex) => (
                    <SortableTask
                        key={task.id}
                        task={task}
                        index={taskIndex}
                        sectionId={section.id}
                    />
                ))}
            </div>
        </section>
    )
}

function AppHeader() {
    return (
        <header className="border-b border-[var(--color-border)] px-8 py-5">
            <div className="mx-auto flex max-w-2xl items-baseline gap-3">
                <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                    SimpleGTD
                </h1>
                <span className="text-xs tracking-widest text-[var(--color-amber)] uppercase">
                    Getting Things Done
                </span>
            </div>
        </header>
    )
}

function TaskBoard() {
    const [tasksBySection, setTasksBySection] = useState<Record<string, Task[]>>(
        INITIAL_TASKS_BY_SECTION,
    )
    const [sectionOrder, setSectionOrder] = useState<string[]>(INITIAL_SECTION_ORDER)
    const previousTasks = useRef(tasksBySection)
    const previousOrder = useRef(sectionOrder)

    return (
        <main className="mx-auto max-w-2xl px-8 py-10">
            <DragDropProvider
                onDragStart={() => {
                    previousTasks.current = tasksBySection
                    previousOrder.current = sectionOrder
                }}
                onDragOver={(event) => {
                    const { source } = event.operation
                    if (source?.type === 'section') return
                    setTasksBySection((prev) => move(prev, event))
                }}
                onDragEnd={(event) => {
                    const { source } = event.operation
                    if (event.canceled) {
                        setTasksBySection(previousTasks.current)
                        setSectionOrder(previousOrder.current)
                        return
                    }
                    if (source?.type === 'section') {
                        setSectionOrder((prev) => move(prev, event))
                    }
                }}
            >
                <div className="flex flex-col gap-8">
                    {sectionOrder.map((sectionId, index) => {
                        const section = SECTION_META[sectionId]
                        if (!section) return null
                        return (
                            <SortableSection
                                key={sectionId}
                                section={section}
                                index={index}
                                tasks={tasksBySection[sectionId] ?? []}
                            />
                        )
                    })}
                </div>
            </DragDropProvider>
        </main>
    )
}

export default function App() {
    return (
        <div className="min-h-screen bg-[var(--color-ink)] text-[var(--color-text-primary)]">
            <AppHeader />
            <TaskBoard />
        </div>
    )
}

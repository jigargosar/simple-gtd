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
            className="touch-none rounded p-2 text-gray-300 hover:text-gray-500"
        >
            <GripVerticalIcon size={18} />
        </button>
    )
}

function AddButton() {
    return (
        <button className="rounded p-2 text-gray-300 hover:text-gray-500">
            <PlusIcon size={18} />
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
            className="group/task relative flex items-center rounded-lg border border-gray-200 bg-white px-4 py-3 data-[dragging=true]:opacity-40"
        >
            <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-1 pr-2 opacity-0 transition-opacity group-hover/task:opacity-100">
                <DragHandleButton ref={handleRef} />
                <AddButton />
            </div>
            <span
                className={`flex-1 text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}
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
                <div className="absolute top-0 left-0 flex h-full -translate-x-full items-center gap-1 pr-2 opacity-0 transition-opacity group-hover/section-header:opacity-100">
                    <DragHandleButton ref={handleRef} />
                    <AddButton />
                </div>
                <h2 className="px-2 py-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">
                    {section.title}
                </h2>
            </div>
            <div className="flex min-h-2 flex-col gap-3">
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
        <header className="border-b border-gray-200 bg-white px-6 py-4">
            <h1 className="text-xl font-semibold tracking-tight">SimpleGTD</h1>
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
        <main className="mx-auto max-w-2xl px-6 py-10">
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
                <div className="flex flex-col gap-10">
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
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <AppHeader />
            <TaskBoard />
        </div>
    )
}

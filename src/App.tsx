import { useState } from 'react'
import {
    DndContext,
    type DragEndEvent,
    PointerSensor,
    type UniqueIdentifier,
    closestCenter,
    useDndContext,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Task = {
    id: number
    title: string
    done: boolean
}

type TaskList = {
    id: string
    title: string
    tasks: Task[]
}

const INITIAL_LISTS: TaskList[] = [
    {
        id: 'inbox',
        title: 'Inbox',
        tasks: [
            { id: 1, title: 'Read article on deep work', done: false },
            { id: 2, title: "Reply to Sarah's email", done: false },
            { id: 3, title: 'Look into new invoicing tool', done: false },
        ],
    },
    {
        id: 'next',
        title: 'Next Actions',
        tasks: [
            { id: 4, title: 'Write project proposal', done: false },
            { id: 5, title: 'Book dentist appointment', done: true },
            { id: 6, title: 'Review pull request #42', done: false },
        ],
    },
    {
        id: 'projects',
        title: 'Projects',
        tasks: [
            { id: 7, title: 'Launch SimpleGTD v1', done: false },
            { id: 8, title: 'Migrate database to Postgres', done: false },
            { id: 9, title: 'Redesign onboarding flow', done: true },
        ],
    },
    {
        id: 'waiting',
        title: 'Waiting For',
        tasks: [
            { id: 10, title: 'Contract signature from client', done: false },
            { id: 11, title: 'Design assets from Priya', done: false },
        ],
    },
    {
        id: 'someday',
        title: 'Someday / Maybe',
        tasks: [
            { id: 12, title: 'Learn Rust', done: false },
            { id: 13, title: 'Build a keyboard', done: false },
            { id: 14, title: 'Read Thinking Fast and Slow', done: false },
        ],
    },
]

function DragHandle() {
    return (
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="7" r="1.5" />
            <circle cx="8" cy="7" r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
        </svg>
    )
}

function HoverControls({
    dragAttributes,
    dragListeners,
    suppressHover,
    visibilityClass,
}: {
    dragAttributes: React.HTMLAttributes<HTMLElement>
    dragListeners: React.HTMLAttributes<HTMLElement> | undefined
    suppressHover: boolean
    visibilityClass: string
}) {
    return (
        <div
            className={`absolute -left-16 top-0 h-full w-16 flex flex-row items-center justify-end gap-1 pr-2 opacity-0 transition-opacity ${suppressHover ? '' : visibilityClass}`}
        >
            <button
                {...dragAttributes}
                {...dragListeners}
                className="p-2 cursor-grab text-gray-300 hover:text-gray-500 touch-none rounded"
            >
                <DragHandle />
            </button>
            <button className="p-2 text-gray-300 hover:text-gray-500 text-sm leading-none rounded">
                +
            </button>
        </div>
    )
}

function SortableTask({ task }: { task: Task }) {
    const { active } = useDndContext()
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: 'task' },
    })
    const suppressHover = active !== null && active.id !== task.id

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            className="group/task relative"
        >
            <HoverControls
                dragAttributes={attributes}
                dragListeners={listeners}
                suppressHover={suppressHover}
                visibilityClass="group-hover/task:opacity-100"
            />
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                <span className={`flex-1 text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                </span>
            </div>
        </div>
    )
}

function SortableSection({ list }: { list: TaskList }) {
    const { active } = useDndContext()
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: list.id,
        data: { type: 'section' },
    })
    const suppressHover = active !== null && active.id !== list.id

    const taskIds: UniqueIdentifier[] = list.tasks.map(t => t.id)

    return (
        <section
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
        >
            {/* group/section-header scoped to this row only — does not encompass tasks */}
            <div className="group/section-header relative ml-16">
                <HoverControls
                    dragAttributes={attributes}
                    dragListeners={listeners}
                    suppressHover={suppressHover}
                    visibilityClass="group-hover/section-header:opacity-100"
                />
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {list.title}
                </h2>
            </div>
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="ml-16 space-y-2">
                    {list.tasks.map(task => (
                        <SortableTask key={task.id} task={task} />
                    ))}
                </div>
            </SortableContext>
        </section>
    )
}

export default function App() {
    const [lists, setLists] = useState<TaskList[]>(INITIAL_LISTS)
    const [isDragging, setIsDragging] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const activeData = active.data.current
        const activeType = typeof activeData?.['type'] === 'string' ? activeData['type'] : undefined

        if (activeType === 'section') {
            setLists(prev => {
                const oldIndex = prev.findIndex(l => l.id === active.id)
                const newIndex = prev.findIndex(l => l.id === over.id)
                if (oldIndex === -1 || newIndex === -1) return prev
                return arrayMove(prev, oldIndex, newIndex)
            })
        } else if (activeType === 'task') {
            setLists(prev =>
                prev.map(list => {
                    const oldIndex = list.tasks.findIndex(t => t.id === active.id)
                    if (oldIndex === -1) return list
                    const newIndex = list.tasks.findIndex(t => t.id === over.id)
                    if (newIndex === -1) return list
                    return { ...list, tasks: arrayMove(list.tasks, oldIndex, newIndex) }
                })
            )
        }
    }

    const listIds: UniqueIdentifier[] = lists.map(l => l.id)

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="border-b border-gray-200 bg-white px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight">SimpleGTD</h1>
            </header>
            <main className={`mx-auto max-w-2xl px-6 py-10 space-y-10 ${isDragging ? 'select-none' : ''}`}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={e => { setIsDragging(false); handleDragEnd(e) }}
                    onDragCancel={() => setIsDragging(false)}
                >
                    <SortableContext items={listIds} strategy={verticalListSortingStrategy}>
                        {lists.map(list => (
                            <SortableSection key={list.id} list={list} />
                        ))}
                    </SortableContext>
                </DndContext>
            </main>
        </div>
    )
}

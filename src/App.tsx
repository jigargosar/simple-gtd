import { useState } from 'react'
import { generateNKeysBetween, generateKeyBetween } from 'fractional-indexing'

type List = {
    id: string
    name: string
    order: string
}

type Task = {
    id: string
    text: string
    parentId: string
    order: string
}

function uid() {
    return Math.random().toString(36).slice(2, 10)
}


function seedData(): { lists: List[]; tasks: Task[] } {
    const listNames = ['Inbox', 'Next Actions', 'Projects', 'Waiting For', 'Someday / Maybe']
    const listOrders = generateNKeysBetween(null, null, listNames.length)
    const lists: List[] = listNames.map((name, i) => ({ id: uid(), name, order: listOrders[i] }))

    const seedTasks: [number, string][] = [
        [0, 'Review meeting notes'],
        [0, 'Reply to Sarah re: proposal'],
        [0, 'Schedule dentist appointment'],
        [1, 'Draft Q3 report outline'],
        [1, 'Call accountant about taxes'],
        [1, 'Update project README'],
        [2, 'Launch new website'],
        [2, 'Hire frontend developer'],
        [3, 'Waiting on design mockups from Alex'],
        [3, 'Waiting on contract approval'],
        [4, 'Learn Spanish'],
        [4, 'Read Thinking, Fast and Slow'],
    ]

    const tasks: Task[] = seedTasks.map(([listIdx, text]) => {
        const parentId = lists[listIdx].id
        return { id: uid(), text, parentId, order: generateKeyBetween(null, null) }
    })

    return { lists, tasks }
}

const SEED = seedData()

export default function App() {
    const lists = SEED.lists
    const tasks = SEED.tasks

    const sortedLists = [...lists].sort((a, b) => (a.order < b.order ? -1 : 1))

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'var(--color-ink)',
                paddingTop: '3rem',
                paddingBottom: '6rem',
            }}
        >
            {/* Page header */}
            <header
                style={{
                    maxWidth: 560,
                    margin: '0 auto 3.5rem',
                    padding: '0 1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '1.5rem',
                }}
            >
                <div
                    style={{
                        fontSize: '0.65rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--color-amber)',
                        marginBottom: '0.5rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 400,
                    }}
                >
                    Getting Things Done
                </div>
                <h1
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        margin: 0,
                        lineHeight: 1.15,
                        letterSpacing: '-0.01em',
                    }}
                >
                    My Lists
                </h1>
            </header>

            {/* Lists */}
            <main style={{ maxWidth: 560, margin: '0 auto', padding: '0 1.5rem' }}>
                {sortedLists.map((list, i) => (
                    <ListSection
                        key={list.id}
                        list={list}
                        index={i}
                        tasks={tasks
                            .filter((t) => t.parentId === list.id)
                            .sort((a, b) => (a.order < b.order ? -1 : 1))}
                    />
                ))}
            </main>
        </div>
    )
}

function ListSection({
    list,
    tasks,
    index,
}: {
    list: List
    tasks: Task[]
    index: number
}) {
    return (
        <section
            className="animate-fade-up"
            style={{
                marginBottom: '2.75rem',
                animationDelay: `${index * 60}ms`,
            }}
        >
            {/* Chapter header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.75rem',
                    marginBottom: '0.85rem',
                }}
            >
                <span
                    style={{
                        display: 'block',
                        width: 24,
                        height: 1,
                        background: 'var(--color-amber)',
                        flexShrink: 0,
                        position: 'relative',
                        top: '-3px',
                    }}
                />
                <h2
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        margin: 0,
                        letterSpacing: '0.01em',
                    }}
                >
                    {list.name}
                </h2>
                <span
                    style={{
                        fontSize: '0.7rem',
                        color: 'var(--color-text-muted)',
                        fontStyle: 'italic',
                        marginLeft: 'auto',
                        flexShrink: 0,
                    }}
                >
                    {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
                </span>
            </div>

            {/* Task list with left rule */}
            <div
                style={{
                    borderLeft: '1px solid var(--color-border)',
                    paddingLeft: '1.25rem',
                    marginLeft: '0.5rem',
                }}
            >
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} />
                    ))}
                </ul>
            </div>
        </section>
    )
}

function TaskRow({ task }: { task: Task }) {
    const [hovered, setHovered] = useState(false)

    return (
        <li
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '0.3rem 0',
                color: hovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.55,
                transition: 'color 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
            }}
        >
            <span
                style={{
                    display: 'inline-block',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: hovered ? 'var(--color-amber)' : 'var(--color-border-strong)',
                    flexShrink: 0,
                    transition: 'background 0.15s ease',
                }}
            />
            {task.text}
        </li>
    )
}


import { generateNKeysBetween, generateKeyBetween } from 'fractional-indexing'

type List = { id: string; name: string; order: string }
type Task = { id: string; text: string; parentId: string; order: string }

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

    const tasks: Task[] = seedTasks.map(([listIdx, text]) => ({
        id: uid(),
        text,
        parentId: lists[listIdx].id,
        order: generateKeyBetween(null, null),
    }))

    return { lists, tasks }
}

const SEED = seedData()

export default function App() {
    const lists = SEED.lists
    const tasks = SEED.tasks
    const sortedLists = [...lists].sort((a, b) => (a.order < b.order ? -1 : 1))

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-page)' }}>
            <header
                style={{
                    borderBottom: '1px solid var(--color-border)',
                    padding: '14px 32px',
                    background: 'var(--color-bar-bg)',
                }}
            >
                <span
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--color-title)',
                        letterSpacing: '-0.01em',
                    }}
                >
                    SimpleGTD
                </span>
            </header>

            <main
                style={{
                    maxWidth: 480,
                    margin: '0 auto',
                    padding: '48px 32px 80px',
                }}
            >
                {sortedLists.map((list) => (
                    <ListSection
                        key={list.id}
                        list={list}
                        tasks={tasks
                            .filter((t) => t.parentId === list.id)
                            .sort((a, b) => (a.order < b.order ? -1 : 1))}
                    />
                ))}
            </main>
        </div>
    )
}

function ListSection({ list, tasks }: { list: List; tasks: Task[] }) {
    return (
        <div style={{ marginBottom: 36 }}>
            <p
                style={{
                    margin: '0 0 8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-section)',
                }}
            >
                {list.name}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {tasks.map((task) => (
                    <li
                        key={task.id}
                        style={{
                            padding: '5px 0',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '15px',
                            fontWeight: 400,
                            color: 'var(--color-task)',
                            lineHeight: 1.5,
                            borderBottom: '1px solid var(--color-border)',
                        }}
                    >
                        {task.text}
                    </li>
                ))}
            </ul>
        </div>
    )
}

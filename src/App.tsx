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
        <div className="min-h-screen bg-page">
            <header className="border-b border-border">
                <div className="mx-auto flex max-w-2xl items-baseline justify-between px-6 py-5">
                    <span className="font-display text-xl font-bold tracking-tight text-title">
                        Simple<span className="italic text-[dodgerblue]">GTD</span>
                    </span>
                    <span className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-section">
                        {new Date().toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-6 pt-12 pb-24">
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
        <section className="mb-14">
            <div className="mb-4 flex items-baseline gap-3">
                <h2 className="font-display text-[26px] font-bold leading-none tracking-tight text-title">
                    {list.name}
                </h2>
                <span className="font-sans text-sm font-semibold tabular-nums text-[dodgerblue]">
                    {tasks.length}
                </span>
            </div>

            <ul className="m-0 list-none p-0">
                {tasks.map((task) => (
                    <li
                        key={task.id}
                        className="group flex items-center gap-4 border-b border-border py-3"
                    >
                        <span
                            aria-hidden
                            className="h-[18px] w-[18px] flex-none rounded-full border-2 border-[#c8c2b6] transition-colors group-hover:border-[dodgerblue]"
                        />
                        <span className="font-sans text-[17px] leading-snug text-task">
                            {task.text}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

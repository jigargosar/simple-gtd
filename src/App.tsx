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
        <div>
            <header className="border-b border-gray-200 px-6 py-4">
                <h1 className="text-base font-semibold text-gray-900">SimpleGTD</h1>
            </header>
            <div className="mx-auto max-w-lg px-6 py-12">
            {sortedLists.map((list) => (
                <ListSection
                    key={list.id}
                    list={list}
                    tasks={tasks
                        .filter((t) => t.parentId === list.id)
                        .sort((a, b) => (a.order < b.order ? -1 : 1))}
                />
            ))}
            </div>
        </div>
    )
}

function ListSection({ list, tasks }: { list: List; tasks: Task[] }) {
    return (
        <div className="mb-10">
            <h2 className="mb-3 text-base font-semibold tracking-wide text-gray-900">{list.name}</h2>
            <ul className="space-y-2 pl-4">
                {tasks.map((task) => (
                    <li key={task.id} className="text-sm text-gray-600">
                        {task.text}
                    </li>
                ))}
            </ul>
        </div>
    )
}

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
            <header className="border-b border-gray-100 px-8 py-3">
                <span className="text-sm font-medium text-gray-400 tracking-widest uppercase">SimpleGTD</span>
            </header>
            <div className="mx-auto max-w-md px-8 py-10">
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
        <div className="mb-8">
            <p className="mb-1.5 text-xs font-medium tracking-widest text-gray-400 uppercase">{list.name}</p>
            <ul className="space-y-1.5">
                {tasks.map((task) => (
                    <li key={task.id} className="text-sm text-gray-800">
                        {task.text}
                    </li>
                ))}
            </ul>
        </div>
    )
}

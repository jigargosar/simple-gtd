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

const LISTS: TaskList[] = [
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

export default function App() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="border-b border-gray-200 bg-white px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight">SimpleGTD</h1>
            </header>

            <main className="mx-auto max-w-2xl px-6 py-10 space-y-10">
                {LISTS.map(list => (
                    <section key={list.id} className="group/section">
                        <div className="relative ml-8">
                            <div className="absolute -left-8 top-0 h-full w-8 flex flex-col items-center justify-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
                                <button className="cursor-grab text-gray-300 hover:text-gray-500">
                                    <DragHandle />
                                </button>
                                <button className="text-gray-300 hover:text-gray-500 text-base leading-none">
                                    +
                                </button>
                            </div>
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                                {list.title}
                            </h2>
                        </div>
                        <div className="ml-8 space-y-2">
                            {list.tasks.map(task => (
                                <div key={task.id} className="group/task relative">
                                    <div className="absolute -left-8 top-0 h-full w-8 flex flex-col items-center justify-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                        <button className="cursor-grab text-gray-300 hover:text-gray-500">
                                            <DragHandle />
                                        </button>
                                        <button className="text-gray-300 hover:text-gray-500 text-base leading-none">
                                            +
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                                        <span className={`flex-1 text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {task.title}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                ))}
            </main>
        </div>
    )
}

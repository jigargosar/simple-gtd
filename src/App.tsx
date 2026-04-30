type Task = {
    id: number
    title: string
    done: boolean
}

const TASKS: Task[] = [
    { id: 1, title: 'Review project requirements', done: false },
    { id: 2, title: 'Set up development environment', done: true },
    { id: 3, title: 'Write unit tests for auth module', done: false },
    { id: 4, title: 'Schedule team standup', done: false },
    { id: 5, title: 'Deploy staging release', done: true },
]

export default function App() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="border-b border-gray-200 bg-white px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight">SimpleGTD</h1>
            </header>

            <main className="mx-auto max-w-2xl px-6 py-10">
                <ul className="space-y-2">
                    {TASKS.map(task => (
                        <li
                            key={task.id}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
                        >
                            <span className={`flex-1 text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {task.title}
                            </span>
                            {task.done && (
                                <span className="text-xs text-gray-400">Done</span>
                            )}
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    )
}

import { useState } from 'react'
import { generateKeyBetween } from 'fractional-indexing'

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

function lastOrder<T extends { order: string }>(items: T[]): string | null {
    if (items.length === 0) return null
    return [...items].sort((a, b) => (a.order < b.order ? -1 : 1)).at(-1)!.order
}

export default function App() {
    const [lists, setLists] = useState<List[]>([])
    const [tasks, setTasks] = useState<Task[]>([])

    const sortedLists = [...lists].sort((a, b) => (a.order < b.order ? -1 : 1))

    function addList(name: string) {
        const order = generateKeyBetween(lastOrder(lists), null)
        setLists((prev) => [...prev, { id: uid(), name, order }])
    }

    function addTask(parentId: string, text: string) {
        const parentTasks = tasks.filter((t) => t.parentId === parentId)
        const order = generateKeyBetween(lastOrder(parentTasks), null)
        setTasks((prev) => [...prev, { id: uid(), text, parentId, order }])
    }

    return (
        <div className="mx-auto max-w-xl px-4 py-8">
            {sortedLists.map((list) => (
                <ListSection
                    key={list.id}
                    list={list}
                    tasks={tasks
                        .filter((t) => t.parentId === list.id)
                        .sort((a, b) => (a.order < b.order ? -1 : 1))}
                    onAddTask={(text) => addTask(list.id, text)}
                />
            ))}
            <AddRow placeholder="New list…" onAdd={addList} />
        </div>
    )
}

function ListSection({
    list,
    tasks,
    onAddTask,
}: {
    list: List
    tasks: Task[]
    onAddTask: (text: string) => void
}) {
    return (
        <div className="mb-8">
            <h2 className="mb-2 font-display text-lg text-text-primary">{list.name}</h2>
            <ul className="mb-1 space-y-1">
                {tasks.map((task) => (
                    <li key={task.id} className="text-text-secondary">
                        {task.text}
                    </li>
                ))}
            </ul>
            <AddRow placeholder="New item…" onAdd={onAddTask} />
        </div>
    )
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (value: string) => void }) {
    const [value, setValue] = useState('')

    function submit() {
        const trimmed = value.trim()
        if (!trimmed) return
        onAdd(trimmed)
        setValue('')
    }

    return (
        <input
            className="w-full bg-transparent text-text-muted placeholder-text-muted outline-none"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
    )
}

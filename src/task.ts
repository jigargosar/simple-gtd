import { v4 as uuidv4 } from 'uuid'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

export type TaskId = string
export type TaskTitle = string
export type TaskOrder = string

export type Task = {
    readonly id: TaskId
    readonly title: TaskTitle
    readonly done: boolean
    readonly order: TaskOrder
}

function make(title: TaskTitle, order: TaskOrder, done = false): Task {
    return { id: uuidv4(), title, done, order }
}

function makeMany(seeds: ReadonlyArray<{ title: string; done?: boolean }>): Task[] {
    const orders = generateNKeysBetween(null, null, seeds.length)
    return seeds.map((s, i) => make(s.title, orders[i], s.done))
}

function addNew(
    list: readonly Task[],
    afterId: TaskId | null,
): { tasks: Task[]; newTaskId: TaskId } | null {
    const afterIndex = afterId === null ? -1 : list.findIndex((t) => t.id === afterId)
    const insertAt = afterIndex + 1
    try {
        const order = generateKeyBetween(
            list[insertAt - 1]?.order ?? null,
            list[insertAt]?.order ?? null,
        )
        const newTask = make('', order)
        return {
            tasks: [...list.slice(0, insertAt), newTask, ...list.slice(insertAt)],
            newTaskId: newTask.id,
        }
    } catch {
        return null
    }
}

function updateTitle(list: readonly Task[], taskId: TaskId, title: TaskTitle): Task[] {
    const trimmed = title.trim()
    return trimmed
        ? list.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t))
        : list.filter((t) => t.id !== taskId)
}

function removeIfBlank(list: readonly Task[], taskId: TaskId): Task[] {
    return list.filter((t) => t.id !== taskId || t.title.trim() !== '')
}

function toggleDone(list: readonly Task[], taskId: TaskId): Task[] {
    return list.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
}

export const Task = { makeMany, addNew, updateTitle, removeIfBlank, toggleDone }

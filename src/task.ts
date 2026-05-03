import { v4 as uuidv4 } from 'uuid'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'
import type { SectionId } from './section'

export type TaskId = string

export type Task = {
    readonly id: TaskId
    readonly sectionId: SectionId
    readonly title: string
    readonly done: boolean
    readonly order: string
}

function make(sectionId: SectionId, title: string, order: string, done = false): Task {
    return { id: uuidv4(), sectionId, title, done, order }
}

function makeMany(
    sectionId: SectionId,
    seeds: ReadonlyArray<{ title: string; done?: boolean }>,
): Task[] {
    const orders = generateNKeysBetween(null, null, seeds.length)
    return seeds.map((s, i) => make(sectionId, s.title, orders[i], s.done))
}

function forSection(tasks: readonly Task[], sectionId: SectionId): Task[] {
    return tasks
        .filter((t) => t.sectionId === sectionId)
        .sort((a, b) => (a.order < b.order ? -1 : 1))
}

function addNew(
    tasks: readonly Task[],
    sectionId: SectionId,
    afterId: TaskId | null,
): { tasks: Task[]; newTaskId: TaskId } {
    const section = forSection(tasks, sectionId)
    const i = afterId === null ? -1 : section.findIndex((t) => t.id === afterId)
    const order = generateKeyBetween(
        section[i]?.order ?? null,
        section[i + 1]?.order ?? null,
    )
    const newTask = make(sectionId, '', order)
    return { tasks: [...tasks, newTask], newTaskId: newTask.id }
}

function updateTitle(tasks: readonly Task[], taskId: TaskId, title: string): Task[] {
    const trimmed = title.trim()
    return trimmed
        ? tasks.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t))
        : tasks.filter((t) => t.id !== taskId)
}

function removeIfBlank(tasks: readonly Task[], taskId: TaskId): Task[] {
    return tasks.filter((t) => t.id !== taskId || t.title.trim() !== '')
}

function toggleDone(tasks: readonly Task[], taskId: TaskId): Task[] {
    return tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
}

function move(
    tasks: readonly Task[],
    taskId: TaskId,
    targetSectionId: SectionId,
    beforeId: TaskId | null,
    afterId: TaskId | null,
): Task[] {
    const others = forSection(tasks, targetSectionId).filter((t) => t.id !== taskId)
    const orderOf = (id: TaskId | null) =>
        id === null ? null : (others.find((t) => t.id === id)?.order ?? null)
    const order = generateKeyBetween(orderOf(beforeId), orderOf(afterId))
    return tasks.map((t) =>
        t.id === taskId ? { ...t, sectionId: targetSectionId, order } : t,
    )
}

export const Task = {
    makeMany,
    forSection,
    addNew,
    updateTitle,
    removeIfBlank,
    toggleDone,
    move,
}

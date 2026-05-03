import { v4 as uuidv4 } from 'uuid'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'
import type { SectionId } from './section'

export type TaskId = string
export type TaskTitle = string
export type TaskOrder = string

export type Task = {
    readonly id: TaskId
    readonly sectionId: SectionId
    readonly title: TaskTitle
    readonly done: boolean
    readonly order: TaskOrder
}

function make(sectionId: SectionId, title: TaskTitle, order: TaskOrder, done = false): Task {
    return { id: uuidv4(), sectionId, title, done, order }
}

function makeMany(sectionId: SectionId, seeds: ReadonlyArray<{ title: string; done?: boolean }>): Task[] {
    const orders = generateNKeysBetween(null, null, seeds.length)
    return seeds.map((s, i) => make(sectionId, s.title, orders[i], s.done))
}

function addNew(
    list: readonly Task[],
    sectionId: SectionId,
    afterId: TaskId | null,
): { tasks: Task[]; newTaskId: TaskId } {
    const afterIndex = afterId === null ? -1 : list.findIndex((t) => t.id === afterId)
    const insertAt = afterIndex + 1
    const order = generateKeyBetween(
        list[insertAt - 1]?.order ?? null,
        list[insertAt]?.order ?? null,
    )
    const newTask = make(sectionId, '', order)
    return {
        tasks: [...list.slice(0, insertAt), newTask, ...list.slice(insertAt)],
        newTaskId: newTask.id,
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

function forSection(tasks: readonly Task[], sectionId: SectionId): Task[] {
    return tasks
        .filter((t) => t.sectionId === sectionId)
        .sort((a, b) => (a.order < b.order ? -1 : 1))
}

function replaceForSection(tasks: readonly Task[], sectionId: SectionId, updated: Task[]): Task[] {
    return [...tasks.filter((t) => t.sectionId !== sectionId), ...updated]
}

function move(
    tasks: readonly Task[],
    taskId: TaskId,
    targetSectionId: SectionId,
    beforeId: TaskId | null,
    afterId: TaskId | null,
): Task[] {
    const targetTasks = forSection(tasks, targetSectionId).filter((t) => t.id !== taskId)
    const beforeOrder = beforeId !== null ? (targetTasks.find((t) => t.id === beforeId)?.order ?? null) : null
    const afterOrder = afterId !== null ? (targetTasks.find((t) => t.id === afterId)?.order ?? null) : null
    const order = generateKeyBetween(beforeOrder, afterOrder)
    return tasks.map((t) => (t.id === taskId ? { ...t, sectionId: targetSectionId, order } : t))
}

export const Task = { makeMany, addNew, updateTitle, removeIfBlank, toggleDone, forSection, replaceForSection, move }

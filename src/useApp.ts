import { v4 as uuidv4 } from 'uuid'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

// Types

export type TaskId = string
export type SectionId = string

export type Task = {
    readonly id: TaskId
    readonly sectionId: SectionId
    readonly title: string
    readonly done: boolean
    readonly order: string
}

export type Section = {
    readonly id: SectionId
    readonly title: string
    readonly order: string
}

type Editing =
    | { tag: 'task'; taskId: TaskId }
    | { tag: 'section'; sectionId: SectionId }

type State = {
    readonly sections: readonly Section[]
    readonly tasks: readonly Task[]
    readonly editing: Editing | null
}

export type DropResult = {
    taskId: TaskId
    sourceSectionId: SectionId
    targetSectionId: SectionId
    beforeId: TaskId | null
    afterId: TaskId | null
}

// Tasks

function makeTask(
    sectionId: SectionId,
    title: string,
    order: string,
    done = false,
): Task {
    return { id: uuidv4(), sectionId, title, done, order }
}

const makeTasks = (
    sectionId: SectionId,
    seeds: ReadonlyArray<{ title: string; done?: boolean }>,
): Task[] => {
    const orders = generateNKeysBetween(null, null, seeds.length)
    return seeds.map((s, i) => makeTask(sectionId, s.title, orders[i], s.done))
}

const tasksInSection = (tasks: readonly Task[], sectionId: SectionId): Task[] =>
    tasks
        .filter((t) => t.sectionId === sectionId)
        .sort((a, b) => (a.order < b.order ? -1 : 1))

const addNewTask = (
    tasks: readonly Task[],
    sectionId: SectionId,
    afterId: TaskId | null,
): { tasks: Task[]; newTaskId: TaskId } => {
    const section = tasksInSection(tasks, sectionId)
    const i = afterId === null ? -1 : section.findIndex((t) => t.id === afterId)
    const order = generateKeyBetween(
        section[i]?.order ?? null,
        section[i + 1]?.order ?? null,
    )
    const newTask = makeTask(sectionId, '', order)
    return { tasks: [...tasks, newTask], newTaskId: newTask.id }
}

const moveTaskInList = (
    tasks: readonly Task[],
    taskId: TaskId,
    targetSectionId: SectionId,
    beforeId: TaskId | null,
    afterId: TaskId | null,
): Task[] => {
    const others = tasksInSection(tasks, targetSectionId).filter((t) => t.id !== taskId)
    const orderOf = (id: TaskId | null) =>
        id === null ? null : (others.find((t) => t.id === id)?.order ?? null)
    const order = generateKeyBetween(orderOf(beforeId), orderOf(afterId))
    return tasks.map((t) =>
        t.id === taskId ? { ...t, sectionId: targetSectionId, order } : t,
    )
}

// Sections

function makeSection(title: string, order: string): Section {
    return { id: uuidv4(), title, order }
}

const makeSections = (seeds: ReadonlyArray<{ title: string }>): Section[] => {
    const orders = generateNKeysBetween(null, null, seeds.length)
    return seeds.map((s, i) => makeSection(s.title, orders[i]))
}

// Shared

const updateTitleOrRemove = <T extends { id: string; title: string }>(
    items: readonly T[],
    id: string,
    title: string,
): T[] => {
    const trimmed = title.trim()
    return trimmed
        ? items.map((item) => (item.id === id ? { ...item, title: trimmed } : item))
        : items.filter((item) => item.id !== id)
}

const removeIfBlank = <T extends { id: string; title: string }>(
    items: readonly T[],
    id: string,
): T[] => items.filter((item) => item.id !== id || item.title.trim() !== '')

// Store

export const useApp = create<State>()(
    persist(() => buildSeed(), {
        name: 'simple-gtd:v5',
        partialize: (s) => ({ sections: s.sections, tasks: s.tasks }),
    }),
)

// Actions

const mapTasks = (fn: (t: Task) => Task) =>
    useApp.setState((s) => ({ tasks: s.tasks.map(fn) }))

const updateTaskWithId = (taskId: TaskId, fn: (t: Task) => Task) =>
    mapTasks((t) => (t.id === taskId ? fn(t) : t))

const setEditing = (editing: Editing | null) => useApp.setState({ editing })

export const addTask = (sectionId: SectionId, afterId: TaskId | null) =>
    useApp.setState((s) => {
        const { tasks, newTaskId } = addNewTask(s.tasks, sectionId, afterId)
        return { tasks, editing: { tag: 'task', taskId: newTaskId } }
    })

export const startEditTask = (taskId: TaskId) =>
    setEditing({ tag: 'task', taskId })

export const commitEditTask = (taskId: TaskId, title: string) =>
    useApp.setState((s) => ({
        tasks: updateTitleOrRemove(s.tasks, taskId, title),
        editing: null,
    }))

export const cancelEditTask = (taskId: TaskId) =>
    useApp.setState((s) => ({
        tasks: removeIfBlank(s.tasks, taskId),
        editing: null,
    }))

export const toggleDone = (taskId: TaskId) =>
    updateTaskWithId(taskId, (t) => ({ ...t, done: !t.done }))

export const moveTask = (drop: DropResult) =>
    useApp.setState((s) => ({
        tasks: moveTaskInList(
            s.tasks,
            drop.taskId,
            drop.targetSectionId,
            drop.beforeId,
            drop.afterId,
        ),
    }))

export const startEditSection = (sectionId: SectionId) =>
    setEditing({ tag: 'section', sectionId })

export const commitEditSection = (sectionId: SectionId, title: string) =>
    useApp.setState((s) => ({
        sections: updateTitleOrRemove(s.sections, sectionId, title),
        editing: null,
    }))

export const cancelEditSection = (sectionId: SectionId) =>
    useApp.setState((s) => ({
        sections: removeIfBlank(s.sections, sectionId),
        editing: null,
    }))

// View-side hooks

export const useTasksIn = (sectionId: SectionId) =>
    useApp(useShallow((s) => tasksInSection(s.tasks, sectionId)))

export const useIsEditingTask = (taskId: TaskId) =>
    useApp((s) => s.editing?.tag === 'task' && s.editing.taskId === taskId)

export const useIsEditingSection = (sectionId: SectionId) =>
    useApp((s) => s.editing?.tag === 'section' && s.editing.sectionId === sectionId)

// Seed

function buildSeed(): State {
    const SEED: ReadonlyArray<{
        title: string
        tasks: ReadonlyArray<{ title: string; done?: boolean }>
    }> = [
        {
            title: 'Inbox',
            tasks: [
                { title: 'Read article on deep work' },
                { title: "Reply to Sarah's email" },
                { title: 'Look into new invoicing tool' },
            ],
        },
        {
            title: 'Next Actions',
            tasks: [
                { title: 'Write project proposal' },
                { title: 'Book dentist appointment', done: true },
                { title: 'Review pull request #42' },
            ],
        },
        {
            title: 'Projects',
            tasks: [
                { title: 'Launch SimpleGTD v1' },
                { title: 'Migrate database to Postgres' },
                { title: 'Redesign onboarding flow', done: true },
            ],
        },
        {
            title: 'Waiting For',
            tasks: [
                { title: 'Contract signature from client' },
                { title: 'Design assets from Priya' },
            ],
        },
        {
            title: 'Someday / Maybe',
            tasks: [
                { title: 'Learn Rust' },
                { title: 'Build a keyboard' },
                { title: 'Read Thinking Fast and Slow' },
            ],
        },
    ]

    const sections = makeSections(SEED)
    const tasks = sections.flatMap((s, i) => makeTasks(s.id, SEED[i].tasks))
    return { sections, tasks, editing: null }
}

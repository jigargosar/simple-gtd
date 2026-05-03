import { v4 as uuidv4 } from 'uuid'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================================
// Types
// ============================================================

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

export type Editing =
    | { tag: 'task'; taskId: TaskId }
    | { tag: 'section'; sectionId: SectionId }

export type App = {
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

// ============================================================
// Task
// ============================================================

function makeTask(
    sectionId: SectionId,
    title: string,
    order: string,
    done = false,
): Task {
    return { id: uuidv4(), sectionId, title, done, order }
}

export const Task = {
    makeMany(
        sectionId: SectionId,
        seeds: ReadonlyArray<{ title: string; done?: boolean }>,
    ): Task[] {
        const orders = generateNKeysBetween(null, null, seeds.length)
        return seeds.map((s, i) => makeTask(sectionId, s.title, orders[i], s.done))
    },

    forSection(tasks: readonly Task[], sectionId: SectionId): Task[] {
        return tasks
            .filter((t) => t.sectionId === sectionId)
            .sort((a, b) => (a.order < b.order ? -1 : 1))
    },

    addNew(
        tasks: readonly Task[],
        sectionId: SectionId,
        afterId: TaskId | null,
    ): { tasks: Task[]; newTaskId: TaskId } {
        const section = Task.forSection(tasks, sectionId)
        const i = afterId === null ? -1 : section.findIndex((t) => t.id === afterId)
        const order = generateKeyBetween(
            section[i]?.order ?? null,
            section[i + 1]?.order ?? null,
        )
        const newTask = makeTask(sectionId, '', order)
        return { tasks: [...tasks, newTask], newTaskId: newTask.id }
    },

    updateTitle(tasks: readonly Task[], taskId: TaskId, title: string): Task[] {
        const trimmed = title.trim()
        return trimmed
            ? tasks.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t))
            : tasks.filter((t) => t.id !== taskId)
    },

    removeIfBlank(tasks: readonly Task[], taskId: TaskId): Task[] {
        return tasks.filter((t) => t.id !== taskId || t.title.trim() !== '')
    },

    toggleDone(tasks: readonly Task[], taskId: TaskId): Task[] {
        return tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    },

    move(
        tasks: readonly Task[],
        taskId: TaskId,
        targetSectionId: SectionId,
        beforeId: TaskId | null,
        afterId: TaskId | null,
    ): Task[] {
        const others = Task.forSection(tasks, targetSectionId).filter(
            (t) => t.id !== taskId,
        )
        const orderOf = (id: TaskId | null) =>
            id === null ? null : (others.find((t) => t.id === id)?.order ?? null)
        const order = generateKeyBetween(orderOf(beforeId), orderOf(afterId))
        return tasks.map((t) =>
            t.id === taskId ? { ...t, sectionId: targetSectionId, order } : t,
        )
    },
}

// ============================================================
// Section
// ============================================================

function makeSection(title: string, order: string): Section {
    return { id: uuidv4(), title, order }
}

export const Section = {
    makeMany(seeds: ReadonlyArray<{ title: string }>): Section[] {
        const orders = generateNKeysBetween(null, null, seeds.length)
        return seeds.map((s, i) => makeSection(s.title, orders[i]))
    },

    updateTitle(
        sections: readonly Section[],
        sectionId: SectionId,
        title: string,
    ): Section[] {
        const trimmed = title.trim()
        return trimmed
            ? sections.map((s) => (s.id === sectionId ? { ...s, title: trimmed } : s))
            : sections.filter((s) => s.id !== sectionId)
    },

    removeIfBlank(sections: readonly Section[], sectionId: SectionId): Section[] {
        return sections.filter((s) => s.id !== sectionId || s.title.trim() !== '')
    },
}

// ============================================================
// App (model)
// ============================================================

const STORAGE_KEY = 'simple-gtd:v4'

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

function buildSeed(): App {
    const sections = Section.makeMany(SEED)
    const tasks = sections.flatMap((s, i) => Task.makeMany(s.id, SEED[i].tasks))
    return { sections, tasks, editing: null }
}

export const App = {
    load(): App {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            // TODO: validate parsed shape before casting
            if (raw !== null) return JSON.parse(raw) as App
        } catch {
            // fall through to seed
        }
        return buildSeed()
    },

    save(app: App): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(app))
        } catch {
            // ignore quota / privacy mode errors
        }
    },

    tasksIn(app: App, sectionId: SectionId): Task[] {
        return Task.forSection(app.tasks, sectionId)
    },

    addTask(app: App, sectionId: SectionId, afterId: TaskId | null): App {
        const { tasks, newTaskId } = Task.addNew(app.tasks, sectionId, afterId)
        return { ...app, tasks, editing: { tag: 'task', taskId: newTaskId } }
    },

    startEditTask(app: App, taskId: TaskId): App {
        return { ...app, editing: { tag: 'task', taskId } }
    },

    commitEditTask(app: App, taskId: TaskId, title: string): App {
        return {
            ...app,
            tasks: Task.updateTitle(app.tasks, taskId, title),
            editing: null,
        }
    },

    cancelEditTask(app: App, taskId: TaskId): App {
        return { ...app, tasks: Task.removeIfBlank(app.tasks, taskId), editing: null }
    },

    toggleDone(app: App, taskId: TaskId): App {
        return { ...app, tasks: Task.toggleDone(app.tasks, taskId) }
    },

    moveTask(app: App, drop: DropResult): App {
        return {
            ...app,
            tasks: Task.move(
                app.tasks,
                drop.taskId,
                drop.targetSectionId,
                drop.beforeId,
                drop.afterId,
            ),
        }
    },

    startEditSection(app: App, sectionId: SectionId): App {
        return { ...app, editing: { tag: 'section', sectionId } }
    },

    commitEditSection(app: App, sectionId: SectionId, title: string): App {
        return {
            ...app,
            sections: Section.updateTitle(app.sections, sectionId, title),
            editing: null,
        }
    },

    cancelEditSection(app: App, sectionId: SectionId): App {
        return {
            ...app,
            sections: Section.removeIfBlank(app.sections, sectionId),
            editing: null,
        }
    },

    isEditingTask(app: App, taskId: TaskId): boolean {
        return app.editing?.tag === 'task' && app.editing.taskId === taskId
    },

    isEditingSection(app: App, sectionId: SectionId): boolean {
        return app.editing?.tag === 'section' && app.editing.sectionId === sectionId
    },
}

// ============================================================
// Store
// ============================================================

type Actions = {
    addTask: (sectionId: SectionId, afterId: TaskId | null) => void
    startEditTask: (taskId: TaskId) => void
    commitEditTask: (taskId: TaskId, title: string) => void
    cancelEditTask: (taskId: TaskId) => void
    toggleDone: (taskId: TaskId) => void
    moveTask: (drop: DropResult) => void
    startEditSection: (sectionId: SectionId) => void
    commitEditSection: (sectionId: SectionId, title: string) => void
    cancelEditSection: (sectionId: SectionId) => void
}

type AppStore = App & { actions: Actions }

let saveTimer: ReturnType<typeof setTimeout> | undefined

function applyAndSave(
    set: (fn: (s: AppStore) => AppStore) => void,
    fn: (a: App) => App,
) {
    set((s) => {
        const next = fn(s)
        clearTimeout(saveTimer)
        saveTimer = setTimeout(() => App.save(next), 100)
        return { ...s, ...next }
    })
}

export const useAppStore = create<AppStore>()(
    devtools(
        (set) => {
            const apply = (fn: (a: App) => App) => applyAndSave(set, fn)
            return {
                ...App.load(),
                actions: {
                    addTask: (sectionId, afterId) =>
                        apply((a) => App.addTask(a, sectionId, afterId)),
                    startEditTask: (taskId) => apply((a) => App.startEditTask(a, taskId)),
                    commitEditTask: (taskId, title) =>
                        apply((a) => App.commitEditTask(a, taskId, title)),
                    cancelEditTask: (taskId) =>
                        apply((a) => App.cancelEditTask(a, taskId)),
                    toggleDone: (taskId) => apply((a) => App.toggleDone(a, taskId)),
                    moveTask: (drop) => apply((a) => App.moveTask(a, drop)),
                    startEditSection: (sectionId) =>
                        apply((a) => App.startEditSection(a, sectionId)),
                    commitEditSection: (sectionId, title) =>
                        apply((a) => App.commitEditSection(a, sectionId, title)),
                    cancelEditSection: (sectionId) =>
                        apply((a) => App.cancelEditSection(a, sectionId)),
                },
            }
        },
        { name: 'app' },
    ),
)

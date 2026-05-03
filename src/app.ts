import { Task } from './task'
import { Section } from './section'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType, SectionId } from './section'
import type { DropResult } from './useDrag'

export type EditingTask = { tag: 'task'; sectionId: SectionId; taskId: TaskId }
export type EditingSection = { tag: 'section'; sectionId: SectionId }
export type Editing = EditingTask | EditingSection

export type App = {
    readonly sections: readonly SectionType[]
    readonly tasks: readonly TaskType[]
    readonly editing: Editing | null
}

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
    const tasks = sections.flatMap((section, i) =>
        Task.makeMany(section.id, SEED[i].tasks),
    )
    return { sections, tasks, editing: null }
}

function load(): App {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        // TODO: validate parsed shape before casting — corrupt/old-schema data will blow up downstream
        if (raw !== null) return JSON.parse(raw) as App
    } catch {
        // fall through to seed
    }
    return buildSeed()
}

function save(app: App): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(app))
    } catch {
        // ignore quota / privacy mode errors
    }
}

function tasksIn(app: App, sectionId: SectionId): TaskType[] {
    return Task.forSection(app.tasks, sectionId)
}

function withTasks(app: App, sectionId: SectionId, updated: TaskType[]): App {
    return { ...app, tasks: Task.replaceForSection(app.tasks, sectionId, updated) }
}

function startEditTask(app: App, sectionId: SectionId, taskId: TaskId): App {
    return { ...app, editing: { tag: 'task', sectionId, taskId } }
}

function addTask(app: App, sectionId: SectionId, afterId: TaskId | null): App {
    const result = Task.addNew(tasksIn(app, sectionId), sectionId, afterId)
    return {
        ...withTasks(app, sectionId, result.tasks),
        editing: { tag: 'task', sectionId, taskId: result.newTaskId },
    }
}

function commitEditTask(
    app: App,
    sectionId: SectionId,
    taskId: TaskId,
    title: string,
): App {
    return {
        ...withTasks(
            app,
            sectionId,
            Task.updateTitle(tasksIn(app, sectionId), taskId, title),
        ),
        editing: null,
    }
}

function cancelEditTask(app: App, sectionId: SectionId, taskId: TaskId): App {
    return {
        ...withTasks(
            app,
            sectionId,
            Task.removeIfBlank(tasksIn(app, sectionId), taskId),
        ),
        editing: null,
    }
}

function toggleDone(app: App, sectionId: SectionId, taskId: TaskId): App {
    return withTasks(app, sectionId, Task.toggleDone(tasksIn(app, sectionId), taskId))
}

function startEditSection(app: App, sectionId: SectionId): App {
    return { ...app, editing: { tag: 'section', sectionId } }
}

function commitEditSection(app: App, sectionId: SectionId, title: string): App {
    return {
        ...app,
        sections: Section.updateTitle(app.sections, sectionId, title),
        editing: null,
    }
}

function cancelEditSection(app: App, sectionId: SectionId): App {
    return {
        ...app,
        sections: Section.removeIfBlank(app.sections, sectionId),
        editing: null,
    }
}

function moveTask(app: App, drop: DropResult): App {
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
}

function isEditingTask(app: App, sectionId: SectionId, taskId: TaskId): boolean {
    return (
        app.editing?.tag === 'task' &&
        app.editing.sectionId === sectionId &&
        app.editing.taskId === taskId
    )
}

function isEditingSection(app: App, sectionId: SectionId): boolean {
    return app.editing?.tag === 'section' && app.editing.sectionId === sectionId
}

export const App = {
    load,
    save,
    tasksIn,
    startEditTask,
    addTask,
    commitEditTask,
    cancelEditTask,
    toggleDone,
    moveTask,
    startEditSection,
    commitEditSection,
    cancelEditSection,
    isEditingTask,
    isEditingSection,
}

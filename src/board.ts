import { Task } from './task'
import { Section } from './section'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType, SectionId } from './section'

export type EditingTask = { sectionId: SectionId; taskId: TaskId }

export type Board = {
    readonly sections: readonly SectionType[]
    readonly tasks: readonly TaskType[]
    readonly editing: EditingTask | null
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

function buildSeedBoard(): Board {
    const sections = Section.makeMany(SEED)
    const tasks = sections.flatMap((section, i) => Task.makeMany(section.id, SEED[i].tasks))
    return { sections, tasks, editing: null }
}

function load(): Board {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        // TODO: validate parsed shape before casting — corrupt/old-schema data will blow up downstream
        if (raw !== null) return JSON.parse(raw) as Board
    } catch {
        // fall through to seed
    }
    return buildSeedBoard()
}

function save(board: Board): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
    } catch {
        // ignore quota / privacy mode errors
    }
}

function tasksIn(board: Board, sectionId: SectionId): TaskType[] {
    return board.tasks
        .filter((t) => t.sectionId === sectionId)
        .sort((a, b) => (a.order < b.order ? -1 : 1))
}

function replaceTasks(board: Board, sectionId: SectionId, updated: TaskType[]): Board {
    return {
        ...board,
        tasks: [...board.tasks.filter((t) => t.sectionId !== sectionId), ...updated],
    }
}

function startEdit(board: Board, sectionId: SectionId, taskId: TaskId): Board {
    return { ...board, editing: { sectionId, taskId } }
}

function addTask(board: Board, sectionId: SectionId, afterId: TaskId | null): Board {
    const result = Task.addNew(tasksIn(board, sectionId), sectionId, afterId)
    return { ...replaceTasks(board, sectionId, result.tasks), editing: { sectionId, taskId: result.newTaskId } }
}

function commitEdit(board: Board, sectionId: SectionId, taskId: TaskId, title: string): Board {
    return { ...replaceTasks(board, sectionId, Task.updateTitle(tasksIn(board, sectionId), taskId, title)), editing: null }
}

function cancelEdit(board: Board, sectionId: SectionId, taskId: TaskId): Board {
    return { ...replaceTasks(board, sectionId, Task.removeIfBlank(tasksIn(board, sectionId), taskId)), editing: null }
}

function toggleDone(board: Board, sectionId: SectionId, taskId: TaskId): Board {
    return replaceTasks(board, sectionId, Task.toggleDone(tasksIn(board, sectionId), taskId))
}

export const Board = { load, save, tasksIn, startEdit, addTask, commitEdit, cancelEdit, toggleDone }

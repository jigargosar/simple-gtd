import { Task } from './task'
import { Section } from './section'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType, SectionId } from './section'

export type TasksBySection = Record<SectionId, TaskType[]>

export type Board = {
    readonly sections: readonly SectionType[]
    readonly tasksBySection: TasksBySection
}

export type EditingTask = { sectionId: SectionId; taskId: TaskId }

const STORAGE_KEY = 'simple-gtd:v3'

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
    const tasksBySection: TasksBySection = {}
    for (let i = 0; i < sections.length; i++) {
        tasksBySection[sections[i].id] = Task.makeMany(SEED[i].tasks)
    }
    return { sections, tasksBySection }
}

export const Board = {
    load(): Board {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw !== null) return JSON.parse(raw) as Board
        } catch {
            // fall through to seed
        }
        return buildSeedBoard()
    },

    save(board: Board): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
        } catch {
            // ignore quota / privacy mode errors
        }
    },

    tasksIn(board: Board, sectionId: SectionId): TaskType[] {
        return board.tasksBySection[sectionId] ?? []
    },

    updateTasks(board: Board, sectionId: SectionId, tasks: TaskType[]): Board {
        return {
            ...board,
            tasksBySection: { ...board.tasksBySection, [sectionId]: tasks },
        }
    },
}

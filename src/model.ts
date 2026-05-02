import { v4 as uuidv4 } from 'uuid'

export type Task = {
    id: string
    title: string
    done: boolean
}

export type Section = {
    id: string
    title: string
}

export type BoardState = {
    sections: Section[]
    tasksBySection: Record<string, Task[]>
}

export const STORAGE_KEY = 'simple-gtd:v2'

const S_INBOX = uuidv4()
const S_NEXT = uuidv4()
const S_PROJECTS = uuidv4()
const S_WAITING = uuidv4()
const S_SOMEDAY = uuidv4()

const INITIAL_SECTIONS: Section[] = [
    { id: S_INBOX, title: 'Inbox' },
    { id: S_NEXT, title: 'Next Actions' },
    { id: S_PROJECTS, title: 'Projects' },
    { id: S_WAITING, title: 'Waiting For' },
    { id: S_SOMEDAY, title: 'Someday / Maybe' },
]

const INITIAL_TASKS_BY_SECTION: Record<string, Task[]> = {
    [S_INBOX]: [
        { id: uuidv4(), title: 'Read article on deep work', done: false },
        { id: uuidv4(), title: "Reply to Sarah's email", done: false },
        { id: uuidv4(), title: 'Look into new invoicing tool', done: false },
    ],
    [S_NEXT]: [
        { id: uuidv4(), title: 'Write project proposal', done: false },
        { id: uuidv4(), title: 'Book dentist appointment', done: true },
        { id: uuidv4(), title: 'Review pull request #42', done: false },
    ],
    [S_PROJECTS]: [
        { id: uuidv4(), title: 'Launch SimpleGTD v1', done: false },
        { id: uuidv4(), title: 'Migrate database to Postgres', done: false },
        { id: uuidv4(), title: 'Redesign onboarding flow', done: true },
    ],
    [S_WAITING]: [
        { id: uuidv4(), title: 'Contract signature from client', done: false },
        { id: uuidv4(), title: 'Design assets from Priya', done: false },
    ],
    [S_SOMEDAY]: [
        { id: uuidv4(), title: 'Learn Rust', done: false },
        { id: uuidv4(), title: 'Build a keyboard', done: false },
        { id: uuidv4(), title: 'Read Thinking Fast and Slow', done: false },
    ],
}

function isTask(v: unknown): v is Task {
    return (
        v !== null &&
        typeof v === 'object' &&
        'id' in v &&
        typeof v.id === 'string' &&
        'title' in v &&
        typeof v.title === 'string' &&
        'done' in v &&
        typeof v.done === 'boolean'
    )
}

function isSection(v: unknown): v is Section {
    return (
        v !== null &&
        typeof v === 'object' &&
        'id' in v &&
        typeof v.id === 'string' &&
        'title' in v &&
        typeof v.title === 'string'
    )
}

function isBoardState(v: unknown): v is BoardState {
    if (v === null || typeof v !== 'object') return false
    if (!('sections' in v) || !('tasksBySection' in v)) return false
    const { sections, tasksBySection } = v
    if (!Array.isArray(sections) || !sections.every(isSection)) return false
    if (tasksBySection === null || typeof tasksBySection !== 'object') return false
    return Object.values(tasksBySection).every(
        (list) => Array.isArray(list) && list.every(isTask),
    )
}

export function loadInitialBoard(): BoardState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed: unknown = JSON.parse(raw)
            if (isBoardState(parsed)) return parsed
        }
    } catch {
        // ignore parse / storage errors
    }
    return {
        sections: INITIAL_SECTIONS,
        tasksBySection: INITIAL_TASKS_BY_SECTION,
    }
}

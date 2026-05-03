import { Task } from './task'
import { Section } from './section'
import type { Task as TaskType, TaskId } from './task'
import type { Section as SectionType, SectionId } from './section'
import type { DropResult } from './useDrag'

export type EditingTask = { tag: 'task'; sectionId: SectionId; taskId: TaskId }
export type EditingSection = { tag: 'section'; sectionId: SectionId }
export type Editing = EditingTask | EditingSection

export type Board = {
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

function buildSeedBoard(): Board {
    const sections = Section.makeMany(SEED)
    const tasks = sections.flatMap((section, i) =>
        Task.makeMany(section.id, SEED[i].tasks),
    )
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
    return Task.forSection(board.tasks, sectionId)
}

function withTasks(board: Board, sectionId: SectionId, updated: TaskType[]): Board {
    return { ...board, tasks: Task.replaceForSection(board.tasks, sectionId, updated) }
}

// task editing

function startEditTask(board: Board, sectionId: SectionId, taskId: TaskId): Board {
    return { ...board, editing: { tag: 'task', sectionId, taskId } }
}

function addTask(board: Board, sectionId: SectionId, afterId: TaskId | null): Board {
    const result = Task.addNew(tasksIn(board, sectionId), sectionId, afterId)
    return {
        ...withTasks(board, sectionId, result.tasks),
        editing: { tag: 'task', sectionId, taskId: result.newTaskId },
    }
}

function commitEditTask(
    board: Board,
    sectionId: SectionId,
    taskId: TaskId,
    title: string,
): Board {
    return {
        ...withTasks(
            board,
            sectionId,
            Task.updateTitle(tasksIn(board, sectionId), taskId, title),
        ),
        editing: null,
    }
}

function cancelEditTask(board: Board, sectionId: SectionId, taskId: TaskId): Board {
    return {
        ...withTasks(
            board,
            sectionId,
            Task.removeIfBlank(tasksIn(board, sectionId), taskId),
        ),
        editing: null,
    }
}

function toggleDone(board: Board, sectionId: SectionId, taskId: TaskId): Board {
    return withTasks(board, sectionId, Task.toggleDone(tasksIn(board, sectionId), taskId))
}

// section editing

function startEditSection(board: Board, sectionId: SectionId): Board {
    return { ...board, editing: { tag: 'section', sectionId } }
}

function commitEditSection(board: Board, sectionId: SectionId, title: string): Board {
    return {
        ...board,
        sections: Section.updateTitle(board.sections, sectionId, title),
        editing: null,
    }
}

function cancelEditSection(board: Board, sectionId: SectionId): Board {
    return {
        ...board,
        sections: Section.removeIfBlank(board.sections, sectionId),
        editing: null,
    }
}

function moveTask(board: Board, drop: DropResult): Board {
    return {
        ...board,
        tasks: Task.move(
            board.tasks,
            drop.taskId,
            drop.targetSectionId,
            drop.beforeId,
            drop.afterId,
        ),
    }
}

function isEditingTask(board: Board, sectionId: SectionId, taskId: TaskId): boolean {
    return (
        board.editing?.tag === 'task' &&
        board.editing.sectionId === sectionId &&
        board.editing.taskId === taskId
    )
}

function isEditingSection(board: Board, sectionId: SectionId): boolean {
    return board.editing?.tag === 'section' && board.editing.sectionId === sectionId
}

export const Board = {
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

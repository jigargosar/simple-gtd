import { Option } from 'effect'
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Task, type TaskId, type MaybeTaskId } from './task'
import { Section, type SectionId } from './section'

export type { TaskId, MaybeTaskId, SectionId }
export { Task, Section }

type TasksBySection = Record<SectionId, Task[]>

type BoardState = {
    readonly sections: readonly Section[]
    readonly tasksBySection: TasksBySection
}

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

function buildInitialBoard(): BoardState {
    const sections = Section.makeMany(SEED)
    const tasksBySection: TasksBySection = {}
    for (let i = 0; i < sections.length; i++) {
        tasksBySection[sections[i].id] = Task.makeMany(SEED[i].tasks)
    }
    return { sections, tasksBySection }
}

const INITIAL_BOARD: BoardState = buildInitialBoard()

function loadInitialBoard(): BoardState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) return INITIAL_BOARD
        return JSON.parse(raw) as BoardState
    } catch {
        return INITIAL_BOARD
    }
}

function saveBoard(board: BoardState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
    } catch {
        // ignore quota / privacy mode errors
    }
}

type Editing = { sectionId: SectionId; taskId: TaskId }

type BoardModel = {
    sections: readonly Section[]
    tasksIn: (sectionId: SectionId) => readonly Task[]
    isEditing: (task: Task) => boolean

    addTask: (sectionId: SectionId, afterId: MaybeTaskId) => void
    startEdit: (sectionId: SectionId, task: Task) => void
    commitEdit: (sectionId: SectionId, task: Task, title: string) => void
    cancelEdit: () => void
    toggleDone: (sectionId: SectionId, task: Task) => void
}

const BoardContext = createContext<BoardModel | null>(null)

export function BoardProvider({ children }: { children: ReactNode }) {
    const [board, setBoard] = useState<BoardState>(loadInitialBoard)
    const [editing, setEditing] = useState<Option.Option<Editing>>(Option.none())

    useEffect(() => {
        const timer = setTimeout(() => saveBoard(board), 100)
        return () => clearTimeout(timer)
    }, [board])

    const tasksIn = (sectionId: SectionId): Task[] =>
        Option.getOrElse(Option.fromNullable(board.tasksBySection[sectionId]), () => [])

    const updateTasks = (sectionId: SectionId, tasks: Task[]): BoardState => ({
        ...board,
        tasksBySection: { ...board.tasksBySection, [sectionId]: tasks },
    })

    const model: BoardModel = {
        sections: board.sections,
        tasksIn,

        isEditing: (task) =>
            Option.match(editing, {
                onNone: () => false,
                onSome: (e) => e.taskId === task.id,
            }),

        addTask: (sectionId, afterId) => {
            Option.match(Task.insert(tasksIn(sectionId), afterId), {
                onNone: () => {},
                onSome: ({ tasks, newTaskId }) => {
                    setBoard(updateTasks(sectionId, tasks))
                    setEditing(Option.some({ sectionId, taskId: newTaskId }))
                },
            })
        },

        startEdit: (sectionId, task) => {
            setEditing(Option.some({ sectionId, taskId: task.id }))
        },

        commitEdit: (sectionId, task, title) => {
            setBoard((prev) => ({
                ...prev,
                tasksBySection: {
                    ...prev.tasksBySection,
                    [sectionId]: Task.updateTitle(tasksIn(sectionId), task.id, title),
                },
            }))
            setEditing(Option.none())
        },

        cancelEdit: () => {
            Option.match(editing, {
                onNone: () => {},
                onSome: ({ sectionId, taskId }) => {
                    setBoard((prev) => ({
                        ...prev,
                        tasksBySection: {
                            ...prev.tasksBySection,
                            [sectionId]: Task.removeIfEmpty(tasksIn(sectionId), taskId),
                        },
                    }))
                    setEditing(Option.none())
                },
            })
        },

        toggleDone: (sectionId, task) => {
            setBoard(updateTasks(sectionId, Task.toggleDone(tasksIn(sectionId), task.id)))
        },
    }

    return <BoardContext.Provider value={model}>{children}</BoardContext.Provider>
}

export function useBoard() {
    const m = useContext(BoardContext)
    if (m === null) throw new Error('useBoard must be used within BoardProvider')
    return m
}

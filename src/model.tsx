import { Schema, Effect } from 'effect'
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

export const Id = Schema.String.pipe(Schema.brand('Id'))
export const Title = Schema.String.pipe(Schema.brand('Title'))
export const Order = Schema.String.pipe(Schema.brand('Order'))

export type Id = Schema.Schema.Type<typeof Id>
export type Title = Schema.Schema.Type<typeof Title>
export type Order = Schema.Schema.Type<typeof Order>

export const Task = Schema.Struct({
    id: Id,
    title: Title,
    done: Schema.Boolean,
    order: Order,
})

export const Section = Schema.Struct({
    id: Id,
    title: Title,
    order: Order,
})

export const BoardState = Schema.Struct({
    sections: Schema.Array(Section),
    tasksBySection: Schema.Record({ key: Id, value: Schema.Array(Task) }),
})

export type Task = Schema.Schema.Type<typeof Task>
export type Section = Schema.Schema.Type<typeof Section>
export type BoardState = Schema.Schema.Type<typeof BoardState>

export const STORAGE_KEY = 'simple-gtd:v3'

export function makeId(): Id {
    return Id.make(uuidv4())
}

export function makeTitle(t: string): Title {
    return Title.make(t)
}

export function makeOrder(o: string): Order {
    return Order.make(o)
}

export function orderBetween(prev: Order | null, next: Order | null): Order {
    return Order.make(generateKeyBetween(prev, next))
}

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
    const sectionOrders = generateNKeysBetween(null, null, SEED.length)
    const sections: Section[] = []
    const tasksBySection: Record<Id, Task[]> = {} as Record<Id, Task[]>

    for (let i = 0; i < SEED.length; i++) {
        const s = SEED[i]
        const sectionId = makeId()
        sections.push({
            id: sectionId,
            title: makeTitle(s.title),
            order: makeOrder(sectionOrders[i]),
        })
        const taskOrders = generateNKeysBetween(null, null, s.tasks.length)
        tasksBySection[sectionId] = s.tasks.map((t, j) => ({
            id: makeId(),
            title: makeTitle(t.title),
            done: t.done ?? false,
            order: makeOrder(taskOrders[j]),
        }))
    }

    return { sections, tasksBySection }
}

const INITIAL_BOARD: BoardState = buildInitialBoard()

const BoardStateJson = Schema.parseJson(BoardState)

const loadBoardProgram = Effect.try(() => localStorage.getItem(STORAGE_KEY)).pipe(
    Effect.flatMap(Effect.fromNullable),
    Effect.flatMap(Schema.decode(BoardStateJson)),
    Effect.orElseSucceed(() => INITIAL_BOARD),
)

function loadInitialBoard(): BoardState {
    return Effect.runSync(loadBoardProgram)
}

type Editing = { sectionId: Id; taskId: Id }

type BoardModel = {
    sections: readonly Section[]
    tasksIn: (sectionId: Id) => readonly Task[]
    isEditing: (taskId: Id) => boolean

    addTask: (sectionId: Id, afterIndex?: number) => void
    startEdit: (sectionId: Id, taskId: Id) => void
    commitEdit: (sectionId: Id, taskId: Id, title: string) => void
    cancelEdit: () => void
    toggleDone: (sectionId: Id, taskId: Id) => void
}

const BoardContext = createContext<BoardModel | null>(null)

export function BoardProvider({ children }: { children: ReactNode }) {
    const [board, setBoard] = useState<BoardState>(loadInitialBoard)
    const [editing, setEditing] = useState<Editing | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
            } catch {
                // ignore quota / privacy mode errors
            }
        }, 100)
        return () => clearTimeout(timer)
    }, [board])

    const model: BoardModel = {
        sections: board.sections,
        tasksIn: (sectionId) => board.tasksBySection[sectionId] ?? [],
        isEditing: (taskId) => editing?.taskId === taskId,

        addTask: (sectionId, afterIndex) => {
            const newTaskId = makeId()
            setBoard((prev) => {
                const list = prev.tasksBySection[sectionId] ?? []
                const insertAt = afterIndex === undefined ? list.length : afterIndex + 1
                const newTask: Task = {
                    id: newTaskId,
                    title: makeTitle(''),
                    done: false,
                    order: orderBetween(
                        list[insertAt - 1]?.order ?? null,
                        list[insertAt]?.order ?? null,
                    ),
                }
                return {
                    ...prev,
                    tasksBySection: {
                        ...prev.tasksBySection,
                        [sectionId]: [
                            ...list.slice(0, insertAt),
                            newTask,
                            ...list.slice(insertAt),
                        ],
                    },
                }
            })
            setEditing({ sectionId, taskId: newTaskId })
        },

        startEdit: (sectionId, taskId) => {
            setEditing({ sectionId, taskId })
        },

        commitEdit: (sectionId, taskId, title) => {
            const trimmed = title.trim()
            setBoard((prev) => {
                const list = prev.tasksBySection[sectionId] ?? []
                const nextList = trimmed
                    ? list.map((t) =>
                          t.id === taskId ? { ...t, title: makeTitle(trimmed) } : t,
                      )
                    : list.filter((t) => t.id !== taskId)
                return {
                    ...prev,
                    tasksBySection: { ...prev.tasksBySection, [sectionId]: nextList },
                }
            })
            setEditing(null)
        },

        cancelEdit: () => {
            if (editing === null) return
            const { sectionId, taskId } = editing
            setBoard((prev) => {
                const list = prev.tasksBySection[sectionId] ?? []
                const task = list.find((t) => t.id === taskId)
                if (!task || task.title.trim() !== '') return prev
                return {
                    ...prev,
                    tasksBySection: {
                        ...prev.tasksBySection,
                        [sectionId]: list.filter((t) => t.id !== taskId),
                    },
                }
            })
            setEditing(null)
        },

        toggleDone: (sectionId, taskId) => {
            setBoard((prev) => {
                const list = prev.tasksBySection[sectionId] ?? []
                return {
                    ...prev,
                    tasksBySection: {
                        ...prev.tasksBySection,
                        [sectionId]: list.map((t) =>
                            t.id === taskId ? { ...t, done: !t.done } : t,
                        ),
                    },
                }
            })
        },
    }

    return <BoardContext.Provider value={model}>{children}</BoardContext.Provider>
}

export function useBoard() {
    const m = useContext(BoardContext)
    if (m === null) throw new Error('useBoard must be used within BoardProvider')
    return m
}

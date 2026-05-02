import { Schema, Effect } from 'effect'
import { useEffect, useState } from 'react'
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

const SEED: ReadonlyArray<{ title: string; tasks: ReadonlyArray<{ title: string; done?: boolean }> }> = [
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
        sections.push({ id: sectionId, title: makeTitle(s.title), order: makeOrder(sectionOrders[i]) })
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

export function loadInitialBoard(): BoardState {
    return Effect.runSync(loadBoardProgram)
}

export function findSectionId(board: BoardState, taskId: Id): Id | undefined {
    for (const [sid, list] of Object.entries(board.tasksBySection)) {
        if (list.some((t) => t.id === taskId)) return sid as Id
    }
    return undefined
}

export function withTaskAdded(board: BoardState, sectionId: Id, afterIndex?: number): { board: BoardState; newTaskId: Id } {
    const newTaskId = makeId()
    const list = board.tasksBySection[sectionId] ?? []
    const insertAt = afterIndex === undefined ? list.length : afterIndex + 1
    const newTask: Task = {
        id: newTaskId,
        title: makeTitle(''),
        done: false,
        order: orderBetween(list[insertAt - 1]?.order ?? null, list[insertAt]?.order ?? null),
    }
    const next = [...list.slice(0, insertAt), newTask, ...list.slice(insertAt)]
    return {
        board: { ...board, tasksBySection: { ...board.tasksBySection, [sectionId]: next } },
        newTaskId,
    }
}

export function withEditCommitted(board: BoardState, taskId: Id, title: string): BoardState {
    const trimmed = title.trim()
    const sid = findSectionId(board, taskId)
    if (sid === undefined) return board
    const list = board.tasksBySection[sid] ?? []
    const nextList = trimmed
        ? list.map((t) => (t.id === taskId ? { ...t, title: makeTitle(trimmed) } : t))
        : list.filter((t) => t.id !== taskId)
    return { ...board, tasksBySection: { ...board.tasksBySection, [sid]: nextList } }
}

export function withEditCancelled(board: BoardState, taskId: Id): BoardState {
    const sid = findSectionId(board, taskId)
    if (sid === undefined) return board
    const task = (board.tasksBySection[sid] ?? []).find((t) => t.id === taskId)
    if (!task || task.title.trim() !== '') return board
    return {
        ...board,
        tasksBySection: {
            ...board.tasksBySection,
            [sid]: (board.tasksBySection[sid] ?? []).filter((t) => t.id !== taskId),
        },
    }
}

export function withDoneToggled(board: BoardState, taskId: Id): BoardState {
    const sid = findSectionId(board, taskId)
    if (sid === undefined) return board
    return {
        ...board,
        tasksBySection: {
            ...board.tasksBySection,
            [sid]: (board.tasksBySection[sid] ?? []).map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t,
            ),
        },
    }
}

export function useBoardState() {
    const [board, setBoard] = useState<BoardState>(loadInitialBoard)
    const [editingId, setEditingId] = useState<Id | null>(null)

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

    function startEdit(taskId: Id) {
        setEditingId(taskId)
    }

    function addTask(sectionId: Id, afterIndex?: number) {
        const { board: next, newTaskId } = withTaskAdded(board, sectionId, afterIndex)
        setBoard(next)
        setEditingId(newTaskId)
    }

    function commitEdit(taskId: Id, title: string) {
        setBoard((prev) => withEditCommitted(prev, taskId, title))
        setEditingId(null)
    }

    function cancelEdit() {
        if (editingId !== null) setBoard((prev) => withEditCancelled(prev, editingId))
        setEditingId(null)
    }

    function toggleDone(taskId: Id) {
        setBoard((prev) => withDoneToggled(prev, taskId))
    }

    return { board, editingId, startEdit, addTask, commitEdit, cancelEdit, toggleDone }
}

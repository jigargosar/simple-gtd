import { Schema, Effect } from 'effect'
import { v4 as uuidv4 } from 'uuid'

export const Id = Schema.String.pipe(Schema.brand('Id'))
export const Title = Schema.String.pipe(Schema.brand('Title'))

export type Id = Schema.Schema.Type<typeof Id>
export type Title = Schema.Schema.Type<typeof Title>

export const Task = Schema.Struct({
    id: Id,
    title: Title,
    done: Schema.Boolean,
})

export const Section = Schema.Struct({
    id: Id,
    title: Title,
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
    const sections: Section[] = []
    const tasksBySection: Record<Id, Task[]> = {} as Record<Id, Task[]>

    for (const s of SEED) {
        const sectionId = makeId()
        sections.push({ id: sectionId, title: makeTitle(s.title) })
        tasksBySection[sectionId] = s.tasks.map((t) => ({
            id: makeId(),
            title: makeTitle(t.title),
            done: t.done ?? false,
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

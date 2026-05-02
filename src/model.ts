import { Schema, Either } from 'effect'
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

export const STORAGE_KEY = 'simple-gtd:v2'

export function makeId(): Id {
    return Id.make(uuidv4())
}

export function makeTitle(t: string): Title {
    return Title.make(t)
}

const S_INBOX = makeId()
const S_NEXT = makeId()
const S_PROJECTS = makeId()
const S_WAITING = makeId()
const S_SOMEDAY = makeId()

const INITIAL_SECTIONS: readonly Section[] = [
    { id: S_INBOX, title: makeTitle('Inbox') },
    { id: S_NEXT, title: makeTitle('Next Actions') },
    { id: S_PROJECTS, title: makeTitle('Projects') },
    { id: S_WAITING, title: makeTitle('Waiting For') },
    { id: S_SOMEDAY, title: makeTitle('Someday / Maybe') },
]

const INITIAL_TASKS_BY_SECTION: Readonly<Record<Id, readonly Task[]>> = {
    [S_INBOX]: [
        { id: makeId(), title: makeTitle('Read article on deep work'), done: false },
        { id: makeId(), title: makeTitle("Reply to Sarah's email"), done: false },
        { id: makeId(), title: makeTitle('Look into new invoicing tool'), done: false },
    ],
    [S_NEXT]: [
        { id: makeId(), title: makeTitle('Write project proposal'), done: false },
        { id: makeId(), title: makeTitle('Book dentist appointment'), done: true },
        { id: makeId(), title: makeTitle('Review pull request #42'), done: false },
    ],
    [S_PROJECTS]: [
        { id: makeId(), title: makeTitle('Launch SimpleGTD v1'), done: false },
        { id: makeId(), title: makeTitle('Migrate database to Postgres'), done: false },
        { id: makeId(), title: makeTitle('Redesign onboarding flow'), done: true },
    ],
    [S_WAITING]: [
        { id: makeId(), title: makeTitle('Contract signature from client'), done: false },
        { id: makeId(), title: makeTitle('Design assets from Priya'), done: false },
    ],
    [S_SOMEDAY]: [
        { id: makeId(), title: makeTitle('Learn Rust'), done: false },
        { id: makeId(), title: makeTitle('Build a keyboard'), done: false },
        { id: makeId(), title: makeTitle('Read Thinking Fast and Slow'), done: false },
    ],
}

const INITIAL_BOARD: BoardState = {
    sections: INITIAL_SECTIONS,
    tasksBySection: INITIAL_TASKS_BY_SECTION,
}

export function loadInitialBoard(): BoardState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed: unknown = JSON.parse(raw)
            const result = Schema.decodeUnknownEither(BoardState)(parsed)
            if (Either.isRight(result)) return result.right
        }
    } catch {
        // ignore parse / storage errors
    }
    return INITIAL_BOARD
}

import { v4 as uuidv4 } from 'uuid'
import { generateNKeysBetween } from 'fractional-indexing'

export type SectionId = string
export type SectionTitle = string
export type SectionOrder = string

export type Section = {
    readonly id: SectionId
    readonly title: SectionTitle
    readonly order: SectionOrder
}

function make(title: SectionTitle, order: SectionOrder): Section {
    return { id: uuidv4(), title, order }
}

function makeMany(seeds: ReadonlyArray<{ title: string }>): Section[] {
    const orders = generateNKeysBetween(null, null, seeds.length)
    return seeds.map((s, i) => make(s.title, orders[i]))
}

export const Section = { makeMany }

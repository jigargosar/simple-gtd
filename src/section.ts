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

function updateTitle(sections: readonly Section[], sectionId: SectionId, title: SectionTitle): Section[] {
    const trimmed = title.trim()
    return trimmed
        ? sections.map((s) => (s.id === sectionId ? { ...s, title: trimmed } : s))
        : sections.filter((s) => s.id !== sectionId)
}

function removeIfBlank(sections: readonly Section[], sectionId: SectionId): Section[] {
    return sections.filter((s) => s.id !== sectionId || s.title.trim() !== '')
}

export const Section = { makeMany, updateTitle, removeIfBlank }

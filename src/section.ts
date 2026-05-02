import { Option } from 'effect'
import { v4 as uuidv4 } from 'uuid'
import { nKeysBetween } from './fractional-ordering'

export type SectionId = string
export type SectionTitle = string
export type SectionOrder = string

export type Section = {
    readonly id: SectionId
    readonly title: SectionTitle
    readonly order: SectionOrder
}

function makeSection(title: SectionTitle, order: SectionOrder): Section {
    return { id: uuidv4(), title, order }
}

export const Section = {
    makeMany(seeds: ReadonlyArray<{ title: string }>): Option.Option<Section[]> {
        return Option.map(
            nKeysBetween<SectionOrder>(Option.none(), Option.none(), seeds.length),
            (orders) => seeds.map((s, i) => makeSection(s.title, orders[i])),
        )
    },
}

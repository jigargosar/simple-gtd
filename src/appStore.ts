import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { App } from './app'
import type { App as AppType } from './app'
import type { SectionId } from './section'
import type { TaskId } from './task'
import type { DropResult } from './useDrag'

type AppActions = {
    actions: {
        addTask: (sectionId: SectionId, afterId: TaskId | null) => void
        startEditTask: (sectionId: SectionId, taskId: TaskId) => void
        commitEditTask: (sectionId: SectionId, taskId: TaskId, title: string) => void
        cancelEditTask: (sectionId: SectionId, taskId: TaskId) => void
        toggleDone: (sectionId: SectionId, taskId: TaskId) => void
        moveTask: (drop: DropResult) => void
        startEditSection: (sectionId: SectionId) => void
        commitEditSection: (sectionId: SectionId, title: string) => void
        cancelEditSection: (sectionId: SectionId) => void
    }
}

type AppStore = AppType & AppActions

let saveTimer: ReturnType<typeof setTimeout> | undefined

function applyAndSave(
    set: (fn: (s: AppStore) => AppStore) => void,
    fn: (a: AppType) => AppType,
) {
    set((s) => {
        const next = fn(s)
        clearTimeout(saveTimer)
        saveTimer = setTimeout(() => App.save(next), 100)
        return { ...s, ...next }
    })
}

export const useAppStore = create<AppStore>()(
    devtools(
        (set) => ({
            ...App.load(),

            actions: {
                addTask: (sectionId, afterId) =>
                    applyAndSave(set, (a) => App.addTask(a, sectionId, afterId)),
                startEditTask: (sectionId, taskId) =>
                    applyAndSave(set, (a) => App.startEditTask(a, sectionId, taskId)),
                commitEditTask: (sectionId, taskId, title) =>
                    applyAndSave(set, (a) =>
                        App.commitEditTask(a, sectionId, taskId, title),
                    ),
                cancelEditTask: (sectionId, taskId) =>
                    applyAndSave(set, (a) => App.cancelEditTask(a, sectionId, taskId)),
                toggleDone: (sectionId, taskId) =>
                    applyAndSave(set, (a) => App.toggleDone(a, sectionId, taskId)),
                moveTask: (drop) => applyAndSave(set, (a) => App.moveTask(a, drop)),
                startEditSection: (sectionId) =>
                    applyAndSave(set, (a) => App.startEditSection(a, sectionId)),
                commitEditSection: (sectionId, title) =>
                    applyAndSave(set, (a) =>
                        App.commitEditSection(a, sectionId, title),
                    ),
                cancelEditSection: (sectionId) =>
                    applyAndSave(set, (a) => App.cancelEditSection(a, sectionId)),
            },
        }),
        { name: 'app' },
    ),
)

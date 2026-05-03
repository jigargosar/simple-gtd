import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { App } from './app'
import type { App as AppType, DropResult } from './app'
import type { SectionId } from './section'
import type { TaskId } from './task'

type Actions = {
    addTask: (sectionId: SectionId, afterId: TaskId | null) => void
    startEditTask: (taskId: TaskId) => void
    commitEditTask: (taskId: TaskId, title: string) => void
    cancelEditTask: (taskId: TaskId) => void
    toggleDone: (taskId: TaskId) => void
    moveTask: (drop: DropResult) => void
    startEditSection: (sectionId: SectionId) => void
    commitEditSection: (sectionId: SectionId, title: string) => void
    cancelEditSection: (sectionId: SectionId) => void
}

type AppStore = AppType & { actions: Actions }

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
        (set) => {
            const apply = (fn: (a: AppType) => AppType) => applyAndSave(set, fn)
            return {
                ...App.load(),
                actions: {
                    addTask: (sectionId, afterId) =>
                        apply((a) => App.addTask(a, sectionId, afterId)),
                    startEditTask: (taskId) => apply((a) => App.startEditTask(a, taskId)),
                    commitEditTask: (taskId, title) =>
                        apply((a) => App.commitEditTask(a, taskId, title)),
                    cancelEditTask: (taskId) =>
                        apply((a) => App.cancelEditTask(a, taskId)),
                    toggleDone: (taskId) => apply((a) => App.toggleDone(a, taskId)),
                    moveTask: (drop) => apply((a) => App.moveTask(a, drop)),
                    startEditSection: (sectionId) =>
                        apply((a) => App.startEditSection(a, sectionId)),
                    commitEditSection: (sectionId, title) =>
                        apply((a) => App.commitEditSection(a, sectionId, title)),
                    cancelEditSection: (sectionId) =>
                        apply((a) => App.cancelEditSection(a, sectionId)),
                },
            }
        },
        { name: 'app' },
    ),
)

import { create } from 'zustand'
import { Board } from './board'
import type { Board as BoardType } from './board'
import type { SectionId } from './section'
import type { TaskId } from './task'
import type { DropResult } from './useDrag'

type BoardStore = BoardType & {
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

function applyAndSave(set: (fn: (s: BoardStore) => BoardStore) => void, fn: (b: BoardType) => BoardType) {
    set((s) => {
        const next = fn(s)
        // debounced save — fire-and-forget
        clearTimeout((applyAndSave as { _timer?: ReturnType<typeof setTimeout> })._timer)
        ;(applyAndSave as { _timer?: ReturnType<typeof setTimeout> })._timer = setTimeout(
            () => Board.save(next),
            100,
        )
        return { ...s, ...next }
    })
}

export const useBoardStore = create<BoardStore>((set) => ({
    ...Board.load(),

    addTask: (sectionId, afterId) => applyAndSave(set, (b) => Board.addTask(b, sectionId, afterId)),
    startEditTask: (sectionId, taskId) => applyAndSave(set, (b) => Board.startEditTask(b, sectionId, taskId)),
    commitEditTask: (sectionId, taskId, title) => applyAndSave(set, (b) => Board.commitEditTask(b, sectionId, taskId, title)),
    cancelEditTask: (sectionId, taskId) => applyAndSave(set, (b) => Board.cancelEditTask(b, sectionId, taskId)),
    toggleDone: (sectionId, taskId) => applyAndSave(set, (b) => Board.toggleDone(b, sectionId, taskId)),
    moveTask: (drop) => applyAndSave(set, (b) => Board.moveTask(b, drop)),
    startEditSection: (sectionId) => applyAndSave(set, (b) => Board.startEditSection(b, sectionId)),
    commitEditSection: (sectionId, title) => applyAndSave(set, (b) => Board.commitEditSection(b, sectionId, title)),
    cancelEditSection: (sectionId) => applyAndSave(set, (b) => Board.cancelEditSection(b, sectionId)),
}))

import { useEffect, useState } from 'react'
import { Board } from './board'
import type { Board as BoardType } from './board'
import type { SectionId } from './section'
import type { TaskId } from './task'
import type { DropResult } from './useDrag'

type BoardActions = {
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

export function useBoard(): { board: BoardType; actions: BoardActions } {
    const [board, setBoard] = useState<BoardType>(() => Board.load())

    useEffect(() => {
        const timer = setTimeout(() => Board.save(board), 100)
        return () => clearTimeout(timer)
    }, [board])

    const actions: BoardActions = {
        addTask: (sectionId, afterId) => setBoard((b) => Board.addTask(b, sectionId, afterId)),
        startEditTask: (sectionId, taskId) => setBoard((b) => Board.startEditTask(b, sectionId, taskId)),
        commitEditTask: (sectionId, taskId, title) => setBoard((b) => Board.commitEditTask(b, sectionId, taskId, title)),
        cancelEditTask: (sectionId, taskId) => setBoard((b) => Board.cancelEditTask(b, sectionId, taskId)),
        toggleDone: (sectionId, taskId) => setBoard((b) => Board.toggleDone(b, sectionId, taskId)),
        moveTask: (drop) => setBoard((b) => Board.moveTask(b, drop)),
        startEditSection: (sectionId) => setBoard((b) => Board.startEditSection(b, sectionId)),
        commitEditSection: (sectionId, title) => setBoard((b) => Board.commitEditSection(b, sectionId, title)),
        cancelEditSection: (sectionId) => setBoard((b) => Board.cancelEditSection(b, sectionId)),
    }

    return { board, actions }
}

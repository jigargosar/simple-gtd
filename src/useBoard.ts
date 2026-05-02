import { useEffect, useState } from 'react'
import { Board } from './board'
import type { Board as BoardType } from './board'
import type { SectionId } from './section'
import type { TaskId } from './task'

type BoardActions = {
    addTask: (sectionId: SectionId, afterId: TaskId | null) => void
    startEdit: (sectionId: SectionId, taskId: TaskId) => void
    commitEdit: (sectionId: SectionId, taskId: TaskId, title: string) => void
    cancelEdit: (sectionId: SectionId, taskId: TaskId) => void
    toggleDone: (sectionId: SectionId, taskId: TaskId) => void
}

export function useBoard(): { board: BoardType; actions: BoardActions } {
    const [board, setBoard] = useState<BoardType>(() => Board.load())

    useEffect(() => {
        const timer = setTimeout(() => Board.save(board), 100)
        return () => clearTimeout(timer)
    }, [board])

    const actions: BoardActions = {
        addTask: (sectionId, afterId) => setBoard((b) => Board.addTask(b, sectionId, afterId)),
        startEdit: (sectionId, taskId) => setBoard((b) => Board.startEdit(b, sectionId, taskId)),
        commitEdit: (sectionId, taskId, title) => setBoard((b) => Board.commitEdit(b, sectionId, taskId, title)),
        cancelEdit: (sectionId, taskId) => setBoard((b) => Board.cancelEdit(b, sectionId, taskId)),
        toggleDone: (sectionId, taskId) => setBoard((b) => Board.toggleDone(b, sectionId, taskId)),
    }

    return { board, actions }
}

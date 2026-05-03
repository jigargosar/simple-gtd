import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Board from './Board.tsx'

const root = document.getElementById('root')
if (root) {
    createRoot(root).render(
        <StrictMode>
            <Board />
        </StrictMode>,
    )
}

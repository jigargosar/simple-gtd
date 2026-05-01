# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start Vite dev server
pnpm build        # tsc -b && vite build
pnpm lint         # eslint .
pnpm preview      # preview production build
```

No test runner is configured. There are no test files.

## Architecture

SimpleGTD is a client-side React SPA implementing the Getting Things Done methodology — no backend, no routing, no persistence layer.

**Stack:** React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, Motion (drag-and-drop), Babel React Compiler.

**Entry:** `src/main.tsx` → `src/App.tsx`

**Component tree:**
```
App
└── TaskBoard
    └── Reorder.Group (sections are draggable)
        └── SortableSection[]  (Inbox / Next Actions / Projects / Waiting / Someday-Maybe)
            └── Reorder.Group (tasks within a section are draggable)
                └── SortableTask[]
```

**Data model:** `Task { id, title, done }` and `TaskList { id, title, tasks[] }`. Initial state is hardcoded; there is no persistence.

**State:** Managed entirely in `App` via `useState`. The `handleReorderTasks` callback is threaded down to `SortableSection`.

**Formatting:** Prettier with 4-space indent, 90-char line width, single quotes, no semicolons, Tailwind class sorting (prettier-plugin-tailwindcss). Run `pnpm prettier --write .` to format.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
pnpm dev                 # Vite dev server
pnpm build               # tsc -b && vite build
pnpm lint                # eslint .
pnpm preview             # serve production build
pnpm prettier --write .  # format (no script alias)
```

No test runner is configured. There are no test files.

## Stack

React 19 + TypeScript ~6.0 (strict), Vite 8, Tailwind CSS 4 (via `@tailwindcss/vite`), Babel React Compiler (via `@rolldown/plugin-babel` in `vite.config.ts`). UUIDs from `uuid`, ordering via `fractional-indexing`, icons from `lucide-react`.

`motion`, `@dnd-kit/*`, and `effect` appear in `package.json` but are not currently imported anywhere in `src/` — drag-and-drop is hand-rolled (see below). Treat them as unused unless you intentionally adopt them.

`VITE_BASE_PATH` env var configures the Vite `base` path.

## Architecture

Client-side React SPA implementing GTD. No backend, no router. Persistence is `localStorage` only.

### Files (all flat under `src/`)

1. `main.tsx` — React root, mounts `<App/>` in `<StrictMode>`.
2. `App.tsx` — every view component lives here (`AppHeader`, `SectionView`, `TaskView`, `Beacon`, `FloatingTask`, `App`). Single-view-file convention; don't split into per-component files without a reason.
3. `board.ts` — `Board` aggregate + transition functions + `load`/`save`.
4. `task.ts` — `Task` type + functions over `readonly Task[]`.
5. `section.ts` — `Section` type + functions over `readonly Section[]`.
6. `useBoard.ts` — `useState<Board>`, debounced `localStorage` save (100 ms), returns `{ board, actions }`.
7. `useDrag.ts` — pointer-event drag hook with DOM-beacon hit-testing.

### Module pattern

Each domain file exports a `type Foo` and a `const Foo = { ...pure functions... }`. Functions take state as the first arg and return new state; arrays are `readonly`. Derivations live on the model (e.g. `Board.tasksIn`, `Board.isEditingSection`, `Board.isEditingTask`) so views call them instead of recomputing — preserve this when adding new derived data.

### Data model

```
Board   { sections: readonly Section[]; tasks: readonly Task[]; editing: Editing | null }
Section { id; title; order }
Task    { id; sectionId; title; done; order }
Editing = { tag: 'task'; sectionId; taskId } | { tag: 'section'; sectionId }
```

Tasks are stored **flat** — each task carries its own `sectionId`. Order within a section is determined by `order`, a fractional-index string from `fractional-indexing`. Inserts and moves call `generateKeyBetween(prev, next)` so reordering touches only the moved item.

`Editing` is a discriminated union on `tag`; switch on `editing.tag` and add `assertNever` in the default branch (see repo TypeScript rules).

### Drag-and-drop (custom, no library)

1. Each `<SectionView>` renders a `<Beacon>` between every pair of adjacent task slots (and one above the first task). Beacons emit `data-beacon`, `data-beacon-section`, `data-beacon-before`, `data-beacon-after` attributes.
2. `TaskView`'s grip handle calls `startDrag` on `pointerdown`. `useDrag` attaches global `pointermove` / `pointerup` listeners until release. A 5px threshold suppresses accidental drags on click.
3. On each move, `nearestBeacon(y)` queries `document.querySelectorAll('[data-beacon]')` and picks the one closest in Y. The floating preview is positioned by mutating `floatRef.current.style` directly — **never via React state** — to avoid re-rendering the tree on every pointermove.
4. React state (`drag.activeBeacon`) updates only when the nearest beacon *changes*, which drives the highlight transition.
5. On `pointerup`, `useDrag` synthesises a `DropResult { taskId, sourceSectionId, targetSectionId, beforeId, afterId }` and calls `onDrop` (wired to `Board.moveTask` → `Task.move` → fractional-index recompute).

When editing this flow, preserve the invariant that the dragged task is excluded from beacon-neighbour computation (`SectionView`'s `visibleTasks`) so the dragged item never appears as its own `beforeId`/`afterId`.

### Persistence

`Board.load` reads `localStorage['simple-gtd:v4']` (versioned key — bump on breaking shape changes) and falls back to `buildSeedBoard()`. `useBoard` writes back on every state change with a 100 ms debounce. There is a known TODO in `board.ts` to validate the parsed shape before the `as Board` cast.

## Formatting

Prettier: 4-space indent, 90-char width, single quotes, no semicolons, trailing commas, LF endings, Tailwind class sorting via `prettier-plugin-tailwindcss`. There is no `format` script — run `pnpm prettier --write .`.

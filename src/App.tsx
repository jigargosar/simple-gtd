import { useState } from "react";
import { Reorder, useDragControls } from "motion/react";

type Task = {
  id: number;
  title: string;
  done: boolean;
};

type TaskList = {
  id: string;
  title: string;
  tasks: Task[];
};

const INITIAL_TASK_LISTS: TaskList[] = [
  {
    id: "inbox",
    title: "Inbox",
    tasks: [
      { id: 1, title: "Read article on deep work", done: false },
      { id: 2, title: "Reply to Sarah's email", done: false },
      { id: 3, title: "Look into new invoicing tool", done: false },
    ],
  },
  {
    id: "next",
    title: "Next Actions",
    tasks: [
      { id: 4, title: "Write project proposal", done: false },
      { id: 5, title: "Book dentist appointment", done: true },
      { id: 6, title: "Review pull request #42", done: false },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    tasks: [
      { id: 7, title: "Launch SimpleGTD v1", done: false },
      { id: 8, title: "Migrate database to Postgres", done: false },
      { id: 9, title: "Redesign onboarding flow", done: true },
    ],
  },
  {
    id: "waiting",
    title: "Waiting For",
    tasks: [
      { id: 10, title: "Contract signature from client", done: false },
      { id: 11, title: "Design assets from Priya", done: false },
    ],
  },
  {
    id: "someday",
    title: "Someday / Maybe",
    tasks: [
      { id: 12, title: "Learn Rust", done: false },
      { id: 13, title: "Build a keyboard", done: false },
      { id: 14, title: "Read Thinking Fast and Slow", done: false },
    ],
  },
];

function DragHandle({
  onPointerDown,
}: {
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <button
      onPointerDown={onPointerDown}
      className="p-2 cursor-grab text-gray-300 hover:text-gray-500 touch-none rounded"
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
        <circle cx="2" cy="2" r="1.5" />
        <circle cx="8" cy="2" r="1.5" />
        <circle cx="2" cy="7" r="1.5" />
        <circle cx="8" cy="7" r="1.5" />
        <circle cx="2" cy="12" r="1.5" />
        <circle cx="8" cy="12" r="1.5" />
      </svg>
    </button>
  );
}

function SortableTask({ task }: { task: Task }) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={controls}
      className="group/task relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
    >
      <div className="absolute -left-16 top-0 h-full w-16 flex flex-row items-center justify-end gap-1 pr-2 opacity-0 transition-opacity group-hover/task:opacity-100">
        <DragHandle onPointerDown={(e) => controls.start(e)} />
        <button className="p-2 text-gray-300 hover:text-gray-500 rounded">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <rect x="4" y="0" width="2" height="10" rx="1" />
            <rect x="0" y="4" width="10" height="2" rx="1" />
          </svg>
        </button>
      </div>
      <span
        className={`flex-1 text-sm ${task.done ? "text-gray-400 line-through" : "text-gray-900"}`}
      >
        {task.title}
      </span>
    </Reorder.Item>
  );
}

function SortableSection({
  taskList,
  onReorderTasks,
}: {
  taskList: TaskList;
  onReorderTasks: (taskListId: string, tasks: Task[]) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={taskList}
      dragListener={false}
      dragControls={controls}
      as="section"
    >
      <div className="group/section-header relative ml-16">
        <div className="absolute -left-16 top-0 h-full w-16 flex flex-row items-center justify-end gap-1 pr-2 opacity-0 transition-opacity group-hover/section-header:opacity-100">
          <DragHandle onPointerDown={(e) => controls.start(e)} />
          <button className="p-2 text-gray-300 hover:text-gray-500 rounded">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <rect x="4" y="0" width="2" height="10" rx="1" />
              <rect x="0" y="4" width="10" height="2" rx="1" />
            </svg>
          </button>
        </div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          {taskList.title}
        </h2>
      </div>
      <Reorder.Group
        axis="y"
        values={taskList.tasks}
        onReorder={(tasks) => onReorderTasks(taskList.id, tasks)}
        className="ml-16 space-y-2"
      >
        {taskList.tasks.map((task) => (
          <SortableTask key={task.id} task={task} />
        ))}
      </Reorder.Group>
    </Reorder.Item>
  );
}

function AppHeader() {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-xl font-semibold tracking-tight">SimpleGTD</h1>
    </header>
  );
}

function TaskBoard() {
  const [taskLists, setTaskLists] = useState<TaskList[]>(INITIAL_TASK_LISTS);

  function handleReorderTasks(taskListId: string, tasks: Task[]) {
    setTaskLists((prev) =>
      prev.map((taskList) =>
        taskList.id === taskListId ? { ...taskList, tasks } : taskList,
      ),
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Reorder.Group
        axis="y"
        values={taskLists}
        onReorder={setTaskLists}
        className="space-y-10"
      >
        {taskLists.map((taskList) => (
          <SortableSection
            key={taskList.id}
            taskList={taskList}
            onReorderTasks={handleReorderTasks}
          />
        ))}
      </Reorder.Group>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AppHeader />
      <TaskBoard />
    </div>
  );
}

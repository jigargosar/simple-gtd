type Task = string

export default function App() {
    const tasks = ['Lol', 'Pop']
    return (
        <div>
            {tasks.map((task) => (
                <ViewTask task={task}></ViewTask>
            ))}
        </div>
    )
}

function ViewTask({ task }: { task: Task }) {
    return <div>{task}</div>
}

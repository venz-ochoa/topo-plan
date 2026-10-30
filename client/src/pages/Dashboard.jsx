//this is for the dashboard with four lists of tasks

//this is for turning a date into text like 2026-10-28
function toDateStr(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return d.getFullYear() + '-' + m + '-' + day
}

//this is for one list with a title
function TaskList({ title, tasks, onStatus, empty }) {
    return (
        <section>
        <h3>{title} ({tasks.length})</h3>
        {tasks.length === 0 && <p className="empty">{empty}</p>}
        {tasks.map(t => (
            <div key={t.id} className="dash-task">
            <strong>{t.name}</strong>
            <span className="who">{t.startDate} to {t.endDate}</span>
            {t.who && <span className="who">Assigned to {t.who}</span>}
            {/*this is for changing the status, everyone can do this*/}
            <select value={t.status} aria-label={'Status of ' + t.name} onChange={e => onStatus(t.id, e.target.value)}>
                <option value="not_done">Not done</option>
                <option value="progress">In progress</option>
                <option value="done">Done</option>
            </select>
            </div>
        ))}
        </section>
    )
    }

    //this is for the dashboard
    export default function Dashboard({ tasks, onStatus }) {
    const today = toDateStr(new Date())
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    //this is for sorting the tasks into the four lists
    const todo = tasks.filter(t => t.status === 'not_done' && t.startDate <= today)
    const doing = tasks.filter(t => t.status === 'progress')
    const finished = tasks.filter(t => t.status === 'done' && t.finishedAt && new Date(t.finishedAt) >= weekAgo)
    const future = tasks.filter(t => t.status === 'not_done' && t.startDate > today)

    return (
        <div className="dash">
        <TaskList title="To do" tasks={todo} onStatus={onStatus} empty="Nothing to start." />
        <TaskList title="In progress" tasks={doing} onStatus={onStatus} empty="Nothing in progress." />
        <TaskList title="Future" tasks={future} onStatus={onStatus} empty="Nothing planned ahead." />
        <TaskList title="Recently finished (7 days)" tasks={finished} onStatus={onStatus} empty="Nothing finished lately." />
        </div>
    )
}
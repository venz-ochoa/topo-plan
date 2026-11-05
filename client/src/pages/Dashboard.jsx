//this is for the dashboard with four lists of tasks
import { status_names } from '../labels.js'

//this is for turning a date into text like 2026-10-28
function toDateStr(d) {
const m = String(d.getMonth() + 1).padStart(2, '0')
const day = String(d.getDate()).padStart(2, '0')
return d.getFullYear() + '-' + m + '-' + day
}

//this is for one list with a title
function TaskList({ title, tasks, userId, onOpen, empty }) {
return (
    <section>
    <h3>{title} ({tasks.length})</h3>
    {tasks.length === 0 && <p className="empty">{empty}</p>}
    {tasks.map(t => (
        <div key={t.id} className="dash-task">
        {/*this is for the task name, clicking it opens the popup*/}
        <button type="button" className="link" onClick={() => onOpen(t.id)}>{t.name}</button>
        <span className="who">{t.startDate} to {t.endDate}</span>
        <span className={'status status-' + t.status}>{status_names[t.status]}</span>
        {t.assignedTo === userId && <span className="who">Assigned to you</span>}
        </div>
    ))}
    </section>
)
}

//this is for the dashboard
export default function Dashboard({ tasks, userId, onOpen }) {
const today = toDateStr(new Date())
const weekAgo = new Date()
weekAgo.setDate(weekAgo.getDate() - 7)

//this is for sorting the tasks into the four lists
const ready = tasks.filter(t => t.status === 'not_done' && t.startDate <= today)
const underway = tasks.filter(t => t.status === 'progress')
const later = tasks.filter(t => t.status === 'not_done' && t.startDate > today)
const complete = tasks.filter(t => t.status === 'done' && t.finishedAt && new Date(t.finishedAt) >= weekAgo)

return (
    <div className="dash">
    <TaskList title="Ready to start" tasks={ready} userId={userId} onOpen={onOpen} empty="Nothing to start." />
    <TaskList title="Underway" tasks={underway} userId={userId} onOpen={onOpen} empty="Nothing underway." />
    <TaskList title="Coming later" tasks={later} userId={userId} onOpen={onOpen} empty="Nothing planned ahead." />
    <TaskList title="Completed this week" tasks={complete} userId={userId} onOpen={onOpen} empty="Nothing completed lately." />
    </div>
)
}
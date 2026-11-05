//this is for the task lists of ONE project (the Tasks tab); the dashboard of all projects is Overview.jsx
import { status_names } from '../labels.js'
import { groupTasks } from '../engine/summary.js'

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
//this is for sorting the tasks into the four lists
const { ready, underway, later, complete } = groupTasks(tasks)

return (
    <div className="dash">
    <TaskList title="Ready to start" tasks={ready} userId={userId} onOpen={onOpen} empty="Nothing to start." />
    <TaskList title="Underway" tasks={underway} userId={userId} onOpen={onOpen} empty="Nothing underway." />
    <TaskList title="Coming later" tasks={later} userId={userId} onOpen={onOpen} empty="Nothing planned ahead." />
    <TaskList title="Completed this week" tasks={complete} userId={userId} onOpen={onOpen} empty="Nothing completed lately." />
    </div>
)
}
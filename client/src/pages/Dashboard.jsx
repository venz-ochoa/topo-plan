//this is for the task lists of ONE project (the Tasks tab); the dashboard of all projects is Overview.jsx
import { status_names } from '../labels.js'
import { groupTasks } from '../engine/summary.js'

//this is for one list with a title and a small picture
function TaskList({ title, icon, tasks, userId, onOpen, empty }) {
return (
    <section className="dash-col">
    <h3 className="h-ico">{icon} {title} <span className="count">{tasks.length}</span></h3>
    {tasks.length === 0 && <p className="empty empty-line">{empty}</p>}
    {tasks.map(t => (
        <div key={t.id} className="dash-task">
        {/*this is for the task name, clicking it opens the popup*/}
        <button type="button" className="link task-name" onClick={() => onOpen(t.id)}>{t.name}</button>
        <span className="who with-ico"><img src="/icons/calendar.svg" alt="" width="16" height="16" /> {t.startDate} to {t.endDate}</span>
        <div className="meta-row">
            <span className={'status status-' + t.status}>{status_names[t.status]}</span>
            {t.assignedTo === userId && <span className="who with-ico"><img src="/icons/user.svg" alt="" width="16" height="16" /> Assigned to you</span>}
        </div>
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
    <TaskList title="Ready to start" icon={<img src="/icons/play.svg" alt="" width="22" height="22" />} tasks={ready} userId={userId} onOpen={onOpen} empty="Nothing to start." />
    <TaskList title="Underway" icon={<img src="/icons/clock.svg" alt="" width="22" height="22" />} tasks={underway} userId={userId} onOpen={onOpen} empty="Nothing underway." />
    <TaskList title="Coming later" icon={<img src="/icons/calendar.svg" alt="" width="22" height="22" />} tasks={later} userId={userId} onOpen={onOpen} empty="Nothing planned ahead." />
    <TaskList title="Completed this week" icon={<img src="/icons/circle-check.svg" alt="" width="22" height="22" />} tasks={complete} userId={userId} onOpen={onOpen} empty="Nothing completed lately." />
    </div>
    )
}

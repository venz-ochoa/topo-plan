//this is for the task lists of ONE project (the Tasks tab); the dashboard of all projects is Overview.jsx
import { status_names } from '../engine/labels.js'
import { groupTasks, summarizeProject } from '../engine/summary.js'
import { nameOf } from '../engine/labels.js'

//this is for one list with a title and a small picture
function TaskList({ title, icon, tasks, userId, users, onOpen, empty }) {
return (
    <section className="dash-col">
    <h3 className="h-ico">{icon} {title} <span className="count">{tasks.length}</span></h3>
    {tasks.length === 0 && <p className="empty empty-line">{empty}</p>}
    {tasks.map(t => (
        <div key={t.id} className={'dash-task' + (t.status === 'done' ? ' is-done' : '')}>
        {/*this is for the task name, clicking it opens the popup*/}
        <button type="button" className="link task-name" onClick={() => onOpen(t.id)}>{t.name}</button>
        <span className="who with-ico"><img src="/icons/calendar.svg" alt="" width="16" height="16" /> {t.startDate} to {t.endDate}</span>
        <div className="meta-row">
            <span className={'status status-' + t.status}>{status_names[t.status]}</span>
            <span className="who with-ico"><img src="/icons/user.svg" alt="" width="16" height="16" /> {t.assignedTo === userId ? 'Assigned to you' : t.assignedTo ? nameOf(users, t.assignedTo) : 'Not assigned yet'}</span>
        </div>
        </div>
    ))}
    </section>
)
}

//this is for the dashboard
export default function Dashboard({ tasks, allTasks, userId, users, onOpen }) {
//this is for sorting the tasks into the four lists
const { ready, underway, later, complete } = groupTasks(tasks)
//this is for the numbers at the top (they follow the person picked in the filter)
const s = summarizeProject(tasks, userId)
const mineTotal = allTasks.filter(t => t.assignedTo === userId).length
const stat = (n, label, warn) => <div className={'stat' + (warn && n > 0 ? ' warn' : '')}><strong>{n}</strong><span>{label}</span></div>

return (
    <div>
    {/*this is for the summary of the tasks on show*/}
    <div className="summary" aria-label="Task summary">
        {stat(s.total, s.total === 1 ? 'task' : 'tasks')}
        {stat(s.waiting, 'to do')}
        {stat(s.underway, 'in progress')}
        {stat(s.done, 'done')}
        {stat(s.overdue, 'overdue', true)}
        {stat(mineTotal, 'assigned to you')}
    </div>
    <div className="dash">
    <TaskList title="Up next" icon={<img src="/icons/play.svg" alt="" width="22" height="22" />} tasks={ready} userId={userId} users={users} onOpen={onOpen} empty="Nothing up next." />
    <TaskList title="In progress" icon={<img src="/icons/clock.svg" alt="" width="22" height="22" />} tasks={underway} userId={userId} users={users} onOpen={onOpen} empty="Nothing in progress." />
    <TaskList title="Later" icon={<img src="/icons/calendar.svg" alt="" width="22" height="22" />} tasks={later} userId={userId} users={users} onOpen={onOpen} empty="Nothing planned later." />
    <TaskList title="Done this week" icon={<img src="/icons/circle-check.svg" alt="" width="22" height="22" />} tasks={complete} userId={userId} users={users} onOpen={onOpen} empty="Nothing done lately." />
    </div>
    </div>
    )
}
//this is for the timeline with the gantt chart
import AddTask from '../components/AddTask.jsx'
import { isWorkday } from '../engine/holidays.js'
import { status_names } from '../engine/labels.js'

//this is for the names of the weekdays and months
const day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

//this is for the fewest days the chart shows, and the most (so a far away date can't make it huge)
const day_min = 7
const day_max = 180

//this is for the width of one day in pixels (the bars are drawn from it)
const DAY = 72

//this is for human words for the priority values
const priority = { high: 'High', med: 'Medium', low: 'Low' }

//this is for making a date from text like 2026-10-28
function parse(str) {
return new Date(str + 'T00:00:00')
}

//this is for turning a date into text like 2026-10-28
function toDateStr(d) {
const m = String(d.getMonth() + 1).padStart(2, '0')
const day = String(d.getDate()).padStart(2, '0')
return d.getFullYear() + '-' + m + '-' + day
}

//this is for short dates like "Nov 6"
function short(str) {
const d = parse(str)
return month_names[d.getMonth()] + ' ' + d.getDate()
}

//this is for counting days from one date to another
function diff(aStr, bStr) {
return Math.round((parse(bStr) - parse(aStr)) / 86400000)
}

//this is for making the list of days: from today to the end of the latest task (and its buffer)
function makeDays(tasks, analysis) {
const now = new Date()
const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const startStr = toDateStr(start)

let count = day_min
tasks.forEach(t => {
    const slack = analysis && analysis[t.id] ? analysis[t.id].slack : 0
    const needed = diff(startStr, t.endDate) + 1 + slack
    if (needed > count) count = needed
})
if (count > day_max) count = day_max

const days = []
for (let i = 0; i < count; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}
return days
}

//this is for one task row: the task on the left, then ONE bar from its first day to its last day
function GanttRow({ task, tasks, days, firstDay, info, onSlip, onOpen, canEdit }) {
const startsToday = task.startDate <= toDateStr(new Date())
const done = task.status === 'done'

//this is for where the bar starts and how long it is (a task from before today is cut at the left edge)
const from = Math.max(diff(firstDay, task.startDate), 0)
const to = diff(firstDay, task.endDate)
const length = to - from + 1
const total = diff(task.startDate, task.endDate) + 1

//this is for the spare time after the task (the buffer): how far it could slip without moving the end
const slack = !done && info && !info.critical ? info.slack : 0

//this is for the one colour of the bar: grey when complete, red when critical, green otherwise
const kind = done ? 'done' : info && info.critical ? 'crit' : 'ok'

//this is for the name of the task this one waits for
const after = task.dependsOn.map(id => tasks.find(t => t.id === id)).filter(Boolean).map(t => t.name)

const label = short(task.startDate) + ' to ' + short(task.endDate) + ' · ' + total + (total === 1 ? ' day' : ' days')
const tip = task.name + (task.description ? ' - ' + task.description : '') + ': ' + label + (done ? ' (done)' : info ? (info.critical ? ' (critical, no buffer)' : ' (' + info.slack + '-day buffer)') : '')

return (
    <div className={'g-row' + (done ? ' is-done' : '')}>
    {/*this is for the task column: clicking anywhere in it opens the popup*/}
    <div className="cell name" title={tip} onClick={() => onOpen(task.id)}>
        <div className="name-line">
        <button type="button" className="link" onClick={e => { e.stopPropagation(); onOpen(task.id) }}>{task.name}</button>
        <span className="tag">{priority[task.priority]}</span>
        </div>
        <span className={'status status-' + task.status}>{status_names[task.status]}</span>
        {after.length > 0 && <span className="who">After: {after.join(', ')}</span>}
        {!done && info && <span className="who">{info.critical ? 'No buffer: critical' : info.slack + '-day buffer'}</span>}
        {/*this is for slipping the task: admins only, and never for a complete task*/}
        {canEdit && !done && task.assignedTo && (
        <div className="slip" onClick={e => e.stopPropagation()}>
            <button disabled={startsToday} onClick={() => onSlip(task.id, -1)}>−1 day</button>
            <button onClick={() => onSlip(task.id, 1)}>+1 day</button>
        </div>
        )}
        {canEdit && !done && !task.assignedTo && <span className="who">Nobody assigned. Open it to assign someone first.</span>}
        {done && <span className="who">Done. Locked.</span>}
    </div>

    {/*this is for the days of the row: weekend and today shading, with the bar laid on top*/}
    <div className="g-days" style={{ width: days.length * DAY + 'px' }}>
        {days.map(d => (
        <div key={d.getTime()} className={'g-day' + (toDateStr(d) === toDateStr(new Date()) ? ' today' : '') + (!isWorkday(toDateStr(d)) ? ' weekend' : '')} style={{ width: DAY + 'px' }} />
        ))}
        {length > 0 && (
        <button type="button" className={'g-bar ' + kind} title={tip} aria-label={tip} onClick={() => onOpen(task.id)}
            style={{ left: from * DAY + 3 + 'px', width: length * DAY - 6 + 'px' }}>
            <span>{length * DAY > 150 ? label : total + 'd'}</span>
        </button>
        )}
        {slack > 0 && length > 0 && (
        <div className="g-buffer" title={slack + ' spare days: the task can slip this much without moving the end date'}
            style={{ left: (to + 1) * DAY + 3 + 'px', width: slack * DAY - 6 + 'px' }}>
            <span>{slack}d spare</span>
        </div>
        )}
    </div>
    </div>
)
}

//this is for the timeline page (the tasks, the critical path and saving come from the project page)
export default function Home({ tasks, shown, users, analysis, error, isAdmin, onAdd, onSlip, onOpen }) {
const days = makeDays(tasks, analysis)
const firstDay = toDateStr(days[0])
const today = toDateStr(new Date())

//this is for the end date of the whole plan, written like "Fri 30"
let endsText = ''
if (tasks.length > 0) {
    const last = parse(tasks.map(t => t.endDate).sort()[tasks.length - 1])
    endsText = day_names[last.getDay()] + ' ' + last.getDate() + ' ' + month_names[last.getMonth()]
}

return (
    <div>
    <h2>Project Timeline</h2>

    {/*this is for the add task form, only admins see it*/}
    {isAdmin && <AddTask onAdd={onAdd} tasks={tasks} users={users} />}

    {tasks.length > 0 && <p className="ends">Project ends {endsText}. Click a task to see its details.</p>}

    {/*this is for the circle alarm*/}
    {error && <div className="error-box">Circle detected! ({error})</div>}

    {/*this is for the key: what each look on the chart means*/}
    {tasks.length > 0 && (
        <ul className="legend" aria-label="Chart key">
        <li><i className="sw crit" /> Critical: no spare time, a delay moves the end date</li>
        <li><i className="sw ok" /> Has buffer</li>
        <li><i className="sw buffer" /> Spare days it can slip</li>
        <li><i className="sw done" /> Done</li>
        <li><i className="sw today" /> Today</li>
        </ul>
    )}

    {/*this is for the chart: it scrolls sideways, and the task column stays in view*/}
    <div className="gantt-wrap">
        <div className="gantt">
        <div className="g-row g-head">
            <div className="cell head corner">Task</div>
            <div className="g-days" style={{ width: days.length * DAY + 'px' }}>
            {days.map((d, i) => (
                <div key={d.getTime()} style={{ width: DAY + 'px' }} className={'cell head' + (toDateStr(d) === today ? ' today' : '')}>
                {(i === 0 || d.getDate() === 1) && <small>{month_names[d.getMonth()]}</small>}
                <span>{day_names[d.getDay()]}</span>
                <span>{d.getDate()}</span>
                </div>
            ))}
            </div>
        </div>
        {shown.map(t => (
            <GanttRow key={t.id} task={t} tasks={tasks} days={days} firstDay={firstDay} info={analysis ? analysis[t.id] : null} onSlip={onSlip} onOpen={onOpen} canEdit={isAdmin} />
        ))}
        </div>
    </div>

    {tasks.length === 0 && (
        <p className="empty">{isAdmin ? 'No tasks yet. Add your first one above.' : 'No tasks yet. An admin needs to add them.'}</p>
    )}
    {tasks.length > 0 && shown.length === 0 && <p className="empty">No tasks for this person.</p>}
    </div>
    )
}
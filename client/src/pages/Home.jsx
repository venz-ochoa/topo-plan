//this is for the timeline with the gantt chart
import AddTask from '../components/AddTask.jsx'
import { reschedule, shiftTask } from '../engine/schedule.js'
import { status_names } from '../labels.js'

//this is for the names of the weekdays and months
const day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

//this is for the fewest days the chart shows, and the most (so a far away date can't make it huge)
const day_min = 7
const day_max = 180

//this is for human words for the priority values
const priority = { high: 'High', med: 'Medium', low: 'Low' }

//this is for making the list of days: from today to the end of the latest task
function makeDays(tasks) {
const now = new Date()
const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

//this is for counting how many days are needed to reach the latest task
let count = day_min
tasks.forEach(t => {
    const end = new Date(t.endDate + 'T00:00:00')
    const needed = Math.round((end - start) / 86400000) + 1
    if (needed > count) count = needed
})
if (count > day_max) count = day_max

const days = []
for (let i = 0; i < count; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}
return days
}

//this is for turning a date into text like 2026-10-28
function toDateStr(d) {
const m = String(d.getMonth() + 1).padStart(2, '0')
const day = String(d.getDate()).padStart(2, '0')
return d.getFullYear() + '-' + m + '-' + day
}

//this is for one task row
function GanttRow({ task, days, info, onSlip, onOpen, canEdit }) {
//this is for knowing if the task starts today (then -1 day is blocked)
const startsToday = task.startDate <= toDateStr(new Date())

return (
    <>
    {/*this is for the task column: clicking anywhere in it opens the popup*/}
    <div className="cell name" onClick={() => onOpen(task.id)}>
        <div className="name-line">
        <button type="button" className="link" onClick={e => { e.stopPropagation(); onOpen(task.id) }}>{task.name}</button>
        <span className="tag">{priority[task.priority]}</span>
        </div>
        <span className={'status status-' + task.status}>{status_names[task.status]}</span>
        {/*this is for the buffer the engine computed*/}
        {info && <span className="who">{info.critical ? 'No buffer — critical' : info.slack + '-day buffer'}</span>}
        {/*this is for slipping the task, only admins see these buttons (clicking them does not open the popup)*/}
        {canEdit && (
        <div className="slip" onClick={e => e.stopPropagation()}>
            <button disabled={startsToday} onClick={() => onSlip(task.id, -1)}>−1 day</button>
            <button onClick={() => onSlip(task.id, 1)}>+1 day</button>
        </div>
        )}
    </div>
    {days.map(d => {
        //this is for deciding if this day is part of the task
        const str = toDateStr(d)
        const inRange = str >= task.startDate && str <= task.endDate
        return (
        <div key={d.getTime()} className="cell day">
            {/*this is for the thin line, only on days the task runs*/}
            {inRange && <div className={(info && info.critical ? 'bar crit' : 'bar') + (str === task.startDate ? ' start' : '') + (str === task.endDate ? ' end' : '')} />}
        </div>
        )
    })}
    </>
)
}

//this is for the timeline page (the tasks, the critical path and saving come from the project page)
export default function Home({ tasks, users, analysis, error, isAdmin, onChange, onOpen }) {
//this is for the days on top of the chart
const days = makeDays(tasks)
const today = toDateStr(new Date())

//this is for adding a new task, then fixing the dates
function addTask(task) {
    onChange(reschedule([...tasks, task]))
}

//this is for moving a task and the tasks that wait for it, by a day
function slipTask(id, move) {
    //this is for blocking -1 day when the task starts today
    const task = tasks.find(t => t.id === id)
    if (move < 0 && task.startDate <= today) return
    onChange(shiftTask(tasks, id, move))
}

//this is for the end date of the whole plan, written like "Fri 30"
let endsText = ''
if (tasks.length > 0) {
    const last = new Date(tasks.map(t => t.endDate).sort()[tasks.length - 1] + 'T00:00:00')
    endsText = day_names[last.getDay()] + ' ' + last.getDate()
}

return (
    <div>
    <h2>Project Timeline</h2>

    {/*this is for the add task form, only admins see it*/}
    {isAdmin && <AddTask onAdd={addTask} tasks={tasks} users={users} />}

    {/*this is for the plan's end date, it moves when a critical task slips*/}
    {tasks.length > 0 && <p className="ends">Project ends {endsText}. Click a task to see its details.</p>}

    {/*this is for the circle alarm*/}
    {error && <div className="error-box">Circle detected! ({error})</div>}

    {/*this is for the chart: it scrolls sideways, and the task column stays in view*/}
    <div className="gantt-wrap">
        <div className="gantt" style={{ gridTemplateColumns: '240px repeat(' + days.length + ', 88px)' }}>
        <div className="cell head corner">Task</div>
        {days.map((d, i) => (
            <div key={d.getTime()} className={'cell head' + (toDateStr(d) === today ? ' today' : '')}>
            {(i === 0 || d.getDate() === 1) && <small>{month_names[d.getMonth()]}</small>}
            <span>{day_names[d.getDay()]}</span>
            <span>{d.getDate()}</span>
            </div>
        ))}
        {tasks.map(t => (
            <GanttRow key={t.id} task={t} days={days} info={analysis ? analysis[t.id] : null} onSlip={slipTask} onOpen={onOpen} canEdit={isAdmin} />
        ))}
        </div>
    </div>

    {tasks.length === 0 && (
        <p className="empty">{isAdmin ? 'No tasks yet. Add your first one above.' : 'No tasks yet. An admin needs to add them.'}</p>
    )}
    </div>
    )
}
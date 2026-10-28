//this is for the home screen with the gantt chart
import { useState } from 'react'
import AddTask from '../components/AddTask.jsx'
import { analyze } from '../engine/cpm.js'
import { reschedule } from '../engine/schedule.js'

//this is for the names of the weekdays
const day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

//this is for how many days the chart shows
const day_count = 7

//this is for human words for the priority values
const priority = { high: 'High', med: 'Medium', low: 'Low' }

//this is for making the list of days, starting today
function makeDays() {
  const days = []
  const now = new Date()
  for (let i = 0; i < day_count; i++) {
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i))
  }
  return days
}

//this is for turning a date into text like 2026-10-28
function toDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + m + '-' + day
}

//this is for counting the days a date range covers
function daysBetween(startStr, endStr) {
  return (new Date(endStr) - new Date(startStr)) / 86400000 + 1
}

//this is for finding a task and every task that waits for it
function findChain(id, tasks) {
  const ids = [id]
  let added = true
  while (added) {
    added = false
    tasks.forEach(t => {
      if (ids.includes(t.id)) return
      if (t.dependsOn.some(d => ids.includes(d))) {
        ids.push(t.id)
        added = true
      }
    })
  }
  return ids
}

//this is for one task row
function GanttRow({ task, days, info, onSlip }) {
  //this is for knowing if the task starts today (then -1 day is blocked)
  const startsToday = task.startDate <= toDateStr(new Date())

  return (
    <>
      <div className="cell name">
        {task.name}
        <span className={'tag ' + task.priority}>{priority[task.priority]}</span>
        {task.who && <span className="who">Assigned to {task.who}</span>}
        {/*this is for the buffer the engine computed*/}
        {info && <span className="who">{info.critical ? 'No buffer — critical' : info.slack + '-day buffer'}</span>}
        {/*this is for slipping the task a day later or earlier*/}
        <div className="slip">
          <button disabled={startsToday} onClick={() => onSlip(task.id, -1)}>−1 day</button>
          <button onClick={() => onSlip(task.id, 1)}>+1 day</button>
        </div>
      </div>
      {days.map(d => {
        //this is for deciding if this day is part of the task
        const str = toDateStr(d)
        const inRange = str >= task.startDate && str <= task.endDate
        return (
          <div key={d.getTime()} className="cell day">
            {/*this is for the thin line, only on days the task runs*/}
            {inRange && <div className={info && info.critical ? 'bar crit' : 'bar'} />}
          </div>
        )
      })}
    </>
  )
}

//this is for the home page
export default function Home() {
  //this is for the days on top of the chart
  const days = makeDays()

  //this is for the list of tasks
  const [tasks, setTasks] = useState([])

  //this is for adding a new task, then fixing the dates
  function addTask(task) {
    setTasks(reschedule([...tasks, task]))
  }

  //this is for moving a task and the tasks that wait for it, by a day
  function slipTask(id, move) {
    //this is for blocking -1 day when the task starts today
    const today = toDateStr(new Date())
    const task = tasks.find(t => t.id === id)
    if (move < 0 && task.startDate <= today) return

    //this is for moving the task and everything that depends on it
    const chain = findChain(id, tasks)
    const moved = tasks.map(t => {
      if (!chain.includes(t.id)) return t
      const s = new Date(t.startDate + 'T00:00:00')
      const e = new Date(t.endDate + 'T00:00:00')
      s.setDate(s.getDate() + move)
      e.setDate(e.getDate() + move)
      return { ...t, startDate: toDateStr(s), endDate: toDateStr(e) }
    })
    setTasks(reschedule(moved))
  }

  //this is for translating tasks into engine format (dates become day counts)
  const today = toDateStr(new Date())
  const engineTasks = tasks.map(t => ({
    id: t.id,
    days: daysBetween(t.startDate, t.endDate),
    //this is for how many days after today the task starts
    startDay: (new Date(t.startDate) - new Date(today)) / 86400000,
    dependsOn: t.dependsOn,
  }))

  //this is for the end date of the whole plan, written like "Fri 30"
  let endsText = ''
  if (tasks.length > 0) {
    const last = new Date(tasks.map(t => t.endDate).sort()[tasks.length - 1] + 'T00:00:00')
    endsText = day_names[last.getDay()] + ' ' + last.getDate()
  }

  //this is for running the engine safely (it throws on circles)
  let analysis = null
  let error = null
  try {
    analysis = analyze(engineTasks)
  } catch (e) {
    error = e.message
  }

  return (
    <div>
      <h2>Project Timeline</h2>

      <AddTask onAdd={addTask} tasks={tasks} />

      {/*this is for the plan's end date, it moves when a critical task slips*/}
      {tasks.length > 0 && <p className="ends">Project ends {endsText}</p>}

      {/*this is for the circle alarm*/}
      {error && <div className="error-box">Circle detected! ({error})</div>}

      <div className="gantt">
        <div className="cell head">Task</div>
        {days.map(d => (
          <div key={d.getTime()} className="cell head">
            {day_names[d.getDay()]} {d.getDate()}
          </div>
        ))}
        {tasks.map(t => (
          <GanttRow key={t.id} task={t} days={days} info={analysis ? analysis[t.id] : null} onSlip={slipTask} />
        ))}
      </div>

      {tasks.length === 0 && <p className="empty">No tasks yet. Add your first one above.</p>}
    </div>
  )
}
//this is for the home screen with the gantt chart
import { useState } from 'react'
import AddTask from '../components/AddTask.jsx'
import { analyze } from '../engine/cpm.js'

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

//this is for one task row
function GanttRow({ task, days, info }) {
  return (
    <>
      <div className="cell name">
        {task.name}
        <span className={'tag ' + task.priority}>{priority[task.priority]}</span>
        {task.who && <span className="who">Assigned to {task.who}</span>}
        {/*this is for the buffer the engine computed*/}
        {info && <span className="who">{info.critical ? 'No buffer — critical' : info.slack + '-day buffer'}</span>}
      </div>
      {days.map(d => {
        //this is for deciding how one day cell looks
        const str = toDateStr(d)
        const inRange = str >= task.startDate && str <= task.endDate
        let cls = 'cell'
        if (inRange) cls = cls + ' bar'
        if (inRange && info && info.critical) cls = cls + ' crit'
        return <div key={d.getTime()} className={cls} />
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

  //this is for adding a new task
  function addTask(task) {
    setTasks([...tasks, task])
  }

  //this is for translating tasks into engine format (dates become day counts)
  const engineTasks = tasks.map(t => ({
    id: t.id,
    days: daysBetween(t.startDate, t.endDate),
    dependsOn: t.dependsOn,
  }))

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
          <GanttRow key={t.id} task={t} days={days} info={analysis ? analysis[t.id] : null} />
        ))}
      </div>

      {tasks.length === 0 && <p className="empty">No tasks yet. Add your first one above.</p>}
    </div>
  )
}
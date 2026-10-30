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

//this is for drawing a little svg icon, the fill takes the text color
//the shapes come from the solar icon set (icones.js.org/collection/solar)
function Icon({ children }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      {children}
    </svg>
  )
}

//this is for a person (assigned to), the solar user-bold icon
const person = (
  <Icon>
    <path d="M12 13C16.4183 13 20 15.0147 20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13Z"/>
    <path d="M12 2C14.2091 2 16 3.79086 16 6C16 8.20914 14.2091 10 12 10C9.79086 10 8 8.20914 8 6C8 3.79086 9.79086 2 12 2Z"/>
  </Icon>
)

//this is for a critical task, the solar danger-triangle-bold icon
const flag = (
  <Icon>
    <path fillRule="evenodd" d="M5.31171 10.7615C8.23007 5.58716 9.68925 3 12 3C14.3107 3 15.7699 5.58716 18.6883 10.7615L19.0519 11.4063C21.4771 15.7061 22.6897 17.856 21.5937 19.428C20.4978 21 17.7864 21 12.3637 21H11.6363C6.21356 21 3.50217 21 2.40626 19.428C1.31034 17.856 2.52291 15.7061 4.94805 11.4063L5.31171 10.7615ZM12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V8C11.25 7.58579 11.5858 7.25 12 7.25ZM12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" clipRule="evenodd"/>
  </Icon>
)

//this is for a task with breathing room, the solar clock-circle-bold icon
const clock = (
  <Icon>
    <path fillRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 7.25C11.5858 7.25 11.25 7.58579 11.25 8V12C11.25 12.1989 11.3291 12.3896 11.4697 12.5303L13.9697 15.0303C14.2626 15.3232 14.7374 15.3232 15.0303 15.0303C15.3232 14.7374 15.3232 14.2626 15.0303 13.9697L12.75 11.6895V8C12.75 7.58579 12.4142 7.25 12 7.25Z" clipRule="evenodd"/>
  </Icon>
)

//this is for dates, the solar calendar-minimalistic-bold icon
const calendar = (
  <Icon>
    <path d="M22 14V12C22 11.161 22 10.4153 21.9871 9.75H2.0129C2 10.4153 2 11.161 2 12V14C2 17.7712 2 19.6569 3.17157 20.8284C4.34315 22 6.22876 22 10 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14Z"/>
    <path d="M7.75 2.5C7.75 2.08579 7.41421 1.75 7 1.75C6.58579 1.75 6.25 2.08579 6.25 2.5V4.07926C4.81067 4.19451 3.86577 4.47737 3.17157 5.17157C2.47737 5.86577 2.19451 6.81067 2.07926 8.25H21.9207C21.8055 6.81067 21.5226 5.86577 20.8284 5.17157C20.1342 4.47737 19.1893 4.19451 17.75 4.07926V2.5C17.75 2.08579 17.4142 1.75 17 1.75C16.5858 1.75 16.25 2.08579 16.25 2.5V4.0129C15.5847 4 14.839 4 14 4H10C9.16097 4 8.41527 4 7.75 4.0129V2.5Z"/>
  </Icon>
)

//this is for dependencies, the solar link-circle-bold icon
const branch = (
  <Icon>
    <path fillRule="evenodd" d="M3.46447 20.5355C4.92893 22 7.28595 22 12 22C16.714 22 19.0711 22 20.5355 20.5355C22 19.0711 22 16.714 22 12C22 7.28595 22 4.92893 20.5355 3.46447C19.0711 2 16.714 2 12 2C7.28595 2 4.92893 2 3.46447 3.46447C2 4.92893 2 7.28595 2 12C2 16.714 2 19.0711 3.46447 20.5355ZM9.5 8.75C7.70507 8.75 6.25 10.2051 6.25 12C6.25 13.7949 7.70507 15.25 9.5 15.25C11.2949 15.25 12.75 13.7949 12.75 12C12.75 11.5858 13.0858 11.25 13.5 11.25C13.9142 11.25 14.25 11.5858 14.25 12C14.25 14.6234 12.1234 16.75 9.5 16.75C6.87665 16.75 4.75 14.6234 4.75 12C4.75 9.37665 6.87665 7.25 9.5 7.25C9.91421 7.25 10.25 7.58579 10.25 8C10.25 8.41421 9.91421 8.75 9.5 8.75ZM17.75 12C17.75 13.7949 16.2949 15.25 14.5 15.25C14.0858 15.25 13.75 15.5858 13.75 16C13.75 16.4142 14.0858 16.75 14.5 16.75C17.1234 16.75 19.25 14.6234 19.25 12C19.25 9.37665 17.1234 7.25 14.5 7.25C11.8766 7.25 9.75 9.37665 9.75 12C9.75 12.4142 10.0858 12.75 10.5 12.75C10.9142 12.75 11.25 12.4142 11.25 12C11.25 10.2051 12.7051 8.75 14.5 8.75C16.2949 8.75 17.75 10.2051 17.75 12Z" clipRule="evenodd"/>
  </Icon>
)

//this is for one task row
function GanttRow({ task, days, info, onSlip, onEdit, onView }) {
  //this is for knowing if the task starts today (then -1 day is blocked)
  const startsToday = task.startDate <= toDateStr(new Date())

  return (
    <>
      <div className="cell name">
        {task.name}
        <span className={'tag ' + task.priority}>{priority[task.priority]}</span>
        {task.who && <span className="who">{person} {task.who}</span>}
        {/*this is for the buffer the engine computed, in plain words*/}
        {info && <span className="who">{info.critical ? flag : clock} {info.critical ? 'Critical — no buffer' : 'Buffer: ' + info.slack + ' days'}</span>}
        {/*this is for the action row, all four buttons share one style, words not icons*/}
        <div className="slip">
          <button disabled={startsToday} onClick={() => onSlip(task.id, -1)}>−1 day</button>
          <button onClick={() => onSlip(task.id, 1)}>+1 day</button>
          <button onClick={() => onEdit(task)}>Edit</button>
          <button onClick={() => onView(task)}>View</button>
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

//this is for the little window that shows one task's details
function TaskView({ task, tasks, info, onClose }) {
  //this is for turning the dependency ids into names
  const depNames = task.dependsOn.map(id => {
    const dep = tasks.find(t => t.id === id)
    return dep ? dep.name : '?'
  })
  return (
    <div className="overlay">
      <div className="modal">
        <h3>{task.name}</h3>
        <p>{person} Assigned to: {task.who || '—'}</p>
        <p>Priority: {priority[task.priority]}</p>
        <p>{calendar} Starts: {new Date(task.startDate + 'T00:00:00').toDateString()}</p>
        <p>{calendar} Ends: {new Date(task.endDate + 'T00:00:00').toDateString()}</p>
        <p>{branch} Depends on: {depNames.length > 0 ? depNames.join(', ') : 'Nothing'}</p>
        {/*this is for the buffer the engine computed, in plain words*/}
        {info && <p>{info.critical ? flag : clock} {info.critical ? 'Critical — no buffer' : 'Buffer: ' + info.slack + ' days'}</p>}
        <button className="add-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

//this is for the home page
export default function Home() {
  //this is for the days on top of the chart
  const days = makeDays()

  //this is for the list of tasks
  const [tasks, setTasks] = useState([])

  //this is for the popup form: null means closed, 'new' means add, a task means edit
  const [modal, setModal] = useState(null)

  //this is for the task the eye icon opened, null means closed
  const [viewTask, setViewTask] = useState(null)

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

  //this is for saving the popup form: a new task is added, an edited one replaces the old
  //if the dependency makes a circle, the fixing step is skipped and the circle alarm shows
  function saveTask(t) {
    const list = modal === 'new' ? [...tasks, t] : tasks.map(x => (x.id === t.id ? t : x))
    try {
      setTasks(reschedule(list))
    } catch (e) {
      setTasks(list)
    }
    setModal(null)
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
      {/*this is for the title row, the button opens the popup form*/}
      <div className="top">
        <h2>Project Timeline</h2>
        <button className="add-btn" onClick={() => setModal('new')}>Add task</button>
      </div>

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
          <GanttRow key={t.id} task={t} days={days} info={analysis ? analysis[t.id] : null} onSlip={slipTask} onEdit={setModal} onView={setViewTask} />
        ))}
      </div>

      {tasks.length === 0 && <p className="empty">No tasks yet. Click Add task to start.</p>}

      {/*this is for the popup form, it only exists on the screen while it is open*/}
      {modal && (
        <AddTask
          task={modal === 'new' ? null : modal}
          tasks={tasks}
          onSave={saveTask}
          onClose={() => setModal(null)}
        />
      )}

      {/*this is for the details window, it only exists on the screen while it is open*/}
      {viewTask && (
        <TaskView
          task={viewTask}
          tasks={tasks}
          info={analysis ? analysis[viewTask.id] : null}
          onClose={() => setViewTask(null)}
        />
      )}
    </div>
  )
}
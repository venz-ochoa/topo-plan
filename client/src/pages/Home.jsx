//this is for the home screen, shows the blank gantt chart
import { Fragment } from 'react'
import AddTask from '../components/AddTask.jsx'

//this is for the names of the weekdays
const day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

//this is for how many days the chart shows
const day_count = 7

//this is for making the list of days, starting from today
function makeDays() {
  const days = []
  const now = new Date()
  for (let i = 0; i < day_count; i++) {
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i))
  }
  return days
}

//this is for one empty row of the chart
function GanttRow({ label, days }) {
  return (
    <Fragment>
      <div className="cell name">{label}</div>
      {days.map(d => (
        <div key={d.getTime()} className="cell" />
      ))}
    </Fragment>
  )
}

//this is for the home page
export default function Home() {
  //this is for the days shown on top of the chart
  const days = makeDays()

  //this is for the empty rows, later these become real tasks
  const rows = ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5']

  return (
    <div>
      <h2>Project Timeline</h2>
      <div className="gantt">
        <div className="cell head">Task</div>
        {/*this maps out the days on top of the chart. for now its 7 days*/}
        {days.map(d => (
          <div key={d.getTime()} className="cell head">
            {day_names[d.getDay()]} {d.getDate()}
          </div>
        ))}
        {rows.map(label => (
          <GanttRow key={label} label={label} days={days} />
        ))}
        <AddTask onAdd={(task) => console.log(task)} />
      </div>
    </div>
  )
}
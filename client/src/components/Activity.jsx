//this is for the activity tracker on the profile page: your numbers, a calendar of finished tasks, and progress per project
import { useEffect, useState } from 'react'
import { getOverview, onChange } from '../db.js'
import { myActivity, WEEKS } from '../engine/activity.js'

//this is for how dark a calendar square is (0 means nothing finished that day)
function level(n) {
return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3
}

export default function Activity({ projects, userId }) {
const [data, setData] = useState(null)
const key = projects.map(p => p.id).join(',')

//this is for loading the tasks of every project, and again when anything changes
useEffect(() => {
    let alive = true
    const load = () => getOverview(projects.map(p => p.id)).then(o => { if (alive) setData(o) }).catch(() => {})
    load()
    const stop = onChange(['tasks'], load)
    return () => { alive = false; stop() }
}, [key])

if (!data) return null
const a = myActivity(data.tasks, projects, userId)
if (a.counts.total === 0) return (
    <section className="activity">
    <h3 className="h-ico">Your activity</h3>
    <p className="empty">Nothing assigned to you yet. When it is, your progress shows up here.</p>
    </section>
)

const tile = (n, label, warn) => <div className={'stat' + (warn && n > 0 ? ' warn' : '')}><strong>{n}</strong><span>{label}</span></div>

return (
    <section className="activity" aria-label="Your activity">
    <h3 className="h-ico">Your activity</h3>
    <div className="summary">
        {tile(a.counts.done, 'done')}
        {tile(a.counts.inProgress, 'in progress')}
        {tile(a.counts.todo, 'to do')}
        {tile(a.counts.overdue, 'overdue', true)}
    </div>

    {/*this is for the calendar: each square is a day, darker means more tasks finished that day*/}
    <h4>Finished tasks, last {WEEKS} weeks</h4>
    <div className="heat" role="img" aria-label={a.lastWeek + ' tasks finished in the last 7 days'}>
        {a.days.map(d => (
        <i key={d.date} className={'heat-day l' + level(d.count) + (d.future ? ' future' : '')} title={d.date + ': ' + d.count + (d.count === 1 ? ' task' : ' tasks') + ' finished'} />
        ))}
    </div>
    <p className="who">{a.lastWeek} finished in the last 7 days{a.streak > 1 ? ' · ' + a.streak + ' days in a row' : ''}</p>

    {/*this is for how far along your tasks are in each project*/}
    <h4>Your tasks by project</h4>
    {a.perProject.map(p => (
        <div key={p.id} className="proj-bar">
        <span>{p.name}</span>
        <div className="meter" aria-hidden="true"><div style={{ width: Math.round((p.done / p.total) * 100) + '%' }} /></div>
        <span className="who">{p.done} of {p.total} done</span>
        </div>
    ))}
    </section>
)
}
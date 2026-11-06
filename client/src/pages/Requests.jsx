//this is for the requests tab: admins decide, members watch their own
import { nameOf, requestText } from '../engine/labels.js'

const result_names = { pending: 'Waiting', approved: 'Approved', denied: 'Denied' }

export default function Requests({ requests, tasks, users, isAdmin, onDecide }) {
const pending = requests.filter(r => r.status === 'pending')
const decided = requests.filter(r => r.status !== 'pending').slice(0, 10)

//this is for finding a task's name from its id
function taskName(id) {
    const t = tasks.find(t => t.id === id)
    return t ? t.name : 'Deleted task'
}

//this is for one request: the words on the left, the status and buttons on the right
function Card({ r }) {
    return (
    <div className="dash-task row-card">
        <img src="/icons/pen.svg" alt="" width="22" height="22" />
        <div className="grow">
        <strong>{taskName(r.taskId)}</strong>
        <span>{isAdmin ? nameOf(users, r.requestedBy) : 'You'} asked to {requestText(r)}</span>
        {r.reason && <span className="who">Reason: {r.reason}</span>}
        </div>
        <span className={'status status-' + r.status}>{result_names[r.status]}</span>
        {isAdmin && r.status === 'pending' && (
        <div className="actions">
            <button className="primary no-arrow with-icon" onClick={() => onDecide(r, true)}><img src="/icons/check-light.svg" alt="" width="18" height="18" /> Approve</button>
            <button className="with-icon" onClick={() => onDecide(r, false)}><img src="/icons/x.svg" alt="" width="18" height="18" /> Deny</button>
        </div>
        )}
    </div>
    )
}

return (
    <div className="narrow-page">
    <h2>Requests</h2>
    {isAdmin && <p className="who note-line"><img src="/icons/flag.svg" alt="" width="16" height="16" /> Approving a date change moves the task and every task that waits for it.</p>}

    <h3 className="h-ico"><img src="/icons/clock.svg" alt="" width="22" height="22" /> Waiting for a decision <span className="count">{pending.length}</span></h3>
    {pending.length === 0 && <p className="empty empty-line">No requests waiting.</p>}
    {pending.map(r => <Card key={r.id} r={r} />)}

    <h3 className="h-ico"><img src="/icons/circle-check.svg" alt="" width="22" height="22" /> Decided (last 10)</h3>
    {decided.length === 0 && <p className="empty empty-line">Nothing decided yet.</p>}
    {decided.map(r => <Card key={r.id} r={r} />)}
    </div>
    )
}

//this is for the requests tab: admins decide, members watch their own
import { nameOf, requestText } from '../labels.js'

const result_names = { pending: 'Waiting', approved: 'Approved', denied: 'Denied' }

export default function Requests({ requests, tasks, users, isAdmin, onDecide }) {
const pending = requests.filter(r => r.status === 'pending')
const decided = requests.filter(r => r.status !== 'pending').slice(0, 10)

//this is for finding a task's name from its id
function taskName(id) {
    const t = tasks.find(t => t.id === id)
    return t ? t.name : 'Deleted task'
}

//this is for one request
function Card({ r }) {
    return (
    <div className="dash-task">
        <strong>{taskName(r.taskId)}</strong>
        <span>{isAdmin ? nameOf(users, r.requestedBy) : 'You'} asked to {requestText(r)}</span>
        {r.reason && <span className="who">Reason: {r.reason}</span>}
        <span className={'status status-' + r.status}>{result_names[r.status]}</span>
        {isAdmin && r.status === 'pending' && (
        <div>
            <button onClick={() => onDecide(r, true)}>Approve</button>{' '}
            <button onClick={() => onDecide(r, false)}>Deny</button>
        </div>
        )}
    </div>
    )
}

return (
    <div>
    <h2>Requests</h2>
    {isAdmin && <p className="who">Approving a date change moves the task and every task that waits for it.</p>}

    <h3>Waiting for a decision ({pending.length})</h3>
    {pending.length === 0 && <p className="empty">No requests waiting.</p>}
    {pending.map(r => <Card key={r.id} r={r} />)}

    <h3>Decided (last 10)</h3>
    {decided.length === 0 && <p className="empty">Nothing decided yet.</p>}
    {decided.map(r => <Card key={r.id} r={r} />)}
    </div>
)
}
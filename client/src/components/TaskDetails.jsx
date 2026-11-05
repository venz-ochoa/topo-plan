//this is for the popup window that opens when a task is clicked
import { useEffect, useRef, useState } from 'react'
import { status_names, status_list, nameOf, daysText, requestText } from '../labels.js'

//this is for the words in the "I want to" box
const kind_names = { status: 'Change the status', extension: 'Move the dates' }

export default function TaskDetails({
task, tasks, users, userId, isAdmin, info, requests, message,
onClose, onStatus, onAssign, onAsk, onDecide,
}) {
const dialogRef = useRef(null)

//this is for the request form
const [chosenKind, setChosenKind] = useState('status')
const [newStatus, setNewStatus] = useState('')
const [days, setDays] = useState(1)
const [reason, setReason] = useState('')
const [busy, setBusy] = useState(false)

//this is for opening the popup when this component appears
useEffect(() => {
    const d = dialogRef.current
    if (d && !d.open) d.showModal()
}, [])

//this is for knowing who is looking at the task
const isMine = task.assignedTo === userId
const assigneeName = task.assignedTo ? nameOf(users, task.assignedTo) : 'Nobody yet'
const dependsOn = task.dependsOn.map(id => tasks.find(t => t.id === id)).filter(Boolean).map(t => t.name)

//this is for the requests waiting on this task
const pending = requests.filter(r => r.taskId === task.id && r.status === 'pending')
const pendingStatus = pending.find(r => r.kind === 'status')
const pendingExtension = pending.find(r => r.kind === 'extension')

//this is for which kinds of request can still be sent
const available = []
if (!pendingStatus) available.push('status')
if (!pendingExtension && task.status !== 'done') available.push('extension')
const kind = available.includes(chosenKind) ? chosenKind : available[0]

//this is for the status choices (everything except the current one)
const statusChoices = status_list.filter(s => s !== task.status)
const pickedStatus = statusChoices.includes(newStatus) ? newStatus : statusChoices[0]

//this is for sending a request to the admins
async function handleAsk(e) {
    e.preventDefault()
    setBusy(true)
    await onAsk(task.id, kind, kind === 'status' ? pickedStatus : days, reason.trim())
    setReason('')
    setBusy(false)
}

return (
    <dialog
    ref={dialogRef}
    className="task-modal"
    aria-label={'Details of ' + task.name}
    onClose={onClose}
    onClick={e => {
        //this is for closing when the dark area outside the window is clicked
        if (e.target === dialogRef.current) dialogRef.current.close()
    }}
    >
    <div className="modal-body">
        <div>
        <button type="button" onClick={() => dialogRef.current.close()}>Close</button>
        </div>

        <h2>{task.name}</h2>

        {message && <div className="error-box" role="alert">{message}</div>}

        <p>Assigned to: <strong>{assigneeName}</strong></p>

        {/*this is for how critical the task is*/}
        <p>
        Critical path:{' '}
        {info
            ? info.critical
            ? 'Critical. No buffer, so a delay moves the project end date.'
            : 'Not critical. ' + info.slack + '-day buffer.'
            : 'Not calculated.'}
        </p>

        <p>Dates: {task.startDate} to {task.endDate}</p>
        <p>Priority: {task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium'}</p>
        <p>Depends on: {dependsOn.length > 0 ? dependsOn.join(', ') : 'Nothing'}</p>

        {/*this is for admins to change who the task is assigned to*/}
        {isAdmin && (
        <div>
            <label htmlFor="details-assign">Change assignee</label>{' '}
            <select id="details-assign" value={task.assignedTo || ''} onChange={e => onAssign(task.id, e.target.value)}>
            <option value="">Nobody</option>
            {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
            ))}
            </select>
        </div>
        )}

        <h3>Status</h3>
        <p><span className={'status status-' + task.status}>{status_names[task.status]}</span></p>

        {/*this is for an admin who is assigned to the task: no approval needed*/}
        {isMine && isAdmin && (
        <div>
            <label htmlFor="details-status">Change status</label>{' '}
            <select id="details-status" value={task.status} onChange={e => onStatus(task.id, e.target.value)}>
            {status_list.map(s => (
                <option key={s} value={s}>{status_names[s]}</option>
            ))}
            </select>
        </div>
        )}

        {/*this is for requests the admin needs to decide*/}
        {isAdmin && pending.length > 0 && (
        <div>
            <h3>Waiting for your decision</h3>
            {pending.map(r => (
            <div key={r.id}>
                <p>{nameOf(users, r.requestedBy)} asked to {requestText(r)}.{r.reason ? ' Reason: ' + r.reason : ''}</p>
                <button type="button" onClick={() => onDecide(r, true)}>Approve</button>{' '}
                <button type="button" onClick={() => onDecide(r, false)}>Deny</button>
            </div>
            ))}
        </div>
        )}

        {/*this is for the assigned member: their waiting requests and the request form*/}
        {isMine && !isAdmin && pending.map(r => (
        <p key={r.id}>You asked to {requestText(r)}. Waiting for an admin.</p>
        ))}

        {isMine && !isAdmin && available.length > 0 && (
        <form onSubmit={handleAsk}>
            <h3>Ask an admin</h3>
            <p className="who">Status changes and date changes only happen after an admin approves them.</p>
            <div>
            <label htmlFor="ask-kind">I want to</label>{' '}
            <select id="ask-kind" value={kind} onChange={e => setChosenKind(e.target.value)}>
                {available.map(k => (
                <option key={k} value={k}>{kind_names[k]}</option>
                ))}
            </select>
            </div>

            {kind === 'status' && (
            <div>
                <label htmlFor="ask-status">New status</label>{' '}
                <select id="ask-status" value={pickedStatus} onChange={e => setNewStatus(e.target.value)}>
                {statusChoices.map(s => (
                    <option key={s} value={s}>{status_names[s]}</option>
                ))}
                </select>
            </div>
            )}

            {kind === 'extension' && (
            <div>
                <label htmlFor="ask-days">Move it</label>{' '}
                <select id="ask-days" value={days} onChange={e => setDays(Number(e.target.value))}>
                <option value={1}>{daysText(1)}</option>
                <option value={-1}>{daysText(-1)}</option>
                </select>
            </div>
            )}

            <div>
            <label htmlFor="ask-reason">Reason (optional)</label>{' '}
            <input id="ask-reason" maxLength={200} value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <button type="submit" disabled={busy}>Send request</button>
        </form>
        )}

        {/*this is for everyone else*/}
        {!isMine && (
        <p className="who">Only {task.assignedTo ? assigneeName : 'the assigned person'} can ask for changes to this task.</p>
        )}
    </div>
    </dialog>
)
}
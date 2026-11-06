//this is for the popup window that opens when a task is clicked
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Contours.jsx'
import { status_names, status_list, nameOf, daysText, requestText } from '../engine/labels.js'
import { statusBlockReason, unfinishedDeps, dependencyChoices, needsAssignee } from '../engine/rules.js'

//this is for the words in the "I want to" box
const kind_names = { status: 'Change the status', extension: 'Move the dates' }

export default function TaskDetails({
task, tasks, users, userId, isAdmin, info, requests, message,
onClose, onStatus, onAssign, onAsk, onDecide, onDelete, onEdit,
}) {
const dialogRef = useRef(null)

//this is for the request form
const [chosenKind, setChosenKind] = useState('status')
const [newStatus, setNewStatus] = useState('')
const [days, setDays] = useState(1)
const [reason, setReason] = useState('')
const [busy, setBusy] = useState(false)
//this is for the big confirmation after a request was sent
const [sent, setSent] = useState('')

//this is for opening the popup when this component appears
useEffect(() => {
    const d = dialogRef.current
    if (d && !d.open) d.showModal()
}, [])

//this is for knowing who is looking at the task
const isMine = task.assignedTo === userId
//this is for a complete task: it is locked, nothing about it can change
const locked = task.status === 'done'
const waitingOn = unfinishedDeps(task, tasks)
//this is for a task nobody has: admins must assign someone (even themselves) before editing it
const noOwner = needsAssignee(task)
const assigneeName = task.assignedTo ? nameOf(users, task.assignedTo) : 'Nobody yet'
const dependsOn = task.dependsOn.map(id => tasks.find(t => t.id === id)).filter(Boolean).map(t => t.name)

//this is for the requests waiting on this task
const pending = requests.filter(r => r.taskId === task.id && r.status === 'pending')
const pendingStatus = pending.find(r => r.kind === 'status')
const pendingExtension = pending.find(r => r.kind === 'extension')

//this is for which kinds of request can still be sent
const available = []
//this is for a status request: only the statuses that are allowed right now can be asked for
const statusChoices = status_list.filter(s => s !== task.status && !statusBlockReason(task, s, tasks))
if (!pendingStatus && !locked && statusChoices.length > 0) available.push('status')
if (!pendingExtension && !locked) available.push('extension')
const kind = available.includes(chosenKind) ? chosenKind : available[0]

const pickedStatus = statusChoices.includes(newStatus) ? newStatus : statusChoices[0]

//this is for sending a request to the admins
async function handleAsk(e) {
    e.preventDefault()
    setBusy(true)
    const ok = await onAsk(task.id, kind, kind === 'status' ? pickedStatus : days, reason.trim())
    setReason('')
    setBusy(false)
    //this is for the confirmation that cannot be missed
    if (ok) setSent(kind === 'status' ? 'Your request to change the status to ' + status_names[pickedStatus] + ' was sent to the admins.' : 'Your request to move this task ' + daysText(days) + ' was sent to the admins.')
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
        <button type="button" className="x" aria-label="Close" onClick={() => dialogRef.current.close()}><Icon name="x" /></button>

        <h2>{task.name}</h2>

        {message && <div className="error-box" role="alert">{message}</div>}

        {locked && <div className="locked-box"><img src="/icons/lock.svg" alt="" width="20" height="20" /> This task is done. It is locked, so its status, dates, priority and assignee can no longer change.</div>}

        {/*this is for the facts of the task, label on the left and answer on the right*/}
        <dl className="facts">
        <dt>Assigned to</dt><dd><strong>{assigneeName}</strong></dd>
        <dt>Critical path</dt>
        <dd>
            {info
            ? info.critical
                ? 'Critical. No buffer, so a delay moves the project end date.'
                : 'Not critical. ' + info.slack + '-day buffer.'
            : 'Not calculated.'}
        </dd>
        <dt>Dates</dt><dd>{task.startDate} to {task.endDate}</dd>
        <dt>Priority</dt><dd>{task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium'}</dd>
        <dt>Depends on</dt><dd>{dependsOn.length > 0 ? dependsOn.join(', ') : 'Nothing'}</dd>
        </dl>

        {/*this is for admins to change the priority and the task this one waits for*/}
        {isAdmin && !locked && noOwner && <p className="who">Nobody is assigned yet. Assign someone below (you can pick yourself) to unlock priority, dependency and dates.</p>}
        {isAdmin && !locked && (
        <div className="edit-grid">
            <div className="field">
            <label htmlFor="details-priority">Priority</label>
            <select id="details-priority" disabled={noOwner} value={task.priority} onChange={e => onEdit(task.id, { priority: e.target.value })}>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
            </select>
            </div>
            <div className="field">
            <label htmlFor="details-dep">Depends on</label>
            <select id="details-dep" disabled={noOwner} value={task.dependsOn[0] || ''} onChange={e => onEdit(task.id, { dependsOn: e.target.value ? [e.target.value] : [] })}>
                <option value="">Nothing</option>
                {dependencyChoices(task, tasks).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            </div>
        </div>
        )}

        {/*this is for admins to change who the task is assigned to*/}
        {isAdmin && !locked && (
        <div className="field">
            <label htmlFor="details-assign">Assigned to</label>
            <select id="details-assign" value={task.assignedTo || ''} onChange={e => onAssign(task.id, e.target.value)}>
            <option value="">Nobody</option>
            {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
            ))}
            </select>
        </div>
        )}

        {/*this is for admins to delete the task*/}
        {isAdmin && <div><button type="button" onClick={() => onDelete(task.id)}>Delete task</button></div>}

        <h3>Status</h3>
        <p><span className={'status status-' + task.status}>{status_names[task.status]}</span></p>

        {/*this is for an admin who is assigned to the task: no approval needed*/}
        {isMine && isAdmin && !locked && (
        <div className="field">
            <label htmlFor="details-status">Change status</label>
            <select id="details-status" value={task.status} onChange={e => onStatus(task.id, e.target.value)}>
            {status_list.map(s => (
                <option key={s} value={s} disabled={s !== task.status && !!statusBlockReason(task, s, tasks)}>{status_names[s]}</option>
            ))}
            </select>
        </div>
        )}

        {/*this is for a task that cannot start yet*/}
        {!locked && waitingOn.length > 0 && <p className="who">It cannot be in progress or done until {waitingOn.map(t => t.name).join(', ')} {waitingOn.length === 1 ? 'is' : 'are'} done.</p>}

        {/*this is for requests the admin needs to decide*/}
        {isAdmin && !locked && pending.length > 0 && (
        <div>
            <h3>Waiting for your decision</h3>
            {pending.map(r => (
            <div key={r.id}>
                <p>{nameOf(users, r.requestedBy)} asked to {requestText(r)}.{r.reason ? ' Reason: ' + r.reason : ''}</p>
                <button type="button" className="primary" onClick={() => onDecide(r, true)}>Approve</button>{' '}
                <button type="button" onClick={() => onDecide(r, false)}>Deny</button>
            </div>
            ))}
        </div>
        )}

        {/*this is for the assigned member: their waiting requests and the request form*/}
        {isMine && !isAdmin && pending.map(r => (
        <p key={r.id}>You asked to {requestText(r)}. Waiting for an admin.</p>
        ))}

        {/*this is for the confirmation after sending: big, with a check mark*/}
        {sent && (
        <div className="sent-box" role="status">
            <img src="/icons/circle-check.svg" alt="" width="32" height="32" />
            <div>
            <strong>Request sent</strong>
            <p>{sent}</p>
            <button type="button" onClick={() => dialogRef.current.close()}>Done</button>
            </div>
        </div>
        )}

        {isMine && !isAdmin && !locked && !sent && available.length > 0 && (
        <form className="ask-form" onSubmit={handleAsk}>
            <h3>Ask an admin</h3>
            <p className="who">Status changes and date changes only happen after an admin approves them.</p>
            <div className="field">
            <label htmlFor="ask-kind">I want to</label>
            <select id="ask-kind" value={kind} onChange={e => setChosenKind(e.target.value)}>
                {available.map(k => (
                <option key={k} value={k}>{kind_names[k]}</option>
                ))}
            </select>
            </div>

            {kind === 'status' && (
            <div className="field">
                <label htmlFor="ask-status">New status</label>
                <select id="ask-status" value={pickedStatus} onChange={e => setNewStatus(e.target.value)}>
                {statusChoices.map(s => (
                    <option key={s} value={s}>{status_names[s]}</option>
                ))}
                </select>
            </div>
            )}

            {kind === 'extension' && (
            <div className="field">
                <label htmlFor="ask-days">Move it</label>
                <select id="ask-days" value={days} onChange={e => setDays(Number(e.target.value))}>
                <option value={1}>{daysText(1)}</option>
                <option value={-1}>{daysText(-1)}</option>
                </select>
            </div>
            )}

            <div className="field">
            <label htmlFor="ask-reason">Reason (optional)</label>
            <input id="ask-reason" maxLength={200} value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <button type="submit" className="primary" disabled={busy}>{busy ? 'Sending...' : 'Send request'}</button>
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
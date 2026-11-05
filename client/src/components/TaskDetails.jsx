//this is for the panel that opens when a task is clicked
import { useState } from 'react'
import { status_names, status_list, nameOf, daysText } from '../labels.js'

//this is for the choices in the request box (1 means a day later, -1 a day earlier)
const day_choices = [1, -1]

export default function TaskDetails({ task, tasks, users, userId, isAdmin, pending, onClose, onStatus, onAssign, onAsk }) {
  //this is for the request box
  const [days, setDays] = useState(1)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  //this is for knowing if the task is assigned to the person looking at it
  const isMine = task.assignedTo === userId
  const dependsOn = task.dependsOn.map(id => tasks.find(t => t.id === id)).filter(Boolean).map(t => t.name)

  //this is for sending a request to the admins
  async function handleAsk(e) {
    e.preventDefault()
    setBusy(true)
    await onAsk(task.id, days, reason.trim())
    setReason('')
    setBusy(false)
  }

  return (
    <section className="task-details" role="dialog" aria-label={'Details of ' + task.name}>
      <div>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      <h2>{task.name}</h2>
      <p><span className={'status status-' + task.status}>{status_names[task.status]}</span></p>

      <p>Assigned to: {task.assignedTo ? nameOf(users, task.assignedTo) : 'Nobody yet'}</p>

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

      <p>Dates: {task.startDate} to {task.endDate}</p>
      <p>Priority: {task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium'}</p>
      <p>Depends on: {dependsOn.length > 0 ? dependsOn.join(', ') : 'Nothing'}</p>

      {/*this is for the status: only the assigned person can change it*/}
      {isMine ? (
        <div>
          <label htmlFor="details-status">Status</label>{' '}
          <select id="details-status" value={task.status} onChange={e => onStatus(task.id, e.target.value)}>
            {status_list.map(s => (
              <option key={s} value={s}>{status_names[s]}</option>
            ))}
          </select>
        </div>
      ) : (
        <p className="who">Only {task.assignedTo ? nameOf(users, task.assignedTo) : 'the assigned person'} can change the status.</p>
      )}

      {/*this is for a waiting request on this task*/}
      {pending && isMine && <p>You asked to move this {daysText(pending.days)}. Waiting for an admin.</p>}
      {pending && !isMine && <p>{nameOf(users, pending.requestedBy)} asked to move this {daysText(pending.days)}. See the Requests tab.</p>}

      {/*this is for asking an admin to move the task (members assigned to it only)*/}
      {isMine && !isAdmin && !pending && task.status !== 'done' && (
        <form onSubmit={handleAsk}>
          <h3>Ask an admin to move this task</h3>
          <label htmlFor="ask-days">Move it</label>{' '}
          <select id="ask-days" value={days} onChange={e => setDays(Number(e.target.value))}>
            {day_choices.map(d => (
              <option key={d} value={d}>{daysText(d)}</option>
            ))}
          </select>
          <div>
            <label htmlFor="ask-reason">Reason (optional)</label>{' '}
            <input id="ask-reason" maxLength={200} value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <button type="submit" disabled={busy}>Send request</button>
        </form>
      )}
    </section>
  )
}

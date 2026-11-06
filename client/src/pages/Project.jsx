//this is for the project page: tabs, loading tasks and requests, and saving them
import { useState, useEffect, useRef } from 'react'
import Dashboard from './Dashboard.jsx'
import Home from './Home.jsx'
import Requests from './Requests.jsx'
import { Loading } from '../components/Contours.jsx'
import TaskDetails from '../components/TaskDetails.jsx'
import {
getTasks, getUsers, getRequests, saveTasks, addDoneTask, updateStatus,
sendRequest, decideRequest, makeInvite, makeEmailInvite, deleteProject, toRow, deleteTask, removeFromProject, setMemberRole, transferOwnership, onChange,
} from '../db.js'
import { roleName, roleIcon } from '../engine/labels.js'
import { friendly } from '../engine/errors.js'
import { shiftTask, reschedule, toDateStr, analyzeTasks } from '../engine/schedule.js'
import { statusBlockReason, needsAssignee } from '../engine/rules.js'

//this is for the row of buttons that picks whose tasks to show: everyone, you, nobody yet, or one person
function WhoFilter({ users, tasks, userId, value, onChange }) {
const count = f => tasks.filter(f).length
const options = [
    { id: 'all', label: 'Everyone', n: tasks.length },
    { id: 'mine', label: 'Assigned to you', n: count(t => t.assignedTo === userId) },
    { id: 'none', label: 'Not assigned yet', n: count(t => !t.assignedTo) },
]
return (
    <div className="filter-bar" role="group" aria-label="Show tasks of">
    <span className="who">Show</span>
    {options.map(o => (
        <button key={o.id} type="button" className={'pill' + (value === o.id ? ' on' : '')} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
        {o.label} <span className="count">{o.n}</span>
        </button>
    ))}
    </div>
)
}

export default function Project({ project, userId, initialTaskId = null, onLeft }) {
//this is for knowing if the user can edit the timeline
const isAdmin = project.role === 'admin'
const isOwner = !!project.isOwner

const [tab, setTab] = useState('dashboard')
const [tasks, setTasks] = useState([])
const [users, setUsers] = useState([])
const [requests, setRequests] = useState([])
//this is for the task whose details panel is open (it starts open when the user clicked a task on the dashboard)
const [selectedId, setSelectedId] = useState(initialTaskId)
const [loading, setLoading] = useState(true)
const [message, setMessage] = useState('')
//this is for the box that confirms something worked (a request sent, a decision saved)
const [notice, setNotice] = useState('')
//this is for showing only one person's tasks: 'all', 'mine', 'none' (nobody yet) or a person's id
const [who, setWho] = useState('all')

//this is for always knowing the newest tasks, even inside a click that happened before the screen redrew
const tasksRef = useRef([])
//this is for saving one change at a time, in order, so fast clicks cannot overwrite each other
const saveQueue = useRef(Promise.resolve())
const pendingSaves = useRef(0)
const reloadLater = useRef(false)

//this is for the invite tab (the made invite remembers which role it is for)
const [inviteRole, setInviteRole] = useState('member')
const [invite, setInvite] = useState(null)
const [copied, setCopied] = useState(false)
const [inviteEmail, setInviteEmail] = useState('')

//this is for loading everything when the page opens, then again whenever anyone changes something (live updates)
useEffect(() => {
    load()
    return onChange(['tasks', 'requests', 'roles'], load)
}, [])

async function load() {
    //this is for waiting: loading now would bring back old dates over the change that is still being saved
    if (pendingSaves.current > 0) {
    reloadLater.current = true
    return
    }
    try {
    const [taskList, userList, requestList] = await Promise.all([
        getTasks(project.id),
        getUsers(project.id),
        getRequests(project.id),
    ])
    tasksRef.current = taskList
    setTasks(taskList)
    setUsers(userList)
    setRequests(requestList)
    } catch (e) {
    setMessage(friendly(e))
    }
    setLoading(false)
}

//this is for loading only the requests
async function loadRequests() {
    try {
    setRequests(await getRequests(project.id))
    } catch (e) {
    //this is for ignoring a failed check, the next one will try again
    }
}

//this is for saving a new list of tasks (only the changed ones go to the database)
//the screen changes at once, the saves wait in line so fast clicks never undo each other
function changeTasks(newTasks) {
    setMessage('')
    const before = tasksRef.current
    const full = newTasks.map(t => ({ status: 'not_done', finishedAt: null, ...t }))
    const changed = full.filter(t => {
    const old = before.find(o => o.id === t.id)
    return !old || JSON.stringify(toRow(old, project.id)) !== JSON.stringify(toRow(t, project.id))
    })
    tasksRef.current = full
    setTasks(full)
    if (changed.length === 0) return Promise.resolve()

    pendingSaves.current += 1
    saveQueue.current = saveQueue.current.then(async () => {
    try {
        await saveTasks(project.id, changed)
    } catch (e) {
        setMessage('Could not save: ' + friendly(e))
        reloadLater.current = true
    }
    pendingSaves.current -= 1
    //this is for loading once, after the last save is done
    if (pendingSaves.current === 0 && reloadLater.current) {
        reloadLater.current = false
        load()
    }
    })
    return saveQueue.current
}

//this is for moving a task and the tasks that wait for it, always from the newest tasks
function slip(id, move) {
    const current = tasksRef.current
    const task = current.find(t => t.id === id)
    if (!task || task.status === 'done') return
    if (needsAssignee(task)) {
    setMessage('Assign this task to someone first. An admin can assign it to themselves.')
    return
    }
    if (move < 0 && task.startDate <= toDateStr(new Date())) return
    changeTasks(shiftTask(current, id, move))
}

//this is for adding a task
async function addTask(task) {
    //this is for a task that starts in the past: it is saved as complete
    if (task.startDate < toDateStr(new Date())) {
    try { await addDoneTask(project.id, task); load() } catch (e) { setMessage(friendly(e)) }
    return
    }
    changeTasks(reschedule([...tasksRef.current, task]))
}

//this is for an admin changing the priority or the task it waits for (a complete task is locked)
function editTask(id, patch) {
    const current = tasksRef.current
    const task = current.find(t => t.id === id)
    if (!task || task.status === 'done') return
    if (needsAssignee(task)) {
    setMessage('Assign this task to someone first. An admin can assign it to themselves.')
    return
    }
    changeTasks(reschedule(current.map(t => (t.id === id ? { ...t, ...patch } : t))))
}

//this is for changing the status of one task
async function changeStatus(id, status) {
    setMessage('')
    const task = tasksRef.current.find(t => t.id === id)
    const blocked = task && needsAssignee(task) ? 'Assign this task to someone first.' : task ? statusBlockReason(task, status, tasksRef.current) : ''
    if (blocked) {
    setMessage(blocked)
    return
    }
    const next = tasksRef.current.map(t => (t.id === id ? { ...t, status: status, finishedAt: status === 'done' ? new Date().toISOString() : null } : t))
    tasksRef.current = next
    setTasks(next)
    try {
    await updateStatus(id, status)
    } catch (e) {
    setMessage('Could not change status: ' + friendly(e))
    load()
    }
}

//this is for an admin changing who a task is assigned to
function assign(taskId, personId) {
    const task = tasksRef.current.find(t => t.id === taskId)
    if (task && task.status === 'done') return
    changeTasks(tasksRef.current.map(t => (t.id === taskId ? { ...t, assignedTo: personId || null } : t)))
}

//this is for sending a request to the admins
async function ask(taskId, kind, value, reason) {
    setMessage('')
    try {
    //this is for a status request (value is the new status) or an extension request (value is 1 or -1 days)
    await sendRequest({
        projectId: project.id,
        taskId,
        userId,
        kind,
        days: kind === 'extension' ? value : null,
        newStatus: kind === 'status' ? value : null,
        reason,
    })
    await loadRequests()
    setNotice('Request sent. An admin will see it and decide.')
    return true
    } catch (e) {
    setMessage(friendly(e))
    return false
    }
}

//this is for approving or denying a request (approving moves the task and the tasks that wait for it)
async function decide(req, approve) {
    setMessage('')
    const task = tasksRef.current.find(t => t.id === req.taskId)

    //this is for a complete task: it is locked, so nothing about it can change
    if (approve && task && task.status === 'done') {
    setMessage('This task is done, so it is locked. Deny the request instead.')
    return
    }

    //this is for a status request that would break the order (it cannot start or finish before the tasks it waits for)
    if (approve && task && req.kind === 'status') {
    const blocked = statusBlockReason(task, req.newStatus, tasksRef.current)
    if (blocked) {
        setMessage('Cannot approve yet. ' + blocked + ' Deny the request, or approve it after that.')
        return
    }
    }

    //this is for stopping an approval that would move a task before today (date requests only)
    const isExtension = req.kind === 'extension'
    if (approve && isExtension && task && req.days < 0 && task.startDate <= toDateStr(new Date())) {
    setMessage('This task already starts today, so it cannot move earlier. Deny the request instead.')
    return
    }

    //this is for saving the decision first, so a request can never be approved twice
    try {
    await decideRequest(req.id, approve)
    } catch (e) {
    setMessage(friendly(e))
    loadRequests()
    return
    }

    //this is for moving the task after the approval is saved (date requests)
    if (approve && task && isExtension) await changeTasks(shiftTask(tasksRef.current, task.id, req.days))
    //this is for a status request: the database already changed the status, so load the tasks again
    if (approve && req.kind === 'status') await load()
    loadRequests()
    setNotice(approve ? 'Request approved.' : 'Request denied.')
}

//this is for deleting a task (the tasks that waited for it stop waiting)
async function removeTask(id) {
    if (!confirm('Delete this task?')) return
    setMessage('')
    try {
    await deleteTask(id)
    setSelectedId(null)
    await changeTasks(tasksRef.current.filter(t => t.id !== id).map(t => ({ ...t, dependsOn: t.dependsOn.filter(d => d !== id) })))
    } catch (e) {
    setMessage(friendly(e))
    }
}

//this is for leaving the project (yourself) or removing a member (admins only)
async function removePerson(person) {
    const self = person.id === userId
    if (!confirm(self ? 'Leave ' + project.name + '?' : 'Remove ' + person.name + ' from the project?')) return
    setMessage('')
    try {
    await removeFromProject(project.id, person.id)
    if (self) onLeft()
    else load()
    } catch (e) {
    setMessage(friendly(e))
    }
}

//this is for inviting one email address: they see the invite on their Dashboard (and in Notifications) when they log in with that email
async function handleEmailInvite() {
    setMessage('')
    const email = inviteEmail.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setMessage('That is not a valid email address.'); return }
    try {
    await makeEmailInvite(project.id, inviteRole, email)
    setInviteEmail('')
    setNotice('Invite made for ' + email + '. They will see it on their Dashboard when they log in with that email.')
    } catch (e) {
    setMessage(friendly(e))
    }
}

//this is for the owner deleting the whole project
async function removeProject() {
    if (!confirm('Delete ' + project.name + ' for everyone? All its tasks and requests are lost. This cannot be undone.')) return
    if (prompt('Type the project name to confirm:') !== project.name) { setMessage('The name did not match, so nothing was deleted.'); return }
    setMessage('')
    try {
    await deleteProject(project.id)
    onLeft()
    } catch (e) {
    setMessage(friendly(e))
    }
}

//this is for making someone an admin or a member
async function changeRole(person, role) {
    setMessage('')
    try {
    await setMemberRole(project.id, person.id, role)
    load()
    } catch (e) {
    setMessage(friendly(e))
    }
}

//this is for the owner handing the project to another admin (the owner stays an admin)
async function giveOwnership(person) {
    if (!confirm('Make ' + person.name + ' the owner of ' + project.name + '? You will stay an admin.')) return
    setMessage('')
    try {
    await transferOwnership(project.id, person.id)
    await load()
    onLeft()
    } catch (e) {
    setMessage(friendly(e))
    }
}

//this is for making an invite link
async function handleInvite() {
    setMessage('')
    try {
    const code = await makeInvite(project.id, inviteRole)
    setCopied(false)
    setInvite({ role: inviteRole, link: window.location.origin + window.location.pathname + '#join=' + code })
    } catch (e) {
    setMessage(friendly(e))
    }
}

//this is for hiding the confirmation after a few seconds
useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
}, [notice])

if (loading) return <Loading />

//this is for the open details panel and the waiting request on that task
const selected = tasks.find(t => t.id === selectedId)
const { analysis, error: analysisError } = analyzeTasks(tasks)
const shownTasks = tasks.filter(t => who === 'all' ? true : who === 'mine' ? t.assignedTo === userId : who === 'none' ? !t.assignedTo : t.assignedTo === who)
const myOpen = tasks.some(t => t.assignedTo === userId && t.status !== 'done')
const pendingCount = requests.filter(r => r.status === 'pending').length

return (
    <div>
    <p className="eyebrow">Project · {roleName(project.role, project.isOwner)}</p>
    <h1>{project.name}</h1>
    {project.description && <p className="desc">{project.description}</p>}
    {myOpen && isAdmin
    ? <p className="who">Finish your tasks to be able to leave.</p>
    : <p><button className="link small with-icon" onClick={() => removePerson({ id: userId })}><img src="/icons/leave.svg" alt="" width="16" height="16" /> Leave project</button></p>}
    {isOwner && <p className="who">You own this project. If you leave, ownership goes to another admin, or <button className="link small" onClick={removeProject}>delete the project</button>.</p>}

    {/*this is for the tabs (the open one is underlined)*/}
    <nav className="tabs" aria-label="Project sections">
        <button onClick={() => setTab('dashboard')} aria-current={tab === 'dashboard' ? 'page' : undefined}><img src="/icons/tasks.svg" alt="" width="18" height="18" /> Tasks</button>
        <button onClick={() => setTab('timeline')} aria-current={tab === 'timeline' ? 'page' : undefined}><img src="/icons/timeline.svg" alt="" width="18" height="18" /> Timeline</button>
        <button onClick={() => setTab('requests')} aria-current={tab === 'requests' ? 'page' : undefined}>
        <img src="/icons/inbox.svg" alt="" width="18" height="18" /> Requests{isAdmin && pendingCount > 0 ? ' (' + pendingCount + ')' : ''}
        </button>
        {isAdmin && <button onClick={() => setTab('invite')} aria-current={tab === 'invite' ? 'page' : undefined}><img src="/icons/user-plus.svg" alt="" width="18" height="18" /> Invite</button>}
    </nav>

    {message && !selected && <div className="error-box" role="alert">{message}</div>}

    {/*this is for the box that confirms something worked (it stays on screen for a few seconds)*/}
    {notice && (
        <div className="toast" role="status">
        <img src="/icons/circle-check.svg" alt="" width="22" height="22" />
        <span>{notice}</span>
        <button type="button" className="link small" onClick={() => setNotice('')}>Dismiss</button>
        </div>
    )}

    {/*this is for the details panel that opens when a task is clicked*/}
    {selected && (
        <TaskDetails
        key={selected.id}
        task={selected}
        tasks={tasks}
        users={users}
        userId={userId}
        isAdmin={isAdmin}
        info={analysis ? analysis[selected.id] : null}
        requests={requests}
        message={message}
        onEdit={editTask}
        onClose={() => setSelectedId(null)}
        onStatus={changeStatus}
        onAssign={assign}
        onAsk={ask}
        onDecide={decide}
        onDelete={removeTask}
        />
    )}

    {/*this is for choosing whose tasks the Tasks and Timeline tabs show*/}
    {(tab === 'dashboard' || tab === 'timeline') && (
        <WhoFilter users={users} tasks={tasks} userId={userId} value={who} onChange={setWho} />
    )}

    {tab === 'dashboard' && <Dashboard tasks={shownTasks} allTasks={tasks} userId={userId} users={users} onOpen={setSelectedId} />}

    {tab === 'timeline' && <Home tasks={tasks} shown={shownTasks} users={users} analysis={analysis} error={analysisError} isAdmin={isAdmin} onAdd={addTask} onSlip={slip} onOpen={setSelectedId} />}

    {tab === 'requests' && <Requests requests={requests} tasks={tasks} users={users} isAdmin={isAdmin} onDecide={decide} />}

    {/*this is for the invite tab, only admins can open it*/}
    {tab === 'invite' && isAdmin && (
        <div>
        <h2>Invite someone</h2>
        <div className="add-task">
        <div className="field">
            <label htmlFor="invite-role">They will be a</label>
            <div className="invite-row">
            <select id="invite-role" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                <option value="member">Member (can update their own tasks)</option>
                <option value="admin">Admin (can edit everything)</option>
            </select>
            <button className="primary" onClick={handleInvite}>Make invite link</button>
            </div>
        </div>

        <div className="field">
            <label htmlFor="invite-email">Or invite by email</label>
            <div className="invite-row">
            <input id="invite-email" type="email" placeholder="name@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            <button className="primary" onClick={handleEmailInvite}>Invite by email</button>
            </div>
            <p className="who">They get the role chosen above. The invite shows on their Dashboard once they log in with that email.</p>
        </div>

        {invite && (
            <div className="field">
            <p>This link makes them {invite.role === 'admin' ? 'an admin' : 'a member'}. It works once and expires in 7 days.</p>
            <div className="invite-row">
                <input readOnly value={invite.link} aria-label="Invite link" onFocus={e => e.target.select()} />
                <button onClick={() => { navigator.clipboard.writeText(invite.link); setCopied(true) }}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            </div>
        )}
        </div>

        <h3>Team ({users.length})</h3>
        <ul className="team">
        {users.map(u => (
            <li key={u.id} className="person">
            <span className={'avatar' + (u.isOwner || u.role === 'admin' ? ' admin' : '')}>{u.name.charAt(0)}</span>
            <span>
                <strong>{u.name}{u.id === userId ? ' (you)' : ''}</strong>
                <span className={'role-tag ' + (u.isOwner ? 'owner' : u.role === 'admin' ? 'admin' : '')}>
                <img src={roleIcon(u.role, u.isOwner)} alt="" width="16" height="16" /> {roleName(u.role, u.isOwner)}
                </span>
            </span>
            {u.id !== userId && !u.isOwner && (u.role === 'member' || isOwner) && (
                <span className="actions">
                {u.role === 'member' && <button className="with-icon" onClick={() => changeRole(u, 'admin')}><img src="/icons/shield.svg" alt="" width="18" height="18" /> Make admin</button>}
                {u.role === 'admin' && isOwner && <button className="with-icon" onClick={() => changeRole(u, 'member')}><img src="/icons/user.svg" alt="" width="18" height="18" /> Make member</button>}
                {u.role === 'admin' && isOwner && <button className="with-icon" onClick={() => giveOwnership(u)}><img src="/icons/crown.svg" alt="" width="18" height="18" /> Make owner</button>}
                <button className="with-icon" onClick={() => removePerson(u)}><img src="/icons/x.svg" alt="" width="18" height="18" /> Remove</button>
                </span>
            )}
            </li>
        ))}
        </ul>
        </div>
    )}
    </div>
)
}
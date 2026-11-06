//this is for the project page: tabs, loading tasks and requests, and saving them
import { useState, useEffect } from 'react'
import Dashboard from './Dashboard.jsx'
import Home from './Home.jsx'
import Requests from './Requests.jsx'
import { Loading } from '../components/Contours.jsx'
import TaskDetails from '../components/TaskDetails.jsx'
import {
getTasks, getUsers, getRequests, saveTasks, updateStatus,
sendRequest, decideRequest, makeInvite, toRow, deleteTask, removeFromProject, setMemberRole, transferOwnership, onChange,
} from '../db.js'
import { roleName, roleIcon } from '../labels.js'
import { shiftTask, toDateStr, analyzeTasks } from '../engine/schedule.js'

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

//this is for the invite tab (the made invite remembers which role it is for)
const [inviteRole, setInviteRole] = useState('member')
const [invite, setInvite] = useState(null)
const [copied, setCopied] = useState(false)

//this is for loading everything when the page opens, then again whenever anyone changes something (live updates)
useEffect(() => {
    load()
    return onChange(['tasks', 'requests', 'roles'], load)
}, [])

async function load() {
    try {
    const [taskList, userList, requestList] = await Promise.all([
        getTasks(project.id),
        getUsers(project.id),
        getRequests(project.id),
    ])
    setTasks(taskList)
    setUsers(userList)
    setRequests(requestList)
    } catch (e) {
    setMessage(e.message)
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
async function changeTasks(newTasks) {
    setMessage('')
    const full = newTasks.map(t => ({ status: 'not_done', finishedAt: null, ...t }))
    const changed = full.filter(t => {
    const old = tasks.find(o => o.id === t.id)
    return !old || JSON.stringify(toRow(old, project.id)) !== JSON.stringify(toRow(t, project.id))
    })
    setTasks(full)
    try {
    await saveTasks(project.id, changed)
    } catch (e) {
    setMessage('Could not save: ' + e.message)
    load()
    }
}

//this is for changing the status of one task
async function changeStatus(id, status) {
    setMessage('')
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, status: status, finishedAt: status === 'done' ? new Date().toISOString() : null } : t)))
    try {
    await updateStatus(id, status)
    } catch (e) {
    setMessage('Could not change status: ' + e.message)
    load()
    }
}

//this is for an admin changing who a task is assigned to
function assign(taskId, personId) {
    changeTasks(tasks.map(t => (t.id === taskId ? { ...t, assignedTo: personId || null } : t)))
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
    } catch (e) {
    setMessage(e.message)
    }
}

//this is for approving or denying a request (approving moves the task and the tasks that wait for it)
async function decide(req, approve) {
    setMessage('')
    const task = tasks.find(t => t.id === req.taskId)

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
    setMessage(e.message)
    loadRequests()
    return
    }

    //this is for moving the task after the approval is saved (date requests)
    if (approve && task && isExtension) await changeTasks(shiftTask(tasks, task.id, req.days))
    //this is for a status request: the database already changed the status, so load the tasks again
    if (approve && req.kind === 'status') await load()
    loadRequests()
}

//this is for deleting a task (the tasks that waited for it stop waiting)
async function removeTask(id) {
    if (!confirm('Delete this task?')) return
    setMessage('')
    try {
    await deleteTask(id)
    setSelectedId(null)
    await changeTasks(tasks.filter(t => t.id !== id).map(t => ({ ...t, dependsOn: t.dependsOn.filter(d => d !== id) })))
    } catch (e) {
    setMessage(e.message)
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
    setMessage(e.message)
    }
}

//this is for making someone an admin or a member
async function changeRole(person, role) {
    setMessage('')
    try {
    await setMemberRole(project.id, person.id, role)
    load()
    } catch (e) {
    setMessage(e.message)
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
    setMessage(e.message)
    }
}

//this is for making an invite link
async function handleInvite() {
    setMessage('')
    try {
    const code = await makeInvite(project.id, inviteRole, userId)
    setCopied(false)
    setInvite({ role: inviteRole, link: window.location.origin + window.location.pathname + '#join=' + code })
    } catch (e) {
    setMessage(e.message)
    }
}

if (loading) return <Loading />

//this is for the open details panel and the waiting request on that task
const selected = tasks.find(t => t.id === selectedId)
const { analysis, error: analysisError } = analyzeTasks(tasks)
const pendingCount = requests.filter(r => r.status === 'pending').length

return (
    <div>
    <p className="eyebrow">Project · {roleName(project.role, project.isOwner)}</p>
    <h1>{project.name}</h1>
    {project.description && <p className="desc">{project.description}</p>}
    {isOwner
    ? <p className="who">You own this project. Make another admin the owner (Invite tab) before you can leave.</p>
    : <p><button className="link small with-icon" onClick={() => removePerson({ id: userId })}><img src="/icons/leave.svg" alt="" width="16" height="16" /> Leave project</button></p>}

    {/*this is for the tabs (the open one is underlined)*/}
    <nav className="tabs" aria-label="Project sections">
        <button onClick={() => setTab('dashboard')} aria-current={tab === 'dashboard' ? 'page' : undefined}><img src="/icons/tasks.svg" alt="" width="18" height="18" /> Tasks</button>
        <button onClick={() => setTab('timeline')} aria-current={tab === 'timeline' ? 'page' : undefined}><img src="/icons/timeline.svg" alt="" width="18" height="18" /> Timeline</button>
        <button onClick={() => setTab('requests')} aria-current={tab === 'requests' ? 'page' : undefined}>
        <img src="/icons/inbox.svg" alt="" width="18" height="18" /> Requests{isAdmin && pendingCount > 0 ? ' (' + pendingCount + ')' : ''}
        </button>
        {isAdmin && <button onClick={() => setTab('invite')} aria-current={tab === 'invite' ? 'page' : undefined}><img src="/icons/user-plus.svg" alt="" width="18" height="18" /> Invite</button>}
    </nav>

    {message && <div className="error-box" role="alert">{message}</div>}

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
        onClose={() => setSelectedId(null)}
        onStatus={changeStatus}
        onAssign={assign}
        onAsk={ask}
        onDecide={decide}
        onDelete={removeTask}
        />
    )}

    {tab === 'dashboard' && <Dashboard tasks={tasks} userId={userId} onStatus={changeStatus} onOpen={setSelectedId} />}

    {tab === 'timeline' && <Home tasks={tasks} users={users} analysis={analysis} error={analysisError} isAdmin={isAdmin} onChange={changeTasks} onOpen={setSelectedId} />}

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
            {u.id !== userId && !u.isOwner && (
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
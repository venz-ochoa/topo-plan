//this is for the project page: tabs, loading tasks and requests, and saving them
import { useState, useEffect } from 'react'
import Dashboard from './Dashboard.jsx'
import Home from './Home.jsx'
import Requests from './Requests.jsx'
import TaskDetails from '../components/TaskDetails.jsx'
import {
getTasks, getUsers, getRequests, saveTasks, updateStatus,
sendRequest, decideRequest, makeInvite, toRow,
} from '../db.js'
import { shiftTask, toDateStr, analyzeTasks } from '../engine/schedule.js'

export default function Project({ project, userId, initialTaskId = null }) {
//this is for knowing if the user can edit the timeline
const isAdmin = project.role === 'admin'

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

//this is for loading everything when the page opens, then checking for new requests every 30 seconds
useEffect(() => {
    load()
    const timer = setInterval(loadRequests, 30000)
    return () => clearInterval(timer)
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

//this is for making an invite link
async function handleInvite() {
    setMessage('')
    try {
    const code = await makeInvite(project.id, inviteRole, userId)
    setInvite({ role: inviteRole, link: window.location.origin + window.location.pathname + '#join=' + code })
    } catch (e) {
    setMessage(e.message)
    }
}

if (loading) return <p>Loading...</p>

//this is for the open details panel and the waiting request on that task
const selected = tasks.find(t => t.id === selectedId)
const { analysis, error: analysisError } = analyzeTasks(tasks)
const pendingCount = requests.filter(r => r.status === 'pending').length

return (
    <div>
    <h1>{project.name}</h1>
    {project.description && <p className="desc">{project.description}</p>}
    <p>You are {isAdmin ? 'an admin' : 'a member'}.</p>

    <nav>
        <button onClick={() => setTab('dashboard')}>Tasks</button>
        <button onClick={() => setTab('timeline')}>Timeline</button>
        <button onClick={() => setTab('requests')}>
        Requests{isAdmin && pendingCount > 0 ? ' (' + pendingCount + ')' : ''}
        </button>
        {isAdmin && <button onClick={() => setTab('invite')}>Invite</button>}
        <button onClick={load}>Refresh</button>
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
        />
    )}

    {tab === 'dashboard' && <Dashboard tasks={tasks} userId={userId} onStatus={changeStatus} onOpen={setSelectedId} />}

    {tab === 'timeline' && <Home tasks={tasks} users={users} analysis={analysis} error={analysisError} isAdmin={isAdmin} onChange={changeTasks} onOpen={setSelectedId} />}

    {tab === 'requests' && <Requests requests={requests} tasks={tasks} users={users} isAdmin={isAdmin} onDecide={decide} />}

    {/*this is for the invite tab, only admins can open it*/}
    {tab === 'invite' && isAdmin && (
        <div>
        <h2>Invite someone</h2>
        <label htmlFor="invite-role">They will be a</label>
        <select id="invite-role" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            <option value="member">Member (can update their own tasks)</option>
            <option value="admin">Admin (can edit everything)</option>
        </select>
        <button onClick={handleInvite}>Make invite link</button>

        {invite && (
            <div>
            <p>This link makes them {invite.role === 'admin' ? 'an admin' : 'a member'}. It works once and expires in 7 days.</p>
            <input readOnly value={invite.link} aria-label="Invite link" />
            <button onClick={() => navigator.clipboard.writeText(invite.link)}>Copy</button>
            </div>
        )}

        <h3>Team ({users.length})</h3>
        {users.map(u => (
            <p key={u.id}>{u.name} ({u.role})</p>
        ))}
        </div>
    )}
    </div>
)
}
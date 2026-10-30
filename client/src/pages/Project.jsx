//this is for the project page: tabs, loading tasks, and saving them
import { useState, useEffect } from 'react'
import Dashboard from './Dashboard.jsx'
import Home from './Home.jsx'
import { getTasks, getUsers, saveTasks, updateStatus, makeInvite, toRow } from '../db.js'

export default function Project({ project, userId }) {
  //this is for knowing if the user can edit the timeline
  const isAdmin = project.role === 'admin'

  const [tab, setTab] = useState('dashboard')
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  //this is for the invite tab (the made invite remembers which role it is for)
  const [inviteRole, setInviteRole] = useState('member')
  const [invite, setInvite] = useState(null)

  //this is for loading the tasks and users when the page opens
  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const [taskList, userList] = await Promise.all([getTasks(project.id), getUsers(project.id)])
      setTasks(taskList)
      setUsers(userList)
    } catch (e) {
      setMessage(e.message)
    }
    setLoading(false)
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

  return (
    <div>
      <h1>{project.name}</h1>
      <p>You are {isAdmin ? 'an admin' : 'a member'}.</p>

      <nav>
        <button onClick={() => setTab('dashboard')}>Dashboard</button>
        <button onClick={() => setTab('timeline')}>Timeline</button>
        {isAdmin && <button onClick={() => setTab('invite')}>Invite</button>}
        <button onClick={load}>Refresh</button>
      </nav>

      {message && <div className="error-box" role="alert">{message}</div>}

      {tab === 'dashboard' && <Dashboard tasks={tasks} onStatus={changeStatus} />}

      {tab === 'timeline' && <Home tasks={tasks} users={users} isAdmin={isAdmin} onChange={changeTasks} />}

      {/*this is for the invite tab, only admins can open it*/}
      {tab === 'invite' && isAdmin && (
        <div>
          <h2>Invite someone</h2>
          <label htmlFor="invite-role">They will be a</label>
          <select id="invite-role" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            <option value="member">Member (can update task status)</option>
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
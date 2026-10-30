//this is for the profile page: your projects, your name, your password
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { getMyName, saveMyName } from '../db.js'

export default function Profile({ projects, currentId, userId, email, onOpen, onAdd }) {
  //this is for the values in the boxes
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')

  //this is for the messages under each form (bad = true shows it as an error)
  const [nameMsg, setNameMsg] = useState({ text: '', bad: false })
  const [passMsg, setPassMsg] = useState({ text: '', bad: false })
  const [busy, setBusy] = useState(false)

  //this is for loading the current name when the page opens
  useEffect(() => {
    getMyName(userId)
      .then(setName)
      .catch(e => setNameMsg({ text: e.message, bad: true }))
  }, [userId])

  //this is for saving the new name
  async function handleName(e) {
    e.preventDefault()
    if (!name.trim()) {
      setNameMsg({ text: 'Name cannot be empty.', bad: true })
      return
    }
    setBusy(true)
    try {
      await saveMyName(userId, name.trim())
      setNameMsg({ text: 'Name saved.', bad: false })
    } catch (err) {
      setNameMsg({ text: err.message, bad: true })
    }
    setBusy(false)
  }

  //this is for changing the password
  async function handlePassword(e) {
    e.preventDefault()
    if (password.length < 8) {
      setPassMsg({ text: 'Password must be at least 8 characters.', bad: true })
      return
    }
    if (password !== again) {
      setPassMsg({ text: 'The two passwords do not match.', bad: true })
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setPassMsg({ text: error.message, bad: true })
      return
    }
    setPassword('')
    setAgain('')
    setPassMsg({ text: 'Password changed.', bad: false })
  }

  return (
    <div>
      <h2>Your profile</h2>
      <p>Email: {email}</p>

      {/*this is for the list of projects, with the role in each one*/}
      <h3>Your projects ({projects.length})</h3>
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            {p.name}: {p.role === 'admin' ? 'Admin' : 'Member'}{' '}
            {p.id === currentId ? '(open now)' : <button onClick={() => onOpen(p.id)}>Open</button>}
          </li>
        ))}
      </ul>
      <button onClick={onAdd}>Join or start another project</button>

      <form className="add-task" onSubmit={handleName}>
        <h3>Change name</h3>
        <div className="field span-2">
          <label htmlFor="profile-name">Name (teammates see this)</label>
          <input id="profile-name" required maxLength={60} value={name} onChange={e => setName(e.target.value)} />
        </div>
        {nameMsg.text && (
          <div className={nameMsg.bad ? 'error-box' : ''} role={nameMsg.bad ? 'alert' : 'status'}>{nameMsg.text}</div>
        )}
        <div className="form-footer">
          <button type="submit" disabled={busy}>Save name</button>
        </div>
      </form>

      <form className="add-task" onSubmit={handlePassword}>
        <h3>Change password</h3>
        <div className="field span-2">
          <label htmlFor="profile-password">New password (8+ characters)</label>
          <input id="profile-password" type="password" autoComplete="new-password" required
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="field span-2">
          <label htmlFor="profile-again">Type it again</label>
          <input id="profile-again" type="password" autoComplete="new-password" required
            value={again} onChange={e => setAgain(e.target.value)} />
        </div>
        {passMsg.text && (
          <div className={passMsg.bad ? 'error-box' : ''} role={passMsg.bad ? 'alert' : 'status'}>{passMsg.text}</div>
        )}
        <div className="form-footer">
          <button type="submit" disabled={busy}>Change password</button>
        </div>
      </form>
    </div>
  )
}
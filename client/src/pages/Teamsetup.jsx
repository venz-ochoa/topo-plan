//this is for the screen where someone joins a project with an invite code (starting a project has its own screen)
import { useState } from 'react'
import { joinProject } from '../db.js'

export default function TeamSetup({ inviteCode, onDone, onCancel, onCreate }) {
//this is for the value in the box (the code is filled in if it came from a link)
const [code, setCode] = useState(inviteCode)
const [error, setError] = useState('')
const [busy, setBusy] = useState(false)

//this is for joining with an invite code
async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
    const id = await joinProject(code.trim().toLowerCase())
    //this is for removing the code from the address bar
    window.history.replaceState(null, '', window.location.pathname)
    onDone(id)
    } catch (err) {
    setError(err.message)
    }
    setBusy(false)
}

return (
    <div>
    <h2>Join a project</h2>
    <button type="button" onClick={onCancel}>Back</button>

    {error && <div className="error-box" role="alert">{error}</div>}

    <form className="add-task" onSubmit={handleJoin}>
        <h3>I have an invite code</h3>
        <div className="field span-2">
        <label htmlFor="join-code">Invite code</label>
        <input id="join-code" required value={code} onChange={e => setCode(e.target.value)} />
        </div>
        <div className="form-footer">
        <button type="submit" disabled={busy}>Join project</button>
        </div>
    </form>

    <p>Want to start your own instead? <button type="button" onClick={onCreate}>New project</button></p>
    </div>
)
}
